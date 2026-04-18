'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { Variety } from '@/lib/types'

export async function getVarieties(speciesFilter?: string): Promise<Variety[]> {
  const userId = DEMO_USER_ID
  const supabase = await createClient()

  let query = supabase
    .from('varieties')
    .select('*, guide:plant_guides(*)')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('species_name')
    .order('variety_name', { nullsFirst: true })

  if (speciesFilter) {
    query = query.ilike('species_name', `%${speciesFilter}%`)
  }

  const { data } = await query
  return (data as Variety[]) ?? []
}

export async function getVariety(varietyId: string): Promise<Variety | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('varieties')
    .select('*, guide:plant_guides(*)')
    .eq('id', varietyId)
    .single()
  return data as Variety | null
}

/**
 * Find or create a variety based on (species_name, variety_name).
 * Used when creating seeds or plants from inline names.
 */
export async function findOrCreateVariety(params: {
  species_name: string
  variety_name?: string | null
  botanical_name?: string | null
  guide_id?: string | null
}): Promise<{ variety_id: string | null; error?: string }> {
  const userId = DEMO_USER_ID
  const supabase = await createClient()

  const species = params.species_name.trim()
  const variety = params.variety_name?.trim() || null
  if (!species) return { variety_id: null, error: 'species_name er påkrævet' }

  // Find existing
  const { data: existing } = await supabase
    .from('varieties')
    .select('id')
    .eq('user_id', userId)
    .eq('species_name', species)
    .is('variety_name', variety)
    .maybeSingle()

  if (existing) {
    return { variety_id: existing.id }
  }

  // Variety_name comparison with NULL needs special handling
  if (variety) {
    const { data: existingWithName } = await supabase
      .from('varieties')
      .select('id')
      .eq('user_id', userId)
      .eq('species_name', species)
      .eq('variety_name', variety)
      .maybeSingle()

    if (existingWithName) return { variety_id: existingWithName.id }
  }

  // Create new
  const { data, error } = await supabase
    .from('varieties')
    .insert({
      user_id: userId,
      species_name: species,
      variety_name: variety,
      botanical_name: params.botanical_name?.trim() || null,
      guide_id: params.guide_id || null,
    })
    .select('id')
    .single()

  if (error) return { variety_id: null, error: error.message }

  revalidatePath('/')
  return { variety_id: data.id }
}

export async function updateVariety(varietyId: string, formData: FormData) {
  const supabase = await createClient()

  const species = (formData.get('species_name') as string)?.trim()
  if (!species) return { error: 'Species-navn er påkrævet' }

  const { error } = await supabase
    .from('varieties')
    .update({
      species_name: species,
      variety_name: (formData.get('variety_name') as string)?.trim() || null,
      botanical_name: (formData.get('botanical_name') as string)?.trim() || null,
      guide_id: (formData.get('guide_id') as string) || null,
      notes: (formData.get('notes') as string)?.trim() || null,
    })
    .eq('id', varietyId)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function setVarietyIllustration(
  varietyId: string,
  url: string,
  source: 'flora_danica' | 'ai_generated' | 'user_upload',
  approved = true
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('varieties')
    .update({
      illustration_url: url,
      illustration_source: source,
      illustration_approved: approved,
    })
    .eq('id', varietyId)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function deleteVariety(varietyId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('varieties')
    .delete()
    .eq('id', varietyId)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
