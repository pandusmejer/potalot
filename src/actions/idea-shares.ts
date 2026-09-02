'use server'

import { createClient } from '@/lib/supabase/server'
import { dataFejlBesked } from '@/lib/data-fejl'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { Idea } from '@/lib/types'

interface UserLabelRow {
  id: string
  username: string | null
  display_name: string | null
}

function pickLabel(r: UserLabelRow | undefined | null): string {
  if (!r) return 'Ukendt bruger'
  return r.display_name?.trim() || r.username || 'Ukendt bruger'
}

export interface ShareRecipient {
  userId: string
  label: string
}

export interface SharedIdea extends Idea {
  ownerLabel: string
  sharedAt: string
  /** Hvis idéen kom via en gruppe, navnet på gruppen. Ellers null = direkte. */
  viaGroupName: string | null
}

export interface IdeaGroupShare {
  groupId: string
  groupName: string
}

/**
 * Del en idé med en anden bruger via deres brugernavn. Owner-kun.
 */
export async function shareIdeaByUsername(
  ideaId: string,
  username: string
): Promise<{ ok: true; recipient: ShareRecipient } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const cleanUsername = username.trim().toLowerCase()
  if (!cleanUsername) return { error: 'Skriv et brugernavn' }
  if (cleanUsername.length < 3) return { error: 'Brugernavn er for kort (mindst 3 tegn)' }

  // Slå brugernavn op via SECURITY DEFINER-RPC
  const { data: lookup, error: rpcErr } = await supabase
    .rpc('find_user_by_username', { p_username: cleanUsername })
  if (rpcErr) return { error: 'Kunne ikke slå brugernavn op' }
  const target = (lookup as UserLabelRow[])[0]
  if (!target) return { error: `Ingen bruger med brugernavn "${cleanUsername}"` }
  if (target.id === userId) return { error: 'Du kan ikke dele en idé med dig selv' }

  // Verificér ejer-skab
  const { data: idea } = await supabase
    .from('ideas')
    .select('id')
    .eq('id', ideaId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!idea) return { error: 'Idé ikke fundet' }

  const { error } = await supabase
    .from('idea_shares')
    .insert({
      idea_id: ideaId,
      recipient_user_id: target.id,
      shared_by_user_id: userId,
    })
  if (error) {
    if (error.code === '23505') {
      return { error: `Idéen er allerede delt med ${pickLabel(target)}` }
    }
    return { error: dataFejlBesked(error, 'Kunne ikke dele idéen. Prøv igen.') }
  }

  revalidatePath('/idetavle')
  return { ok: true, recipient: { userId: target.id, label: pickLabel(target) } }
}

/**
 * Fjern en deling — owner-kun.
 */
export async function unshareIdea(
  ideaId: string,
  recipientUserId: string
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  // Verificér ejer-skab via JOIN i RLS-policy. Hvis brugeren ikke ejer
  // idéen rammer DELETE 0 rækker (ingen fejl), så vi tjekker først.
  const { data: idea } = await supabase
    .from('ideas')
    .select('id')
    .eq('id', ideaId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!idea) return { error: 'Idé ikke fundet' }

  const { error } = await supabase
    .from('idea_shares')
    .delete()
    .eq('idea_id', ideaId)
    .eq('recipient_user_id', recipientUserId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke stoppe delingen. Prøv igen.') }

  revalidatePath('/idetavle')
  return { ok: true }
}

/**
 * Modtagere af en specifik idé. Owner-kun.
 */
export async function getShareRecipients(ideaId: string): Promise<ShareRecipient[]> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: idea } = await supabase
    .from('ideas')
    .select('id')
    .eq('id', ideaId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!idea) return []

  const { data: shares } = await supabase
    .from('idea_shares')
    .select('recipient_user_id')
    .eq('idea_id', ideaId)
  if (!shares || shares.length === 0) return []

  const ids = shares.map(s => s.recipient_user_id as string)
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  return ids.map(id => ({ userId: id, label: pickLabel(byId.get(id)) }))
}

/**
 * Del en idé med en hel gruppe. Owner-kun, og man skal være medlem af gruppen.
 */
export async function shareIdeaWithGroup(
  ideaId: string,
  groupId: string
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: idea } = await supabase
    .from('ideas')
    .select('id')
    .eq('id', ideaId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!idea) return { error: 'Idé ikke fundet' }

  const { error } = await supabase
    .from('idea_group_shares')
    .insert({ idea_id: ideaId, group_id: groupId, shared_by_user_id: userId })
  if (error) {
    if (error.code === '23505') return { error: 'Idéen er allerede delt med denne gruppe' }
    return { error: dataFejlBesked(error, 'Kunne ikke dele idéen med gruppen. Prøv igen.') }
  }

  revalidatePath('/idetavle')
  return { ok: true }
}

export async function unshareIdeaFromGroup(
  ideaId: string,
  groupId: string
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: idea } = await supabase
    .from('ideas')
    .select('id')
    .eq('id', ideaId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!idea) return { error: 'Idé ikke fundet' }

  const { error } = await supabase
    .from('idea_group_shares')
    .delete()
    .eq('idea_id', ideaId)
    .eq('group_id', groupId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke stoppe delingen med gruppen. Prøv igen.') }

  revalidatePath('/idetavle')
  return { ok: true }
}

/**
 * Hvilke grupper er en idé allerede delt med? Owner-kun.
 */
