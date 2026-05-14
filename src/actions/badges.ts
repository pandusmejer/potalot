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

// ============================================
// Dyrkning / lifecycle helpers
// ============================================

/**
 * first_sowing: brugeren har sået sin første plante. Tæller alle planter
 * der har bevæget sig forbi 'planlagt' (status saaet/spirer/i_vaekst osv.).
 */
export async function maybeAwardFirstSowing(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('plants_v2')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'planlagt')
  if ((count ?? 0) >= 1) await awardBadge(userId, 'first_sowing')
}

/**
 * first_harvest: brugeren har enten en høst-log eller en plante med
 * status='hoestklar' eller højere.
 */
export async function maybeAwardFirstHarvest(userId: string): Promise<void> {
  const supabase = await createClient()
  // Tjek logs først (mest direkte signal)
  const { count: harvestLogs } = await supabase
    .from('plant_logs_v2')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'harvest')
  if ((harvestLogs ?? 0) >= 1) {
    await awardBadge(userId, 'first_harvest')
    return
  }
  // Fallback: status hoestklar eller afsluttet
  const { count: harvestStatus } = await supabase
    .from('plants_v2')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['hoestklar', 'afsluttet'])
  if ((harvestStatus ?? 0) >= 1) await awardBadge(userId, 'first_harvest')
}

/**
 * season_finisher: en plante er ført helt til 'afsluttet' (arkiveret eller
 * eksplicit sæsonen slut).
 */
export async function maybeAwardSeasonFinisher(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('plants_v2')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'afsluttet')
  if ((count ?? 0) >= 1) await awardBadge(userId, 'season_finisher')
}

/**
 * the_collector: 25+ items i frøbanken (inkluderer alle kategorier).
 */
export async function maybeAwardTheCollector(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('inventory_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if ((count ?? 0) >= 25) await awardBadge(userId, 'the_collector')
}

/**
 * master_apprentice: brugeren har en privat guide hvor plantenavn+sort
 * matcher en eksisterende master — dvs. de har klonet eller lavet egen
 * version af en kuratet guide.
 */
export async function maybeAwardMasterApprentice(userId: string): Promise<void> {
  const supabase = await createClient()
  // Hent brugerens private guides
  const { data: privateGuides } = await supabase
    .from('guides')
    .select('plant_name, variety')
    .eq('user_id', userId)
  if (!privateGuides || privateGuides.length === 0) return
  // Hent alle master plant_names (user_id IS NULL)
  const { data: masters } = await supabase
    .from('guides')
    .select('plant_name, variety')
    .is('user_id', null)
  if (!masters || masters.length === 0) return

  const masterKeys = new Set(
    (masters as { plant_name: string; variety: string | null }[]).map(
      m => `${m.plant_name.toLowerCase().trim()}|${(m.variety ?? '').toLowerCase().trim()}`
    )
  )
  const matches = (privateGuides as { plant_name: string; variety: string | null }[]).some(
    p => masterKeys.has(`${p.plant_name.toLowerCase().trim()}|${(p.variety ?? '').toLowerCase().trim()}`)
  )
  if (matches) await awardBadge(userId, 'master_apprentice')
}

/**
 * Backfill helper: kør alle badge-check helpers parallelt for en bruger.
 * Bruges på profil-siden så eksisterende brugere får retro-tildelt badges
 * baseret på hvad de allerede har gjort.
 */
export async function backfillAllBadges(userId: string): Promise<void> {
  await Promise.all([
    maybeAwardFirstPost(userId).catch(() => {}),
    maybeAwardHelpful(userId).catch(() => {}),
    maybeAwardSeedKeeper(userId).catch(() => {}),
    maybeAwardCommunityStarter(userId).catch(() => {}),
    maybeAwardGreenThumb(userId).catch(() => {}),
    maybeAwardCurator(userId).catch(() => {}),
    maybeAwardFirstSowing(userId).catch(() => {}),
    maybeAwardFirstHarvest(userId).catch(() => {}),
    maybeAwardSeasonFinisher(userId).catch(() => {}),
    maybeAwardTheCollector(userId).catch(() => {}),
    maybeAwardMasterApprentice(userId).catch(() => {}),
  ])
}
