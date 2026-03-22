'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import { parseDanishDate } from '@/lib/date-utils'

function revalidateAll() {
  revalidatePath('/froebank')
  revalidatePath('/vaekst')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
}

export async function createSeed(formData: FormData) {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const expiryDateRaw = formData.get('expiry_date') as string
  const expiryDateIso = expiryDateRaw ? parseDanishDate(expiryDateRaw) : null
  // Extract year from expiry_date for backward compat
  const expiryYear = expiryDateIso
    ? parseInt(expiryDateIso.split('-')[0], 10)
    : formData.get('expiry_year') ? Number(formData.get('expiry_year')) : null

  const { error } = await supabase.from('seeds').insert({
    user_id: userId,
    name: formData.get('name') as string,
    variety: (formData.get('variety') as string) || null,
    brand: (formData.get('brand') as string) || null,
    guide_id: (formData.get('guide_id') as string) || null,
    quantity: formData.get('quantity') ? Number(formData.get('quantity')) : null,
    seeds_total: formData.get('seeds_total') ? Number(formData.get('seeds_total')) : null,
    seeds_sown: formData.get('seeds_sown') ? Number(formData.get('seeds_sown')) : 0,
    year_purchased: formData.get('year_purchased') ? Number(formData.get('year_purchased')) : null,
    expiry_year: expiryYear,
    expiry_date: expiryDateIso,
    primary_category: (formData.get('primary_category') as string) || 'froe',
    subcategory: (formData.get('subcategory') as string) || null,
    plant_type: (formData.get('plant_type') as string) || null,
    notes: (formData.get('notes') as string) || null,
    status: (formData.get('status') as string) || 'in_stock',
  })

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function updateSeed(seedId: string, formData: FormData) {
  const supabase = await createClient()

  const expiryDateRaw = formData.get('expiry_date') as string
  const expiryDateIso = expiryDateRaw ? parseDanishDate(expiryDateRaw) : null
  const expiryYear = expiryDateIso
    ? parseInt(expiryDateIso.split('-')[0], 10)
    : formData.get('expiry_year') ? Number(formData.get('expiry_year')) : null

  const { error } = await supabase
    .from('seeds')
    .update({
      name: formData.get('name') as string,
      variety: (formData.get('variety') as string) || null,
      brand: (formData.get('brand') as string) || null,
      guide_id: (formData.get('guide_id') as string) || null,
      quantity: formData.get('quantity') ? Number(formData.get('quantity')) : null,
      seeds_total: formData.get('seeds_total') ? Number(formData.get('seeds_total')) : null,
      seeds_sown: formData.get('seeds_sown') ? Number(formData.get('seeds_sown')) : 0,
      year_purchased: formData.get('year_purchased') ? Number(formData.get('year_purchased')) : null,
      expiry_year: expiryYear,
      expiry_date: expiryDateIso,
      primary_category: (formData.get('primary_category') as string) || 'froe',
      subcategory: (formData.get('subcategory') as string) || null,
      plant_type: (formData.get('plant_type') as string) || null,
      notes: (formData.get('notes') as string) || null,
      status: (formData.get('status') as string) || 'in_stock',
      updated_at: new Date().toISOString(),
    })
    .eq('id', seedId)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function createSeedsBatch(
  seeds: Array<{
    name: string
    variety?: string | null
    brand?: string | null
    guide_id?: string | null
    quantity?: number | null
    seeds_total?: number | null
    seeds_sown?: number | null
    year_purchased?: number | null
    expiry_year?: number | null
    expiry_date?: string | null
    primary_category?: string
    subcategory?: string | null
    plant_type?: string | null
    notes?: string | null
    status?: string
  }>
) {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const rows = seeds.map((s) => ({
    user_id: userId,
    name: s.name,
    variety: s.variety || null,
    brand: s.brand || null,
    guide_id: s.guide_id || null,
    quantity: s.quantity || null,
    seeds_total: s.seeds_total || s.quantity || null,
    seeds_sown: s.seeds_sown || 0,
    year_purchased: s.year_purchased || null,
    expiry_year: s.expiry_year || null,
    expiry_date: s.expiry_date || null,
    primary_category: s.primary_category || 'froe',
    subcategory: s.subcategory || null,
    plant_type: s.plant_type || null,
    notes: s.notes || null,
    status: s.status || 'in_stock',
  }))

  const { error } = await supabase.from('seeds').insert(rows)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true, count: rows.length }
}

export async function deleteSeed(seedId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('seeds').delete().eq('id', seedId)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

// ============================================
// BULK OPERATIONS
// ============================================

export async function bulkDeleteSeeds(seedIds: string[]) {
  if (seedIds.length === 0) return { error: 'Ingen frø valgt' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('seeds')
    .delete()
    .in('id', seedIds)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true, count: seedIds.length }
}

export async function bulkUpdateSeeds(
  seedIds: string[],
  updates: {
    status?: string
    primary_category?: string
    subcategory?: string
    brand?: string
  }
) {
  if (seedIds.length === 0) return { error: 'Ingen frø valgt' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('seeds')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in('id', seedIds)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true, count: seedIds.length }
}

// ============================================
// SUBCATEGORY MANAGEMENT
// ============================================

export async function createSubcategory(primaryCategory: string, name: string) {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const { error } = await supabase.from('seed_subcategories').insert({
    user_id: userId,
    primary_category: primaryCategory,
    name: name.trim(),
  })

  if (error) {
    if (error.code === '23505') return { error: 'Kategorien findes allerede' }
    return { error: error.message }
  }
  revalidateAll()
  return { success: true }
}

export async function deleteSubcategory(subcategoryId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('seed_subcategories').delete().eq('id', subcategoryId)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

// ============================================
// PLANT OPERATIONS (unchanged)
// ============================================

export async function createPlant(formData: FormData) {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const { error } = await supabase.from('plants').insert({
    user_id: userId,
    name: formData.get('name') as string,
    variety: (formData.get('variety') as string) || null,
    seed_id: (formData.get('seed_id') as string) || null,
    guide_id: (formData.get('guide_id') as string) || null,
    status: (formData.get('status') as string) || 'planned',
    location: (formData.get('location') as string) || null,
    sow_date: (formData.get('sow_date') as string) || null,
    quantity: formData.get('quantity') ? Number(formData.get('quantity')) : 1,
    notes: (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function updatePlant(plantId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('plants')
    .update({
      name: formData.get('name') as string,
      variety: (formData.get('variety') as string) || null,
      status: (formData.get('status') as string) || 'planned',
      location: (formData.get('location') as string) || null,
      sow_date: (formData.get('sow_date') as string) || null,
      germination_date: (formData.get('germination_date') as string) || null,
      prick_date: (formData.get('prick_date') as string) || null,
      plant_out_date: (formData.get('plant_out_date') as string) || null,
      first_harvest_date: (formData.get('first_harvest_date') as string) || null,
      quantity: formData.get('quantity') ? Number(formData.get('quantity')) : 1,
      notes: (formData.get('notes') as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function deletePlant(plantId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('plants').delete().eq('id', plantId)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}
