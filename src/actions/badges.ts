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

// ============================================
// Genre-specifikke (sort-baserede) helpers
// ============================================

const TOMAT_PATTERN = '%tomat%'
const CHILI_PATTERN = '%chili%'

// Krydderurter — typiske navne på dansk
const HERB_NAMES = [
  'basilikum', 'persille', 'mynte', 'oregano', 'timian', 'rosmarin',
  'salvie', 'dild', 'koriander', 'estragon', 'purløg', 'kørvel',
  'merian', 'citronmelisse', 'bukketorn',
]

/**
 * tomato_master: 3+ unique tomat-sorter (plant_name ILIKE '%tomat%').
 */
export async function maybeAwardTomatoMaster(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plants_v2')
    .select('name, variety')
    .eq('user_id', userId)
    .ilike('name', TOMAT_PATTERN)
  if (!data) return
  const unique = new Set((data as { name: string; variety: string | null }[]).map(
    p => `${p.name.toLowerCase().trim()}|${(p.variety ?? '').toLowerCase().trim()}`
  ))
  if (unique.size >= 3) await awardBadge(userId, 'tomato_master')
}

/**
 * chili_lord: 3+ unique chili-sorter.
 */
export async function maybeAwardChiliLord(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plants_v2')
    .select('name, variety')
    .eq('user_id', userId)
    .ilike('name', CHILI_PATTERN)
  if (!data) return
  const unique = new Set((data as { name: string; variety: string | null }[]).map(
    p => `${p.name.toLowerCase().trim()}|${(p.variety ?? '').toLowerCase().trim()}`
  ))
  if (unique.size >= 3) await awardBadge(userId, 'chili_lord')
}

/**
 * herb_keeper: 5+ unique krydderurter (matcher kendte urt-navne).
 */
export async function maybeAwardHerbKeeper(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plants_v2')
    .select('name')
    .eq('user_id', userId)
  if (!data) return
  const unique = new Set<string>()
  for (const p of (data as { name: string }[])) {
    const lower = p.name.toLowerCase()
    for (const herb of HERB_NAMES) {
      if (lower.includes(herb)) { unique.add(herb); break }
    }
  }
  if (unique.size >= 5) await awardBadge(userId, 'herb_keeper')
}

/**
 * altan_grower: 5+ planter med "altan" eller "balkon" i location-fritekst.
 */
export async function maybeAwardAltanGrower(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plants_v2')
    .select('id, location')
    .eq('user_id', userId)
  if (!data) return
  const count = (data as { id: string; location: string | null }[]).filter(p => {
    if (!p.location) return false
    const l = p.location.toLowerCase()
    return l.includes('altan') || l.includes('balkon')
  }).length
  if (count >= 5) await awardBadge(userId, 'altan_grower')
}

/**
 * drivhus_keeper: 5+ planter med "drivhus" i location.
 */
export async function maybeAwardDrivhusKeeper(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plants_v2')
    .select('id, location')
    .eq('user_id', userId)
  if (!data) return
  const count = (data as { id: string; location: string | null }[]).filter(p => {
    return !!p.location && p.location.toLowerCase().includes('drivhus')
  }).length
  if (count >= 5) await awardBadge(userId, 'drivhus_keeper')
}

// ============================================
// Samler / diversitet
// ============================================

/**
 * fifty_varieties: 50+ unique items i frøbank (plant_name + variety distinct).
 */
export async function maybeAwardFiftyVarieties(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory_items')
    .select('name, variety')
    .eq('user_id', userId)
  if (!data) return
  const unique = new Set((data as { name: string; variety: string | null }[]).map(
    i => `${i.name.toLowerCase().trim()}|${(i.variety ?? '').toLowerCase().trim()}`
  ))
  if (unique.size >= 50) await awardBadge(userId, 'fifty_varieties')
}

/**
 * perennial_keeper: 5+ items i flerårige kategorier (knolde/buske/træer/stauder).
 */
