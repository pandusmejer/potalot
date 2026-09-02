'use server'

import { createClient } from '@/lib/supabase/server'
import { dataFejlBesked } from '@/lib/data-fejl'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { GardenLocation } from '@/lib/types'

/**
 * Dyrkningssteder (planter-persistens-sprint, step 3+4).
 *
 * Et sted er en rigtig entity brugeren kan oprette FØR der er planter i det.
 * Plante.gardenLocationId peger hertil; plant.location-teksten bevares som
 * fallback (lib/steder.ts udleder stadig steder af teksten for legacy/demo).
 *
 * Ingen falsk persistens: kald kun mutationer fra rigtige (ikke-demo) brugere.
 */

interface GardenLocationRow {
  id: string
  user_id: string
  name: string
  type: string
  image_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function rowToLocation(row: GardenLocationRow): GardenLocation {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    imageUrl: row.image_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Brugerens oprettede dyrkningssteder (tomt for anonyme/demo). */
export async function getGardenLocations(): Promise<GardenLocation[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('garden_locations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as GardenLocationRow[]).map(rowToLocation)
}

export interface CreateGardenLocationInput {
  name: string
  type: string
  notes?: string
  imageUrl?: string
}

/**
 * Opret et dyrkningssted. Idempotent på navn (case-insensitivt): findes
 * stedet allerede, returneres det eksisterende i stedet for at lave en dublet.
 */
export async function createGardenLocation(
  input: CreateGardenLocationInput,
): Promise<{ ok: true; location: GardenLocation } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const name = input.name.trim()
  if (!name) return { error: 'Stedet skal have et navn' }

  // Findes navnet allerede? → returnér det (ingen dublet).
  const { data: existing } = await supabase
    .from('garden_locations')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', name)
    .maybeSingle()
  if (existing) {
    return { ok: true, location: rowToLocation(existing as GardenLocationRow) }
  }

  const { data, error } = await supabase
    .from('garden_locations')
    .insert({
      user_id: userId,
      name,
      type: input.type?.trim() || 'Andet',
      notes: input.notes?.trim() || null,
      image_url: input.imageUrl?.trim() || null,
    })
    .select('*')
    .single()

  if (error || !data) return { error: dataFejlBesked(error, 'Kunne ikke oprette stedet') }

  revalidatePath('/mine-planter')
  return { ok: true, location: rowToLocation(data as GardenLocationRow) }
}

export interface UpdateGardenLocationInput {
  id: string
  name?: string
  type?: string
  notes?: string | null
  imageUrl?: string | null
}

export async function updateGardenLocation(
  input: UpdateGardenLocationInput,
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) {
    const n = input.name.trim()
    if (!n) return { error: 'Stedet skal have et navn' }
    patch.name = n
  }
  if (input.type !== undefined) patch.type = input.type.trim() || 'Andet'
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl?.trim() || null

  const { error } = await supabase
    .from('garden_locations')
    .update(patch)
    .eq('id', input.id)
    .eq('user_id', userId)
  if (error) return { error: dataFejlBesked(error, 'Kunne ikke gemme voksestedet. Prøv igen.') }

  revalidatePath('/mine-planter')
  revalidatePath(`/mine-planter/sted/${input.id}`)
  return { ok: true }
}

/**
 * Find-eller-opret et sted ud fra et navn — bruges ved plante-oprettelse, så
 * en placering skrevet i så-flowet bliver til en rigtig GardenLocation og
 * planten kan kobles via garden_location_id. Returnerer stedets id (eller null
 * ved tom streng / fejl, så kalderen falder tilbage til ren location-tekst).
 */
export async function resolveOrCreateGardenLocation(
  name: string,
  type?: string,
): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('garden_locations')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', trimmed)
    .maybeSingle()
  if (existing) return existing.id as string

  const { data, error } = await supabase
    .from('garden_locations')
    .insert({ user_id: user.id, name: trimmed, type: type?.trim() || 'Andet' })
    .select('id')
    .maybeSingle()
  if (error || !data) return null
  return data.id as string
}
