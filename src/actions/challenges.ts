'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface UserLabelRow {
  id: string
  username: string | null
  display_name: string | null
}
function pickLabel(r: UserLabelRow | undefined | null): string {
  if (!r) return 'Ukendt bruger'
  return r.display_name?.trim() || r.username || 'Ukendt bruger'
}

export interface Challenge {
  id: string
  groupId: string
  title: string
  description: string | null
  prompt: string | null
  startsAt: string
  endsAt: string | null
  coverImageUrl: string | null
  createdBy: string
  createdAt: string
  isActive: boolean
  entryCount: number
  /** Min egen entry hvis jeg har en */
  myEntry: ChallengeEntry | null
}

export interface ChallengeEntry {
  id: string
  challengeId: string
  userId: string
  authorLabel: string
  caption: string | null
  imageUrl: string | null
  createdAt: string
}

function isActiveNow(endsAt: string | null): boolean {
  if (!endsAt) return true
  return new Date(endsAt).getTime() > Date.now()
}

export async function getChallenges(groupId: string): Promise<Challenge[]> {
  const me = await getCurrentUser()
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('challenges')
    .select('*')
    .eq('group_id', groupId)
    .order('ends_at', { ascending: false, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(20)
  if (!rows || rows.length === 0) return []

  const ids = rows.map(r => r.id as string)
  const [entryCounts, myEntries] = await Promise.all([
    supabase.from('challenge_entries').select('challenge_id').in('challenge_id', ids),
    me
      ? supabase.from('challenge_entries').select('*').in('challenge_id', ids).eq('user_id', me.id)
      : Promise.resolve({ data: [] }),
  ])

  const counts = new Map<string, number>()
  for (const e of (entryCounts.data ?? []) as { challenge_id: string }[]) {
    counts.set(e.challenge_id, (counts.get(e.challenge_id) ?? 0) + 1)
  }
  const myByChallenge = new Map<string, ChallengeEntry>()
  for (const e of (myEntries.data ?? []) as Record<string, unknown>[]) {
    myByChallenge.set(e.challenge_id as string, {
      id: e.id as string,
      challengeId: e.challenge_id as string,
      userId: e.user_id as string,
      authorLabel: 'Dig',
      caption: (e.caption as string | null) ?? null,
      imageUrl: (e.image_url as string | null) ?? null,
      createdAt: e.created_at as string,
    })
  }

  return rows.map(r => ({
    id: r.id as string,
    groupId: r.group_id as string,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    prompt: (r.prompt as string | null) ?? null,
    startsAt: r.starts_at as string,
    endsAt: (r.ends_at as string | null) ?? null,
    coverImageUrl: (r.cover_image_url as string | null) ?? null,
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
    isActive: isActiveNow((r.ends_at as string | null) ?? null),
    entryCount: counts.get(r.id as string) ?? 0,
    myEntry: myByChallenge.get(r.id as string) ?? null,
  }))
}

export async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const me = await getCurrentUser()
  const supabase = await createClient()

  const { data: r } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .maybeSingle()
  if (!r) return null

  const [{ count }, myEntry] = await Promise.all([
    supabase.from('challenge_entries').select('id', { count: 'exact', head: true }).eq('challenge_id', challengeId),
    me
      ? supabase.from('challenge_entries').select('*').eq('challenge_id', challengeId).eq('user_id', me.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const my = myEntry.data
  return {
    id: r.id as string,
    groupId: r.group_id as string,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    prompt: (r.prompt as string | null) ?? null,
    startsAt: r.starts_at as string,
    endsAt: (r.ends_at as string | null) ?? null,
    coverImageUrl: (r.cover_image_url as string | null) ?? null,
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
    isActive: isActiveNow((r.ends_at as string | null) ?? null),
    entryCount: count ?? 0,
    myEntry: my ? {
      id: my.id as string,
      challengeId: my.challenge_id as string,
      userId: my.user_id as string,
      authorLabel: 'Dig',
      caption: (my.caption as string | null) ?? null,
      imageUrl: (my.image_url as string | null) ?? null,
      createdAt: my.created_at as string,
    } : null,
  }
}

export async function getChallengeEntries(challengeId: string): Promise<ChallengeEntry[]> {
  await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('challenge_entries')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })
  if (!data || data.length === 0) return []

  const ids = Array.from(new Set(data.map(r => r.user_id as string)))
  const { data: labels } = await supabase
    .rpc('get_user_labels_by_ids', { p_ids: ids })
  const byId = new Map<string, UserLabelRow>()
  for (const r of (labels as UserLabelRow[] | null) ?? []) byId.set(r.id, r)

  return data.map(r => ({
    id: r.id as string,
    challengeId: r.challenge_id as string,
    userId: r.user_id as string,
    authorLabel: pickLabel(byId.get(r.user_id as string)),
    caption: (r.caption as string | null) ?? null,
    imageUrl: (r.image_url as string | null) ?? null,
    createdAt: r.created_at as string,
  }))
}

export async function createChallenge(input: {
  groupId: string
  title: string
  description?: string
  prompt?: string
  endsAt?: string
  coverImageUrl?: string
}): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const title = input.title.trim()
  if (!title) return { error: 'Titel er påkrævet' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      group_id: input.groupId,
      title,
      description: input.description?.trim() || null,
      prompt: input.prompt?.trim() || null,
      ends_at: input.endsAt || null,
      cover_image_url: input.coverImageUrl ?? null,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette challenge' }
  revalidatePath(`/grupper/${input.groupId}`)
  return { id: data.id as string }
}

export async function deleteChallenge(challengeId: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data: c } = await supabase
    .from('challenges')
    .select('group_id')
    .eq('id', challengeId)
    .maybeSingle()
  const { error } = await supabase.from('challenges').delete().eq('id', challengeId)
  if (error) return { error: error.message }
  if (c?.group_id) revalidatePath(`/grupper/${c.group_id}`)
  return { ok: true }
}

export async function submitChallengeEntry(input: {
  challengeId: string
  caption?: string
  imageUrl?: string
}): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const caption = input.caption?.trim() || null
  const imageUrl = input.imageUrl?.trim() || null
  if (!caption && !imageUrl) return { error: 'Skriv en note eller vedhæft et billede' }

  const supabase = await createClient()
  // Upsert: hvis brugeren allerede har et bidrag, opdatér det
  const { data, error } = await supabase
    .from('challenge_entries')
    .upsert(
      {
        challenge_id: input.challengeId,
        user_id: userId,
        caption,
        image_url: imageUrl,
      },
      { onConflict: 'challenge_id,user_id' }
    )
    .select('id, challenge_id')
    .single()
  if (error || !data) return { error: error?.message ?? 'Kunne ikke gemme bidrag' }

  // Find group_id for revalidation
  const { data: c } = await supabase
    .from('challenges')
    .select('group_id')
    .eq('id', input.challengeId)
    .maybeSingle()
  if (c?.group_id) revalidatePath(`/grupper/${c.group_id}`)
  return { id: data.id as string }
}

