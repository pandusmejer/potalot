'use server'

import { cache } from 'react'
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
  notification_profile?: string | null
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
    notificationProfile: row.notification_profile ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// cache(): profilen læses af layout, vejr OG sider i samme request —
// memoiseres så én sideåbning kun rammer profiles én gang. Ikke eksporteret
// ('use server' må kun eksportere async-funktioner).
const getProfileCached = cache(async (): Promise<Profile | null> => {
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
})

export async function getProfile(): Promise<Profile | null> {
  return getProfileCached()
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

  if (error) {
    console.error('profil-handling fejlede:', error)
    return { error: 'Kunne ikke gemme ændringerne. Prøv igen.' }
  }

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
// To UAFHÆNGIGE dimensioner (må aldrig blandes, Anna 15/7):
//   grower_profile       = identitet/interesse (hvem er du som dyrker)
//   notification_profile = hvor meget må Potalot forstyrre (styrer notif-mængde)
export type GrowerProfile =
  | 'ny' | 'koekkenhave' | 'blomster' | 'froesamler' | 'selvforsyner' | 'drivhus'
export type NotificationProfile = 'mindful' | 'rolig' | 'aktiv'
export type SeasonStatus = 'starter' | 'igang' | 'flere_maaneder'

export interface OnboardingPreferencesInput {
  gardenType?: string | null
  growingAreas?: string[]
  growerProfile?: GrowerProfile | null
  notificationProfile?: NotificationProfile | null
  seasonStatus?: SeasonStatus | null
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
  onboarded?: boolean
}

/**
 * Gemmer Onboarding V2's preference-valg på profiles. ALT-eller-intet: en
 * gemmefejl (fx hvis 00058 ikke er kørt) returneres tydeligt, så flowet ALDRIG
 * kan foregive succes med tabte præferencer. Kræver migration 00058.
 */
export async function saveOnboardingPreferences(
  input: OnboardingPreferencesInput,
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.latitude !== undefined) update.latitude = input.latitude
  if (input.longitude !== undefined) update.longitude = input.longitude
  if (input.locationName !== undefined) update.location_name = input.locationName
  if (input.onboarded !== undefined) update.onboarded = input.onboarded
  if (input.gardenType !== undefined) update.garden_type = input.gardenType
  if (input.growingAreas !== undefined) update.growing_areas = input.growingAreas
  if (input.growerProfile !== undefined) update.grower_profile = input.growerProfile
  if (input.notificationProfile !== undefined) update.notification_profile = input.notificationProfile
  if (input.seasonStatus !== undefined) update.season_status = input.seasonStatus

  const { error } = await supabase.from('profiles').update(update).eq('id', userId)
  if (error) {
    console.error('profil-handling fejlede:', error)
    return { error: 'Kunne ikke gemme ændringerne. Prøv igen.' }
  }

  revalidatePath('/profil')
  revalidatePath('/', 'layout')
  return { ok: true }
}
