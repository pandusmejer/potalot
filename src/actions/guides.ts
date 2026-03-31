'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateGuideUserNotes(guideId: string, userNotes: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('plant_guides')
    .update({ user_notes: userNotes })
    .eq('id', guideId)

  if (error) return { error: error.message }

  revalidatePath('/guides')
  return { success: true }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createGuideFromAI(
  name: string,
  category: string,
  aiData: Record<string, unknown>
) {
  const supabase = await createClient()

  const slug = slugify(name)

  const { data: existing } = await supabase
    .from('plant_guides')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return { success: true, guideId: existing.id, alreadyExists: true }
  }

  const { data, error } = await supabase
    .from('plant_guides')
    .insert({
      slug,
      name_da: name,
      name_en: null,
      category,
      botanical_name: (aiData.botanical_name as string) || null,
      description: (aiData.description as string) || null,
      sun_requirement: (aiData.sun_requirement as string) || null,
      water_need: (aiData.water_need as string) || null,
      frost_hardy: aiData.frost_hardy as boolean ?? false,
      spacing_cm: (aiData.spacing_cm as number) || null,
      depth_cm: (aiData.depth_cm as number) || null,
      sow_indoor_start: (aiData.sow_indoor_start as string) || null,
      sow_indoor_end: (aiData.sow_indoor_end as string) || null,
      sow_outdoor_start: (aiData.sow_outdoor_start as string) || null,
      sow_outdoor_end: (aiData.sow_outdoor_end as string) || null,
      prick_out_weeks_after_sow: (aiData.prick_out_weeks_after_sow as number) || null,
      plant_out_start: (aiData.plant_out_start as string) || null,
      plant_out_end: (aiData.plant_out_end as string) || null,
      harvest_start: (aiData.harvest_start as string) || null,
      harvest_end: (aiData.harvest_end as string) || null,
      days_to_germination_min: (aiData.days_to_germination_min as number) || null,
      days_to_germination_max: (aiData.days_to_germination_max as number) || null,
      days_to_harvest_min: (aiData.days_to_harvest_min as number) || null,
      days_to_harvest_max: (aiData.days_to_harvest_max as number) || null,
      companion_plants: (aiData.companion_plants as string[]) || null,
      sowing_info: (aiData.sowing_info as string) || null,
      repotting_info: (aiData.repotting_info as string) || null,
      planting_out_info: (aiData.planting_out_info as string) || null,
      care_info: (aiData.care_info as string) || null,
      environment_info: (aiData.environment_info as string) || null,
      biology_info: (aiData.biology_info as string) || null,
      seed_type: (aiData.seed_type as string) || null,
      seed_harvest_possible: aiData.seed_harvest_possible as boolean ?? null,
      common_mistakes: (aiData.common_mistakes as string) || null,
      warnings: (aiData.warnings as string) || null,
      tips: (aiData.tips as string) || null,
      created_automatically: true,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/guides')
  return { success: true, guideId: data.id }
}

export async function updateGuideFromAI(
  guideId: string,
  aiData: Record<string, unknown>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('plant_guides')
    .update({
      botanical_name: (aiData.botanical_name as string) || null,
      description: (aiData.description as string) || null,
      sun_requirement: (aiData.sun_requirement as string) || null,
      water_need: (aiData.water_need as string) || null,
      frost_hardy: aiData.frost_hardy as boolean ?? false,
      spacing_cm: (aiData.spacing_cm as number) || null,
      depth_cm: (aiData.depth_cm as number) || null,
      sow_indoor_start: (aiData.sow_indoor_start as string) || null,
      sow_indoor_end: (aiData.sow_indoor_end as string) || null,
      sow_outdoor_start: (aiData.sow_outdoor_start as string) || null,
      sow_outdoor_end: (aiData.sow_outdoor_end as string) || null,
      prick_out_weeks_after_sow: (aiData.prick_out_weeks_after_sow as number) || null,
      plant_out_start: (aiData.plant_out_start as string) || null,
      plant_out_end: (aiData.plant_out_end as string) || null,
      harvest_start: (aiData.harvest_start as string) || null,
      harvest_end: (aiData.harvest_end as string) || null,
      days_to_germination_min: (aiData.days_to_germination_min as number) || null,
      days_to_germination_max: (aiData.days_to_germination_max as number) || null,
      days_to_harvest_min: (aiData.days_to_harvest_min as number) || null,
      days_to_harvest_max: (aiData.days_to_harvest_max as number) || null,
      companion_plants: (aiData.companion_plants as string[]) || null,
      sowing_info: (aiData.sowing_info as string) || null,
      repotting_info: (aiData.repotting_info as string) || null,
      planting_out_info: (aiData.planting_out_info as string) || null,
      care_info: (aiData.care_info as string) || null,
      environment_info: (aiData.environment_info as string) || null,
      biology_info: (aiData.biology_info as string) || null,
      seed_type: (aiData.seed_type as string) || null,
      seed_harvest_possible: aiData.seed_harvest_possible as boolean ?? null,
      common_mistakes: (aiData.common_mistakes as string) || null,
      warnings: (aiData.warnings as string) || null,
      tips: (aiData.tips as string) || null,
    })
    .eq('id', guideId)

  if (error) return { error: error.message }

  revalidatePath('/guides')
  return { success: true }
}

// ========== Manual CRUD ==========

export async function createGuideManual(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name_da') as string
  if (!name?.trim()) return { error: 'Navn er påkrævet' }

  const slug = slugify(name)

  const { data: existing } = await supabase
    .from('plant_guides')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) return { error: 'En guide med dette navn findes allerede' }

  const { data, error } = await supabase
    .from('plant_guides')
    .insert({
      slug,
      name_da: name.trim(),
      name_en: (formData.get('name_en') as string)?.trim() || null,
      botanical_name: (formData.get('botanical_name') as string)?.trim() || null,
      category: (formData.get('category') as string) || 'vegetable',
      description: (formData.get('description') as string)?.trim() || null,
      created_automatically: false,
    })
    .select('slug')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/guides')
  return { success: true, slug: data.slug }
}

