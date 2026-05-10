'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import type { BadgeId } from '@/lib/badges-shared'

export interface UserBadge {
  badgeId: BadgeId
  awardedAt: string
}

/**
 * Tildel en badge til en bruger. Idempotent (silent skip ved duplikat).
 * Returnerer true hvis badgen er ny.
 */
export async function awardBadge(userId: string, badgeId: BadgeId): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('award_badge', { p_user_id: userId, p_badge_id: badgeId })
  if (error) return false
  return data === true
}

/**
 * Hent alle badges for en bruger.
 */
export async function getBadgesForUser(userId: string): Promise<UserBadge[]> {
  const me = await getCurrentUser()
  if (!me) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_badges')
    .select('badge_id, awarded_at')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: true })
  return ((data ?? []) as { badge_id: string; awarded_at: string }[]).map(r => ({
    badgeId: r.badge_id as BadgeId,
    awardedAt: r.awarded_at,
  }))
}

/**
 * Hent badges for flere brugere på én gang. Bruges til at vise badges
 * inde i lister af medlemmer.
 */
export async function getBadgesForUsers(userIds: string[]): Promise<Map<string, UserBadge[]>> {
  await requireUser()
  if (userIds.length === 0) return new Map()
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_badges')
    .select('user_id, badge_id, awarded_at')
    .in('user_id', userIds)
  const map = new Map<string, UserBadge[]>()
  for (const r of ((data ?? []) as { user_id: string; badge_id: string; awarded_at: string }[])) {
    const list = map.get(r.user_id) ?? []
    list.push({ badgeId: r.badge_id as BadgeId, awardedAt: r.awarded_at })
    map.set(r.user_id, list)
  }
  return map
}

// ============================================
// Tildelings-regler
// ============================================
//
// Disse funktioner kaldes fra de relevante mutations som "fire-and-forget".
// De evaluerer om brugeren har optjent en badge nu og tildeler den.

/**
 * Forsøg first_post-badge: brugeren har skrevet sit første forum-opslag.
 */
export async function maybeAwardFirstPost(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('forum_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if ((count ?? 0) >= 1) await awardBadge(userId, 'first_post')
}

/**
 * Forsøg seed_keeper-badge: brugeren har et frøbytte-tilbud (offer).
 */
export async function maybeAwardSeedKeeper(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('seed_swap_listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', 'offer')
  if ((count ?? 0) >= 1) await awardBadge(userId, 'seed_keeper')
}

/**
 * Forsøg community_starter-badge: brugeren har oprettet en gruppe.
 */
export async function maybeAwardCommunityStarter(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('user_groups')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
  if ((count ?? 0) >= 1) await awardBadge(userId, 'community_starter')
}

/**
 * Forsøg helpful-badge: et af brugerens svar er markeret som bedste svar.
 */
export async function maybeAwardHelpful(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('forum_replies')
    .select('id, forum_posts!inner(best_reply_id)')
    .eq('user_id', userId)
  type ReplyRow = { id: string; forum_posts: { best_reply_id: string | null } | { best_reply_id: string | null }[] }
  const hasBest = ((data ?? []) as unknown as ReplyRow[]).some(r => {
    const fp = Array.isArray(r.forum_posts) ? r.forum_posts[0] : r.forum_posts
    return fp?.best_reply_id === r.id
  })
  if (hasBest) await awardBadge(userId, 'helpful')
}

/**
 * Forsøg green_thumb-badge: brugeren har markeret 'dyrker' på 3+ sorter.
 */
export async function maybeAwardGreenThumb(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('user_variety_status')
    .select('variety_id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'dyrker')
  if ((count ?? 0) >= 3) await awardBadge(userId, 'green_thumb')
}

/**
 * Forsøg curator-badge: brugeren har tilføjet 5+ sorter til grupper.
 */
export async function maybeAwardCurator(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('group_varieties')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
  if ((count ?? 0) >= 5) await awardBadge(userId, 'curator')
}
