'use server'

import { createClient } from '@/lib/supabase/server'
import { dataFejlBesked } from '@/lib/data-fejl'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  ikkeRelevanteOpgaveIder,
  kalenderMaanedKbh,
  MASKINAFLEDT_KILDE,
  type ReminderKandidat,
} from '@/lib/kalender/reminder-relevans'

export interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string
  isRead: boolean
  createdAt: string
}

/**
 * Liste over current users notifikationer (nyeste først, max 30).
 */
export async function getMyNotifications(): Promise<Notification[]> {
  const me = await getCurrentUser()
  if (!me) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .limit(30)
  return ((data ?? []) as Array<{
    id: string
    type: string
    title: string
    body: string | null
    link: string
    is_read: boolean
    created_at: string
  }>).map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    link: r.link,
    isRead: r.is_read,
    createdAt: r.created_at,
  }))
}

/**
 * Fagligt udløbne dyrkningsopgaver (Anna 30/8).
 *
 * Henter brugerens ÅBNE maskin-afledte opgaver og spørger relevansmotoren,
 * om handlingen stadig er meningsfuld i denne måned. Returnerer en blokliste
 * til RPC'en — eller `null`, som betyder "ingen vurdering foretaget" og
 * lader SQL opføre sig præcis som før.
 *
 * Kun `source = 'guide'` hentes: det er den eneste maskin-afledte kilde, og
 * alt andet skal alligevel passere ufiltreret. Derfor er opslaget lille selv
 * for en have med mange opgaver.
 *
 * Der filtreres BEVIDST ikke på forfaldsdato her. En opgave, der endnu ikke
 * er forfalden, kan SQL alligevel ikke påminde om, så bloklisten bliver
 * hverken kortere eller mere korrekt af det — og listen genberegnes ved hvert
 * sync, så en opgave, hvis vindue åbner inden den forfalder, vurderes på ny.
 *
 * Fejler et af opslagene, returneres `null`. Et databaseudfald må aldrig
 * blive til "så er alle dine påmindelser vel irrelevante".
 */
async function findFagligtUdloebedeOpgaver(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string[] | null> {
  const { data: opgaver, error } = await supabase
    .from('calendar_tasks')
    .select('id, task_type, linked_plant_id')
    .eq('user_id', userId)
    .eq('source', MASKINAFLEDT_KILDE)
    .eq('status', 'open')
    .not('linked_plant_id', 'is', null)

  if (error || !opgaver) return null
  if (opgaver.length === 0) return []

  type OpgaveRow = { id: string; task_type: string; linked_plant_id: string }
  const rows = opgaver as OpgaveRow[]

  const planteIder = [...new Set(rows.map(r => r.linked_plant_id))]
  const { data: planter, error: planteFejl } = await supabase
    .from('plants_v2')
    .select('id, name, variety')
    .in('id', planteIder)

  if (planteFejl || !planter) return null

  const planteById = new Map(
    (planter as Array<{ id: string; name: string; variety: string | null }>)
      .map(p => [p.id, p]),
  )

  // Arten er nøglen til det canonical vindue. Kender vi ikke planten, kan vi
  // ikke dokumentere noget — og så udelades opgaven fra bloklisten (tavshed).
  const kandidater: ReminderKandidat[] = []
  for (const r of rows) {
    const plante = planteById.get(r.linked_plant_id)
    if (!plante) continue
    kandidater.push({
      id: r.id,
      source: MASKINAFLEDT_KILDE,
      taskType: r.task_type,
      plantName: plante.name,
      variety: plante.variety,
    })
  }

  return ikkeRelevanteOpgaveIder(kandidater, kalenderMaanedKbh())
}

/**
 * Generér deterministiske opgave-påmindelser (smal launch-notifikation).
 * Kalder den self-scopede SECURITY DEFINER-funktion sync_task_reminders,
 * som afleder FÅ, plante-knyttede påmindelser fra åbne forfaldne
 * calendar_tasks og enqueue'er dem — idempotent (dedup pr. opgave/dag).
 *
 * Siden 00071 sendes en blokliste med: de maskin-afledte dyrkningsopgaver,
 * hvis dokumenterede vindue er lukket denne måned. SQL ejer fortsat dedup,
 * loft og cleanup; TypeScript ejer alene fagligheden, fordi den kanoniske
 * vindue-model bor her (se reminder-relevans.ts).
 *
 * Best-effort: fejl må aldrig vælte topbaren.
 */
export async function syncTaskReminders(): Promise<void> {
  const me = await getCurrentUser()
  if (!me) return
  try {
    const supabase = await createClient()
    const udloebede = await findFagligtUdloebedeOpgaver(supabase, me.id)
    await supabase.rpc('sync_task_reminders', { p_ikke_relevante: udloebede })
  } catch {
    // Stille — påmindelser er sekundære til at siden loader.
  }
}

/**
 * Antal ulæste — bruges til badge i topbar.
 */
export async function getUnreadCount(): Promise<number> {
  const me = await getCurrentUser()
  if (!me) return 0
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', me.id)
    .eq('is_read', false)
  return count ?? 0
}

/**
 * Antal ulæste pr. gruppe — bruges til badge på gruppe-kort.
 * Returnerer Map<groupId, count> for ulæste notifikationer der har
 * en group_id reference.
 */
export async function getUnreadCountsByGroup(): Promise<Map<string, number>> {
  const me = await getCurrentUser()
  if (!me) return new Map()
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('group_id')
    .eq('user_id', me.id)
    .eq('is_read', false)
    .not('group_id', 'is', null)

  const counts = new Map<string, number>()
  for (const r of (data ?? []) as { group_id: string }[]) {
    counts.set(r.group_id, (counts.get(r.group_id) ?? 0) + 1)
  }
  return counts
}

export async function markNotificationRead(id: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke markere påmindelsen som læst. Prøv igen.') }
  revalidatePath('/grupper')
  return { ok: true }
}

export async function markAllNotificationsRead(): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke markere påmindelserne som læst. Prøv igen.') }
  revalidatePath('/')
  revalidatePath('/grupper')
  return { ok: true }
}

