'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { Profile, UserMode } from '@/lib/types'

interface ProfileRow {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  user_mode: string | null
  onboarded: boolean | null
  is_admin: boolean | null
  latitude: number | null
  longitude: number | null
  location_name: string | null
  created_at: string
  updated_at: string
}

function rowToProfile(row: ProfileRow, email: string | null): Profile {
  return {
    id: row.id,
    username: row.username ?? row.display_name ?? 'Bruger',
    email: email ?? '',
    avatarUrl: row.avatar_url,
    userMode: (row.user_mode ?? 'afslappet') as UserMode,
    onboarded: row.onboarded ?? false,
    isAdmin: row.is_admin ?? false,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    locationName: row.location_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null
  return rowToProfile(data as ProfileRow, user.email)
}

export interface UpdateProfileInput {
  username?: string
  displayName?: string
  avatarUrl?: string | null
  userMode?: UserMode
  onboarded?: boolean
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.username !== undefined) update.username = input.username
  if (input.displayName !== undefined) update.display_name = input.displayName
  if (input.avatarUrl !== undefined) update.avatar_url = input.avatarUrl
  if (input.userMode !== undefined) update.user_mode = input.userMode
  if (input.onboarded !== undefined) update.onboarded = input.onboarded
  if (input.latitude !== undefined) update.latitude = input.latitude
  if (input.longitude !== undefined) update.longitude = input.longitude
  if (input.locationName !== undefined) update.location_name = input.locationName

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/profil')
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function checkUsernameAvailable(username: string): Promise<{ available: boolean }> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('is_username_available', { p_username: username })
  return { available: !!data }
}

// ── Onboarding V2 — preference-dimensioner ──────────────────────────────────
export type GrowerProfile = 'mindful' | 'hjaelper' | 'entusiast' | 'froesamler'
export type SeasonStatus = 'starter' | 'igang' | 'flere_maaneder'

export interface OnboardingPreferencesInput {
  gardenType?: string | null
  growingAreas?: string[]
  growerProfile?: GrowerProfile | null
  seasonStatus?: SeasonStatus | null
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
  onboarded?: boolean
}

/**
 * Gemmer Onboarding V2's preference-valg på profiles.
 *
 * Robusthed: lokation (latitude/longitude/location_name, findes fra 00048) og
 * onboarded er "core" og MÅ altid lykkes. De fire nye dimensioner
 * (garden_type/growing_areas/grower_profile/season_status) kræver migration
 * 00058 — findes de ikke endnu, gemmer vi core alene, så onboarding aldrig
 * bryder. `preferencesStored` fortæller om de fire dimensioner blev gemt.
 */
export async function saveOnboardingPreferences(
  input: OnboardingPreferencesInput,
): Promise<{ ok: true; preferencesStored: boolean } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const core: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.latitude !== undefined) core.latitude = input.latitude
  if (input.longitude !== undefined) core.longitude = input.longitude
  if (input.locationName !== undefined) core.location_name = input.locationName
  if (input.onboarded !== undefined) core.onboarded = input.onboarded

  const prefs: Record<string, unknown> = {}
  if (input.gardenType !== undefined) prefs.garden_type = input.gardenType
  if (input.growingAreas !== undefined) prefs.growing_areas = input.growingAreas
  if (input.growerProfile !== undefined) prefs.grower_profile = input.growerProfile
  if (input.seasonStatus !== undefined) prefs.season_status = input.seasonStatus

  const havePrefs = Object.keys(prefs).length > 0
  const first = await supabase.from('profiles').update({ ...core, ...prefs }).eq('id', userId)
  if (!first.error) {
    revalidatePath('/profil')
    revalidatePath('/', 'layout')
    return { ok: true, preferencesStored: havePrefs }
  }

  // Preference-kolonnerne findes måske ikke endnu (før 00058) → gem core alene,
  // så flowet fuldføres. En rigtig core-fejl surfacer derimod.
  if (havePrefs) {
    const second = await supabase.from('profiles').update(core).eq('id', userId)
    if (!second.error) {
      console.warn('[onboarding-v2] preference-kolonner ikke gemt (mangler 00058?):', first.error.message)
      revalidatePath('/profil')
      revalidatePath('/', 'layout')
      return { ok: true, preferencesStored: false }
    }
    return { error: second.error.message }
  }
  return { error: first.error.message }
}