// ============================================
// Sæson-challenges (system-niveau, ikke gruppe-bundne)
// ============================================

import {
  challengesForMonth, seasonalIdFor, challengeDateRange,
  type SeasonalChallengeTemplate,
} from '@/lib/seasonal-challenges'

export interface SeasonalChallenge extends Challenge {
  seasonalSlug: string
  rewardBadgeId: string | null
}

/**
 * Sikrer at månedens sæson-challenges eksisterer i DB.
 * Inserts manglende rækker via SECURITY DEFINER-RPC.
 */
async function ensureSeasonalChallengesFor(month: number, year: number): Promise<void> {
  const templates = challengesForMonth(month)
  if (templates.length === 0) return

  const supabase = await createClient()
  const { startsAt, endsAt } = challengeDateRange(month, year)

  await Promise.all(
    templates.map(async (t: SeasonalChallengeTemplate) => {
      const seasonalId = seasonalIdFor(t.slug, year)
      try {
        await supabase.rpc('ensure_seasonal_challenge', {
          p_seasonal_id: seasonalId,
          p_title: t.title,
          p_description: t.description,
          p_prompt: t.prompt,
          p_starts_at: startsAt,
          p_ends_at: endsAt,
          p_reward_badge_id: t.rewardBadgeId ?? null,
          p_cover_image_url: null,
        })
      } catch { /* ignore — idempotent kald */ }
    })
  )
}

/**
 * Hent aktive sæson-challenges. Bruger måneden + året som scope og
 * sikrer at de findes i DB inden de hentes.
 */