/**
 * Markér alle ulæste notifikationer for en specifik gruppe som læst.
 * Bruges når brugeren navigerer ind i gruppen — så kort-badgen ikke
 * vedbliver med at blinke efter at indholdet er set.
 */
export async function markGroupNotificationsRead(groupId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('group_id', groupId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke markere gruppens påmindelser som læst. Prøv igen.') }
  revalidatePath('/grupper')
  return { ok: true }
}

// ============================================================
// Pr. tab-kategori inde i en gruppe
// ============================================================

export type NotificationTabCategory =
  | 'chat'
  | 'forum'
  | 'ideas'
  | 'swap'
  | 'challenges'
  | 'members'

const TYPE_TO_CATEGORY: Record<string, NotificationTabCategory> = {
  group_chat: 'chat',
  forum_reply: 'forum',
  idea_group_shared: 'ideas',
  swap_request: 'swap',
  swap_accepted: 'swap',
  swap_declined: 'swap',
  challenge_started: 'challenges',
  group_join_request: 'members',
}

const CATEGORY_TO_TYPES: Record<NotificationTabCategory, string[]> = {
  chat: ['group_chat'],
  forum: ['forum_reply'],
  ideas: ['idea_group_shared'],
  swap: ['swap_request', 'swap_accepted', 'swap_declined'],
  challenges: ['challenge_started'],
  members: ['group_join_request'],
}

/**
 * Returnér ulæst-tæller pr. tab-kategori for en gruppe.
 * Bruges til badges på tab-triggers inde i gruppen.
 */
export async function getUnreadByCategoryForGroup(
  groupId: string
): Promise<Record<NotificationTabCategory, number>> {
  const me = await getCurrentUser()
  const empty: Record<NotificationTabCategory, number> = {
    chat: 0, forum: 0, ideas: 0, swap: 0, challenges: 0, members: 0,
  }
  if (!me) return empty

  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('type')
    .eq('user_id', me.id)
    .eq('is_read', false)
    .eq('group_id', groupId)

  const counts = { ...empty }
  for (const r of (data ?? []) as { type: string }[]) {
    const cat = TYPE_TO_CATEGORY[r.type]
    if (cat) counts[cat] += 1
  }
  return counts
}

/**
 * Markér alle ulæste notifikationer af en bestemt tab-kategori i en
 * gruppe som læst. Kaldes når brugeren klikker den fane.
 */
export async function markGroupCategoryNotificationsRead(
  groupId: string,
  category: NotificationTabCategory,
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const types = CATEGORY_TO_TYPES[category]
  if (!types || types.length === 0) return { ok: true }
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('group_id', groupId)
    .in('type', types)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke markere påmindelserne som læst. Prøv igen.') }
  revalidatePath('/grupper')
  revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}

export async function deleteNotification(id: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke slette påmindelsen. Prøv igen.') }
  return { ok: true }
}
