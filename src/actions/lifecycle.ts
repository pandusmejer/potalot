'use server'

import { revalidatePath } from 'next/cache'
import { udfoerHandling } from '@/lib/livscyklus/cascade'
import { findOrCreateVariety } from './varieties'
import { getDefaultGarden } from './gardens'
import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import type { AfsluttetAarsag } from '@/lib/types'

/**
 * Server actions for plante-livscyklus.
 *
 * Hver action er en brugervendt handling der oversættes til
 * en Handling og udføres af kaskade-motoren.
 */

// ============================================
// Så et frø — kerne-flow
// ============================================

/**
 * Sår en plante. Hvis seedId er givet, trækkes der fra beholdning.
 * Ellers kun sort-reference.
 *
 * Opretter automatisk:
 *  - plant-instans i livscyklus 'soet'
 *  - event 'soet' med antal og placering
 *  - opgaver fra guide-template (prikl, tjek spiring, mm)
 *  - opdaterer beholdning hvis seedId
 */
export async function saaFroe(input: {
  seedId?: string | null
  varietyId?: string | null
  // Hvis ingen variety_id: angiv navn så vi kan oprette/finde sort
  speciesName?: string
  varietyName?: string | null
  botanicalName?: string | null
  guideId?: string | null
  // Hvor og hvor mange
  antal: number
  placeringId?: string | null
  gardenId?: string | null
  dato?: string
  notes?: string
}): Promise<{ success: true; plantId: string } | { error: string }> {
  const supabase = await createClient()

  // 1. Sikr vi har en variety_id
  let variety_id = input.varietyId ?? null
  let guide_id = input.guideId ?? null
  let name = ''
  let variety_name: string | null = null

  if (!variety_id && input.speciesName) {
    const result = await findOrCreateVariety({
      species_name: input.speciesName,
      variety_name: input.varietyName,
      botanical_name: input.botanicalName,
      guide_id: guide_id,
    })
    if (result.error) return { error: result.error }
    variety_id = result.variety_id
  }

  // 2. Hent variety-info hvis vi har et ID
  if (variety_id) {
    const { data: v } = await supabase
      .from('varieties')
      .select('species_name, variety_name, guide_id')
      .eq('id', variety_id)
      .single()
    if (v) {
      name = v.species_name
      variety_name = v.variety_name
      guide_id = guide_id ?? v.guide_id
    }
  } else {
    name = input.speciesName ?? 'Ukendt'
    variety_name = input.varietyName ?? null
  }

  // 3. Default-have hvis ikke specificeret
  let garden_id = input.gardenId ?? null
  if (!garden_id) {
    const g = await getDefaultGarden()
    garden_id = g?.id ?? null
  }

  // 4. Opret plante-instans i livscyklus 'planlagt' først
  const sowDate = input.dato ?? new Date().toISOString().split('T')[0]
  const { data: plant, error } = await supabase
    .from('plants')
    .insert({
      user_id: DEMO_USER_ID,
      seed_id: input.seedId ?? null,
      guide_id,
      variety_id,
      garden_id,
      placering_id: input.placeringId ?? null,
      name,
      variety: variety_name,
      quantity: input.antal,
      livscyklus: 'planlagt',
      status: 'planned',
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !plant) return { error: error?.message ?? 'Kunne ikke oprette plante' }

  // 5. Udfør 'soe'-handlingen via kaskade-motoren
  const result = await udfoerHandling(plant.id, {
    type: 'soe',
    antal: input.antal,
    placering_id: input.placeringId ?? undefined,
    dato: sowDate,
  })

  if ('error' in result) return { error: result.error }

  revalidatePath('/')
  return { success: true, plantId: plant.id }
}

// ============================================
// Generelle handlinger på eksisterende plante
// ============================================

export async function markerSpiret(plantId: string, dato?: string) {
  const result = await udfoerHandling(plantId, { type: 'spiret', dato })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}

export async function pricleUd(plantId: string, antal: number, placeringId?: string, dato?: string) {
  const result = await udfoerHandling(plantId, {
    type: 'prikle',
    antal,
    placering_id: placeringId,
    dato,
  })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}

export async function plantUd(plantId: string, placeringId?: string, dato?: string) {
  const result = await udfoerHandling(plantId, {
    type: 'plant_ud',
    placering_id: placeringId,
    dato,
  })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}

export async function vand(plantId: string, dato?: string) {
  const result = await udfoerHandling(plantId, { type: 'vand', dato })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}

export async function goed(plantId: string, dato?: string) {
  const result = await udfoerHandling(plantId, { type: 'goed', dato })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}

export async function flyt(plantId: string, placeringId: string, dato?: string) {
  const result = await udfoerHandling(plantId, {
    type: 'flyt',
    placering_id: placeringId,
    dato,
  })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}

export async function beskaer(plantId: string, noter?: string, dato?: string) {
  const result = await udfoerHandling(plantId, { type: 'beskaar', noter, dato })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}

export async function hoest(
  plantId: string,
  maengde?: number,
  enhed: 'stk' | 'kg' | 'g' = 'stk',
  dato?: string
) {
  const result = await udfoerHandling(plantId, { type: 'hoest', maengde, enhed, dato })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}

export async function afslut(
  plantId: string,
  aarsag: AfsluttetAarsag,
  noter?: string,
  gem_froe = false,
  dato?: string
) {
  const result = await udfoerHandling(plantId, {
    type: 'afslut',
    aarsag,
    noter,
    gem_froe,
    dato,
  })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}

export async function tilfoejNote(plantId: string, tekst: string, foto_urls?: string[]) {
  const result = await udfoerHandling(plantId, { type: 'note', tekst, foto_urls })
  if ('error' in result) return { error: result.error }
  revalidatePath('/')
  return { success: true }
}