export async function maybeAwardPerennialKeeper(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('inventory_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('primary_category_id', ['knolde', 'buske', 'traeer', 'stauder'])
  if ((count ?? 0) >= 5) await awardBadge(userId, 'perennial_keeper')
}

/**
 * biodiversity_friend: items i 5+ forskellige primary_category_id.
 */
export async function maybeAwardBiodiversityFriend(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory_items')
    .select('primary_category_id')
    .eq('user_id', userId)
  if (!data) return
  const unique = new Set((data as { primary_category_id: string }[]).map(i => i.primary_category_id))
  unique.delete('favoritter') // ikke en rigtig kategori
  if (unique.size >= 5) await awardBadge(userId, 'biodiversity_friend')
}

// ============================================
// Læring
// ============================================

/**
 * monthly_logger: log-aktivitet i alle 12 årets måneder (over alle år).
 */
export async function maybeAwardMonthlyLogger(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plant_logs_v2')
    .select('date')
    .eq('user_id', userId)
    .neq('type', 'status_change') // tæl ikke auto-genererede
  if (!data) return
  const months = new Set<number>()
  for (const r of (data as { date: string }[])) {
    const m = new Date(r.date).getMonth() + 1
    months.add(m)
  }
  if (months.size >= 12) await awardBadge(userId, 'monthly_logger')
}

/**
 * autobiograf: 10+ private noter på guides (user_guide_notes).
 */
export async function maybeAwardAutobiograf(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('user_guide_notes')
    .select('guide_id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if ((count ?? 0) >= 10) await awardBadge(userId, 'autobiograf')
}

// ============================================
// Hemmelige badges (secret: true)
// ============================================

/**
 * slagteren: 3+ planter afsluttet under 30 dage. Sjælden indrømmelse om at
 * dyrkning er svær.
 */
export async function maybeAwardSlagteren(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plants_v2')
    .select('sow_date, archived_at, status')
    .eq('user_id', userId)
    .eq('status', 'afsluttet')
    .not('archived_at', 'is', null)
    .not('sow_date', 'is', null)
  if (!data) return
  type Row = { sow_date: string | null; archived_at: string | null }
  const earlyFinished = (data as Row[]).filter(p => {
    if (!p.sow_date || !p.archived_at) return false
    const sow = new Date(p.sow_date).getTime()
    const arch = new Date(p.archived_at).getTime()
    const days = (arch - sow) / 86400000
    return days < 30
  })
  if (earlyFinished.length >= 3) await awardBadge(userId, 'slagteren')
}

/**
 * hasarderen: sået en varmekrævende plante før 1. marts.
 * Varmekrævende = tomat, chili, peberfrugt, agurk, squash, melon, basilikum.
 */
const VARMEKRAEVENDE = ['tomat', 'chili', 'peberfrugt', 'agurk', 'squash', 'melon', 'basilikum', 'aubergine']

export async function maybeAwardHasarderen(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plants_v2')
    .select('name, sow_date')
    .eq('user_id', userId)
    .not('sow_date', 'is', null)
  if (!data) return
  type Row = { name: string; sow_date: string | null }
  const matches = (data as Row[]).some(p => {
    if (!p.sow_date) return false
    const sowDate = new Date(p.sow_date)
    // Før 1. marts (måned 3, dag 1)
    if (sowDate.getMonth() > 1) return false  // måneder er 0-indekserede; måned 1 = februar
    const lower = p.name.toLowerCase()
    return VARMEKRAEVENDE.some(v => lower.includes(v))
  })
  if (matches) await awardBadge(userId, 'hasarderen')
}

/**
 * sneglefaelleren: 3+ pest_disease-logs.
 */
export async function maybeAwardSneglefaelleren(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('plant_logs_v2')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'pest_disease')
  if ((count ?? 0) >= 3) await awardBadge(userId, 'sneglefaelleren')
}

/**
 * Backfill helper: kør alle badge-check helpers parallelt for en bruger.
 * Bruges på profil-siden så eksisterende brugere får retro-tildelt badges
 * baseret på hvad de allerede har gjort.
 */
export async function backfillAllBadges(userId: string): Promise<void> {
  await Promise.all([
    // Sociale
    maybeAwardFirstPost(userId).catch(() => {}),
    maybeAwardHelpful(userId).catch(() => {}),
    maybeAwardSeedKeeper(userId).catch(() => {}),
    maybeAwardCommunityStarter(userId).catch(() => {}),
    maybeAwardGreenThumb(userId).catch(() => {}),
    maybeAwardCurator(userId).catch(() => {}),
    // Dyrkning lifecycle
    maybeAwardFirstSowing(userId).catch(() => {}),
    maybeAwardFirstHarvest(userId).catch(() => {}),
    maybeAwardSeasonFinisher(userId).catch(() => {}),
    maybeAwardTheCollector(userId).catch(() => {}),
    maybeAwardMasterApprentice(userId).catch(() => {}),
    // Genre-specifikke
    maybeAwardTomatoMaster(userId).catch(() => {}),
    maybeAwardChiliLord(userId).catch(() => {}),
    maybeAwardHerbKeeper(userId).catch(() => {}),
    maybeAwardAltanGrower(userId).catch(() => {}),
    maybeAwardDrivhusKeeper(userId).catch(() => {}),
    // Samler
    maybeAwardFiftyVarieties(userId).catch(() => {}),
    maybeAwardPerennialKeeper(userId).catch(() => {}),
    maybeAwardBiodiversityFriend(userId).catch(() => {}),
    // Læring
    maybeAwardMonthlyLogger(userId).catch(() => {}),
    maybeAwardAutobiograf(userId).catch(() => {}),
    // Hemmelige
    maybeAwardSlagteren(userId).catch(() => {}),
    maybeAwardHasarderen(userId).catch(() => {}),
    maybeAwardSneglefaelleren(userId).catch(() => {}),
  ])
}