export async function updateGuideManual(guideId: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name_da') as string
  if (!name?.trim()) return { error: 'Navn er påkrævet' }

  const { error } = await supabase
    .from('plant_guides')
    .update({
      name_da: name.trim(),
      name_en: (formData.get('name_en') as string)?.trim() || null,
      botanical_name: (formData.get('botanical_name') as string)?.trim() || null,
      category: (formData.get('category') as string) || 'vegetable',
      description: (formData.get('description') as string)?.trim() || null,
    })
    .eq('id', guideId)

  if (error) return { error: error.message }

  revalidatePath('/guides')
  return { success: true }
}

export async function deleteGuide(guideId: string) {
  const supabase = await createClient()

  await supabase.from('seeds').update({ guide_id: null }).eq('guide_id', guideId)
  await supabase.from('plants').update({ guide_id: null }).eq('guide_id', guideId)

  const { error } = await supabase
    .from('plant_guides')
    .delete()
    .eq('id', guideId)

  if (error) return { error: error.message }

  revalidatePath('/guides')
  return { success: true }
}

export async function addGuideImage(guideId: string, imageUrl: string) {
  const supabase = await createClient()

  const { data: guide } = await supabase
    .from('plant_guides')
    .select('user_images')
    .eq('id', guideId)
    .single()

  const current = guide?.user_images ?? []

  const { error } = await supabase
    .from('plant_guides')
    .update({ user_images: [...current, imageUrl] })
    .eq('id', guideId)

  if (error) return { error: error.message }

  revalidatePath('/guides')
  return { success: true }
}

export async function removeGuideImage(guideId: string, index: number) {
  const supabase = await createClient()

  const { data: guide } = await supabase
    .from('plant_guides')
    .select('user_images')
    .eq('id', guideId)
    .single()

  const current = guide?.user_images ?? []
  const updated = current.filter((_: string, i: number) => i !== index)

  const { error } = await supabase
    .from('plant_guides')
    .update({ user_images: updated })
    .eq('id', guideId)

  if (error) return { error: error.message }

  revalidatePath('/guides')
  return { success: true }
}
