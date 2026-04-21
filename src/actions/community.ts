'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { CommunityProfile, CommunityGroup, CommunityMembership } from '@/lib/types'

const GROUP_THRESHOLD = 3 // Gruppe "åbner" ved 3+ medlemmer

// ============================================
// Profile management
// ============================================

export async function getMyCommunityProfile(): Promise<CommunityProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('community_profiles')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .maybeSingle<CommunityProfile>()
  return data
}

export async function oprettCommunityProfile(input: {
  display_name: string
  bio?: string
  location_general?: string
}): Promise<{ success: true; profile: CommunityProfile } | { error: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('community_profiles')
    .insert({
      user_id: DEMO_USER_ID,
      display_name: input.display_name.trim(),
      bio: input.bio?.trim() || null,
      location_general: input.location_general?.trim() || null,
      is_active: true,
    })
    .select('*')
    .single<CommunityProfile>()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette profil' }

  revalidatePath('/community')
  return { success: true, profile: data }
}

// ============================================
// Group management
// ============================================

/**
 * Find eller opret en gruppe for en specifik sort (mest specifikke først).
 * Opdaterer member_count (counting invitations + joins) men åbner først
 * gruppen når threshold_reached = true (member_count >= N).
 */
export async function findOrOpretGruppe(params: {
  variety_id?: string | null
  species_name: string
  variety_name?: string | null
}): Promise<CommunityGroup | null> {
  const supabase = await createClient()

  // Mest specifikke først
  const { data: existing } = await supabase
    .from('community_groups')
    .select('*')
    .eq('species_name', params.species_name)
    .eq('variety_name', params.variety_name ?? null)
    .maybeSingle<CommunityGroup>()

  if (existing) return existing

  const title = params.variety_name
    ? `${params.variety_name} (${params.species_name})`
    : params.species_name

  const { data, error } = await supabase
    .from('community_groups')
    .insert({
      variety_id: params.variety_id ?? null,
      species_name: params.species_name,
      variety_name: params.variety_name ?? null,
      title,
      member_count: 0,
      threshold_reached: false,
      is_read_only: true,
    })
    .select('*')
    .single<CommunityGroup>()

  if (error) return null
  return data
}

/**
 * Auto-invitation: Når bruger med aktiv community-profil opretter en plante,
 * modtag en invitation til mest specifikke sort-gruppe.
 *
 * Returnerer true hvis en invitation blev oprettet (UI kan vise prompt).
 */
export async function autoInviterTilGruppe(params: {
  variety_id?: string | null
  species_name: string
  variety_name?: string | null
}): Promise<{ invited: boolean; group?: CommunityGroup }> {
  const supabase = await createClient()

  // 1. Kun hvis brugeren har en aktiv community-profil
  const { data: profile } = await supabase
    .from('community_profiles')
    .select('is_active')
    .eq('user_id', DEMO_USER_ID)
    .maybeSingle()

  if (!profile?.is_active) return { invited: false }

  // 2. Find eller opret gruppe (mest specifikke først)
  const group = await findOrOpretGruppe(params)
  if (!group) return { invited: false }

  // 3. Tjek om invitation allerede findes
  const { data: existing } = await supabase
    .from('community_memberships')
    .select('id, joined_at, declined_at')
    .eq('group_id', group.id)
    .eq('user_id', DEMO_USER_ID)
    .maybeSingle()

  if (existing) return { invited: false, group }

  // 4. Opret invitation (joined_at = null indtil bruger aktivt accepterer)
  await supabase
    .from('community_memberships')
    .insert({
      group_id: group.id,
      user_id: DEMO_USER_ID,
      role: 'member',
    })

  return { invited: true, group }
}

/**
 * Bruger accepterer invitation.
 */
export async function accepterInvitation(groupId: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('community_memberships')
    .update({ joined_at: new Date().toISOString() })
    .eq('group_id', groupId)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  // Opdater gruppe-tæller og evt. åbn gruppen
  await opdaterGruppeTaeller(groupId)

  revalidatePath('/community')
  return { success: true }
}

/**
 * Bruger afviser invitation.
 */
export async function afvisInvitation(groupId: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_memberships')
    .update({ declined_at: new Date().toISOString() })
    .eq('group_id', groupId)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }
  revalidatePath('/community')
  return { success: true }
}

async function opdaterGruppeTaeller(groupId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('community_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .not('joined_at', 'is', null)

  const memberCount = count ?? 0
  const thresholdReached = memberCount >= GROUP_THRESHOLD

  await supabase
    .from('community_groups')
    .update({
      member_count: memberCount,
      threshold_reached: thresholdReached,
    })
    .eq('id', groupId)
}

// ============================================
// Read helpers
// ============================================

export async function getMyMemberships(): Promise<Array<CommunityMembership & { group: CommunityGroup }>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('community_memberships')
    .select('*, group:community_groups(*)')
    .eq('user_id', DEMO_USER_ID)
    .is('declined_at', null)
    .order('invited_at', { ascending: false })
  return (data as Array<CommunityMembership & { group: CommunityGroup }>) ?? []
}

/**
 * Kun pending invitations (joined_at = null, declined_at = null).
 */
export async function getPendingInvitations(): Promise<Array<CommunityMembership & { group: CommunityGroup }>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('community_memberships')
    .select('*, group:community_groups(*)')
    .eq('user_id', DEMO_USER_ID)
    .is('joined_at', null)
    .is('declined_at', null)
    .order('invited_at', { ascending: false })
  return (data as Array<CommunityMembership & { group: CommunityGroup }>) ?? []
}

/**
 * Kun aktivt medlemskab (joined_at != null).
 */
export async function getActiveMemberships(): Promise<Array<CommunityMembership & { group: CommunityGroup }>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('community_memberships')
    .select('*, group:community_groups(*)')
    .eq('user_id', DEMO_USER_ID)
    .not('joined_at', 'is', null)
    .is('declined_at', null)
    .order('joined_at', { ascending: false })
  return (data as Array<CommunityMembership & { group: CommunityGroup }>) ?? []
}

/**
 * Opdater community-profil (display_name, bio, location, is_active).
 */
export async function opdaterCommunityProfile(input: {
  display_name?: string
  bio?: string | null
  location_general?: string | null
  is_active?: boolean
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {}
  if (input.display_name !== undefined) updates.display_name = input.display_name.trim()
  if (input.bio !== undefined) updates.bio = input.bio?.trim() || null
  if (input.location_general !== undefined) updates.location_general = input.location_general?.trim() || null
  if (input.is_active !== undefined) updates.is_active = input.is_active
  updates.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('community_profiles')
    .update(updates)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/community')
  return { success: true }
}
