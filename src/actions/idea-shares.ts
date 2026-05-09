'use server'

import { createClient } from '@/lib/supabase/server'
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
    return { error: error.message }
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
  if (error) return { error: error.message }

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
 * Antal delinger pr. idé for current user. Bruges til badge "delt med N".
 */
export async function getShareCountsByIdea(): Promise<Map<string, number>> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('idea_shares')
    .select('idea_id, ideas!inner(user_id)')
    .eq('ideas.user_id', userId)

  const counts = new Map<string, number>()
  for (const r of (data ?? []) as { idea_id: string }[]) {
    counts.set(r.idea_id, (counts.get(r.idea_id) ?? 0) + 1)
  }
  return counts
}

/**
 * Idéer andre brugere har delt med current user.
 */
export async function getIdeasSharedWithMe(): Promise<SharedIdea[]> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  // Hent share-rækker for current user (RLS sikrer at vi kun ser egne)
  const { data: shares } = await supabase
    .from('idea_shares')
    .select('idea_id, shared_by_user_id, created_at')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
  if (!shares || shares.length === 0) return []

  const ideaIds = shares.map(s => s.idea_id as string)
  const sharerIds = Array.from(new Set(shares.map(s => s.shared_by_user_id as string)))

  // Hent idéerne (RLS lader os læse dem fordi vi er recipients)
  const { data: ideas } = await supabase
    .from('ideas')
    .select('*')
    .in('id', ideaIds)

  // Slå sharer-labels op
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: sharerIds })
  const labelById = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) labelById.set(r.id, r)

  // Behold rækkefølgen fra shares (nyeste deling først)
  const ideaById = new Map<string, typeof ideas extends (infer T)[] | null ? T : never>()
  for (const i of ideas ?? []) ideaById.set(i.id as string, i)

  const result: SharedIdea[] = []
  for (const s of shares) {
    const i = ideaById.get(s.idea_id as string)
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
      ownerLabel: pickLabel(labelById.get(s.shared_by_user_id as string)),
      sharedAt: s.created_at as string,
    })
  }
  return result
}