export async function getActiveSeasonalChallenges(): Promise<SeasonalChallenge[]> {
  const me = await getCurrentUser()
  if (!me) return []
  const supabase = await createClient()

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Sikr at månedens challenges eksisterer
  await ensureSeasonalChallengesFor(month, year)

  // Hent alle seasonal-challenges der er aktive (ends_at > now eller NULL)
  const { data: rows } = await supabase
    .from('challenges')
    .select('*')
    .eq('challenge_type', 'seasonal')
    .or(`ends_at.is.null,ends_at.gt.${now.toISOString()}`)
    .order('ends_at', { ascending: true })
  if (!rows || rows.length === 0) return []

  const ids = rows.map(r => r.id as string)
  const [entryCounts, myEntries] = await Promise.all([
    supabase.from('challenge_entries').select('challenge_id').in('challenge_id', ids),
    supabase.from('challenge_entries').select('*').in('challenge_id', ids).eq('user_id', me.id),
  ])

  const counts = new Map<string, number>()
  for (const e of (entryCounts.data ?? []) as { challenge_id: string }[]) {
    counts.set(e.challenge_id, (counts.get(e.challenge_id) ?? 0) + 1)
  }
  const myByChallenge = new Map<string, ChallengeEntry>()
  for (const e of (myEntries.data ?? []) as Record<string, unknown>[]) {
    myByChallenge.set(e.challenge_id as string, {
      id: e.id as string,
      challengeId: e.challenge_id as string,
      userId: e.user_id as string,
      authorLabel: 'Dig',
      caption: (e.caption as string | null) ?? null,
      imageUrl: (e.image_url as string | null) ?? null,
      createdAt: e.created_at as string,
    })
  }

  return rows.map(r => ({
    id: r.id as string,
    groupId: '', // ikke gruppe-bundet
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    prompt: (r.prompt as string | null) ?? null,
    startsAt: r.starts_at as string,
    endsAt: (r.ends_at as string | null) ?? null,
    coverImageUrl: (r.cover_image_url as string | null) ?? null,
    createdBy: (r.created_by as string | null) ?? '',
    createdAt: r.created_at as string,
    isActive: isActiveNow((r.ends_at as string | null) ?? null),
    entryCount: counts.get(r.id as string) ?? 0,
    myEntry: myByChallenge.get(r.id as string) ?? null,
    seasonalSlug: (r.seasonal_id as string).replace(/-\d{4}$/, ''),
    rewardBadgeId: (r.reward_badge_id as string | null) ?? null,
  }))
}

/**
 * Vis seneste sæson-challenges hvor brugeren har bidraget. Bruges på /havebog.
 */
export async function getMySeasonalParticipations(): Promise<{
  total: number
  recent: SeasonalChallenge[]
}> {
  const me = await getCurrentUser()
  if (!me) return { total: 0, recent: [] }
  const supabase = await createClient()

  const { data: myEntries } = await supabase
    .from('challenge_entries')
    .select('challenge_id, caption, image_url, created_at, challenges!inner(*)')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!myEntries || myEntries.length === 0) return { total: 0, recent: [] }

  type EntryRow = {
    challenge_id: string
    caption: string | null
    image_url: string | null
    created_at: string
    challenges: Record<string, unknown> | Record<string, unknown>[]
  }
  const rows = myEntries as unknown as EntryRow[]
  const seasonalOnly = rows.filter(r => {
    const c = Array.isArray(r.challenges) ? r.challenges[0] : r.challenges
    return c?.challenge_type === 'seasonal'
  })

  const recent: SeasonalChallenge[] = seasonalOnly.slice(0, 5).map(r => {
    const c = (Array.isArray(r.challenges) ? r.challenges[0] : r.challenges) as Record<string, unknown>
    return {
      id: c.id as string,
      groupId: '',
      title: c.title as string,
      description: (c.description as string | null) ?? null,
      prompt: (c.prompt as string | null) ?? null,
      startsAt: c.starts_at as string,
      endsAt: (c.ends_at as string | null) ?? null,
      coverImageUrl: (c.cover_image_url as string | null) ?? null,
      createdBy: '',
      createdAt: c.created_at as string,
      isActive: isActiveNow((c.ends_at as string | null) ?? null),
      entryCount: 0, // ikke relevant her
      myEntry: {
        id: '',
        challengeId: c.id as string,
        userId: me.id,
        authorLabel: 'Dig',
        caption: r.caption,
        imageUrl: r.image_url,
        createdAt: r.created_at,
      },
      seasonalSlug: ((c.seasonal_id as string) ?? '').replace(/-\d{4}$/, ''),
      rewardBadgeId: (c.reward_badge_id as string | null) ?? null,
    }
  })

  return { total: seasonalOnly.length, recent }
}

export async function withdrawChallengeEntry(entryId: string): Promise<{ ok: true } | { error: string }> {
  await requireUser()
  const supabase = await createClient()
  const { data: e } = await supabase
    .from('challenge_entries')
    .select('challenge_id, challenges!inner(group_id)')
    .eq('id', entryId)
    .maybeSingle()
  const { error } = await supabase.from('challenge_entries').delete().eq('id', entryId)
  if (error) return { error: error.message }
  type Ref = { group_id: string }
  const ref = e?.challenges as Ref | Ref[] | undefined
  const groupId = Array.isArray(ref) ? ref[0]?.group_id : ref?.group_id
  if (groupId) revalidatePath(`/grupper/${groupId}`)
  return { ok: true }
}