export async function getGroupSharesForIdea(ideaId: string): Promise<IdeaGroupShare[]> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: idea } = await supabase
    .from('ideas')
    .select('id')
    .eq('id', ideaId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!idea) return []

  const { data: shares } = await supabase
    .from('idea_group_shares')
    .select('group_id, user_groups!inner(name)')
    .eq('idea_id', ideaId)

  return ((shares ?? []) as unknown as { group_id: string; user_groups: { name: string } | { name: string }[] }[])
    .map(s => {
      const ug = Array.isArray(s.user_groups) ? s.user_groups[0] : s.user_groups
      return { groupId: s.group_id, groupName: ug?.name ?? 'Ukendt gruppe' }
    })
}

/**
 * Antal delinger pr. idé for current user (direkte + gruppe-delinger).
 * Bruges til badge "delt med N".
 */
export async function getShareCountsByIdea(): Promise<Map<string, number>> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const counts = new Map<string, number>()

  const { data: direct } = await supabase
    .from('idea_shares')
    .select('idea_id, ideas!inner(user_id)')
    .eq('ideas.user_id', userId)
  for (const r of (direct ?? []) as { idea_id: string }[]) {
    counts.set(r.idea_id, (counts.get(r.idea_id) ?? 0) + 1)
  }

  const { data: groupShares } = await supabase
    .from('idea_group_shares')
    .select('idea_id, ideas!inner(user_id)')
    .eq('ideas.user_id', userId)
  for (const r of (groupShares ?? []) as { idea_id: string }[]) {
    counts.set(r.idea_id, (counts.get(r.idea_id) ?? 0) + 1)
  }

  return counts
}

/**
 * Idéer andre brugere har delt med current user — både direkte og via grupper.
 * Hvis samme idé er delt på begge måder beholdes kun én række (nyeste deling).
 */
export async function getIdeasSharedWithMe(): Promise<SharedIdea[]> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  type ShareSource = {
    ideaId: string
    sharedByUserId: string
    sharedAt: string
    viaGroupName: string | null
  }

  const sources: ShareSource[] = []

  const { data: directShares } = await supabase
    .from('idea_shares')
    .select('idea_id, shared_by_user_id, created_at')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
  for (const s of (directShares ?? []) as { idea_id: string; shared_by_user_id: string; created_at: string }[]) {
    sources.push({
      ideaId: s.idea_id,
      sharedByUserId: s.shared_by_user_id,
      sharedAt: s.created_at,
      viaGroupName: null,
    })
  }

  // Find grupper jeg er medlem af
  const { data: myGroups } = await supabase
    .from('user_group_memberships')
    .select('group_id')
    .eq('user_id', userId)
  const myGroupIds = (myGroups ?? []).map(m => m.group_id as string)

  if (myGroupIds.length > 0) {
    const { data: groupShares } = await supabase
      .from('idea_group_shares')
      .select('idea_id, group_id, shared_by_user_id, created_at, user_groups!inner(name)')
      .in('group_id', myGroupIds)
      .order('created_at', { ascending: false })
    type GroupShareRow = {
      idea_id: string
      shared_by_user_id: string
      created_at: string
      user_groups: { name: string } | { name: string }[]
    }
    for (const s of ((groupShares ?? []) as unknown as GroupShareRow[])) {
      const ug = Array.isArray(s.user_groups) ? s.user_groups[0] : s.user_groups
      sources.push({
        ideaId: s.idea_id,
        sharedByUserId: s.shared_by_user_id,
        sharedAt: s.created_at,
        viaGroupName: ug?.name ?? 'Ukendt gruppe',
      })
    }
  }

  if (sources.length === 0) return []

  // Dedupliker: én række pr. idé (behold den nyeste deling)
  sources.sort((a, b) => b.sharedAt.localeCompare(a.sharedAt))
  const seen = new Set<string>()
  const dedupedSources: ShareSource[] = []
  for (const s of sources) {
    if (seen.has(s.ideaId)) continue
    seen.add(s.ideaId)
    dedupedSources.push(s)
  }

  const ideaIds = dedupedSources.map(s => s.ideaId)
  const sharerIds = Array.from(new Set(dedupedSources.map(s => s.sharedByUserId)))

  const { data: ideas } = await supabase
    .from('ideas')
    .select('*')
    .in('id', ideaIds)

  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: sharerIds })
  const labelById = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) labelById.set(r.id, r)

  const ideaById = new Map<string, Record<string, unknown>>()
  for (const i of (ideas ?? []) as Record<string, unknown>[]) ideaById.set(i.id as string, i)

  const result: SharedIdea[] = []
  for (const s of dedupedSources) {
    const i = ideaById.get(s.ideaId)
    if (!i) continue
    result.push({
      id: i.id as string,
      userId: i.user_id as string,
      title: i.title as string,
      description: (i.description as string | null) ?? null,
      imageIds: (i.primary_image_url as string | null)
        ? [i.primary_image_url as string]
        : ((i.image_urls as string[] | null) ?? []),
      tags: (i.tags as string[] | null) ?? [],
      status: i.status as Idea['status'],
      targetYear: (i.target_year as number | null) ?? null,
      createdAt: i.created_at as string,
      updatedAt: i.updated_at as string,
      ownerLabel: pickLabel(labelById.get(s.sharedByUserId)),
      sharedAt: s.sharedAt,
      viaGroupName: s.viaGroupName,
    })
  }
  return result
}
