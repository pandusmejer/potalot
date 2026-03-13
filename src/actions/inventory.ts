'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'

export async function createSeed(formData: FormData) {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const { error } = await supabase.from('seeds').insert({
    user_id: userId,
    name: formData.get('name') as string,
    variety: (formData.get('variety') as string) || null,
    brand: (formData.get('brand') as string) || null,
    guide_id: (formData.get('guide_id') as string) || null,
    quantity: formData.get('quantity') ? Number(formData.get('quantity')) : null,
    year_purchased: formData.get('year_purchased') ? Number(formData.get('year_purchased')) : null,
    expiry_year: formData.get('expiry_year') ? Number(formData.get('expiry_year')) : null,
    notes: (formData.get('notes') as string) || null,
    status: (formData.get('status') as string) || 'in_stock',
  })

  if (error) return { error: error.message }
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSeed(seedId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('seeds')
    .update({
      name: formData.get('name') as string,
      variety: (formData.get('variety') as string) || null,
      brand: (formData.get('brand') as string) || null,
      guide_id: (formData.get('guide_id') as string) || null,
      quantity: formData.get('quantity') ? Number(formData.get('quantity')) : null,
      year_purchased: formData.get('year_purchased') ? Number(formData.get('year_purchased')) : null,
      expiry_year: formData.get('expiry_year') ? Number(formData.get('expiry_year')) : null,
      notes: (formData.get('notes') as string) || null,
      status: (formData.get('status') as string) || 'in_stock',
      updated_at: new Date().toISOString(),
    })
    .eq('id', seedId)

  if (error) return { error: error.message }
  revalidatePath('/inventory')
  return { success: true }
}

export async function createSeedsBatch(
  seeds: Array<{
    name: string
    variety?: string | null
    brand?: string | null
    guide_id?: string | null
    quantity?: number | null
    year_purchased?: number | null
    expiry_year?: number | null
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
    year_purchased: s.year_purchased || null,
    expiry_year: s.expiry_year || null,
    notes: s.notes || null,
    status: s.status || 'in_stock',
  }))

  const { error } = await supabase.from('seeds').insert(rows)

  if (error) return { error: error.message }
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
  return { success: true, count: rows.length }
}

export async function deleteSeed(seedId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('seeds').delete().eq('id', seedId)

  if (error) return { error: error.message }
  revalidatePath('/inventory')
  return { success: true }
}

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
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
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
  revalidatePath('/inventory')
  return { success: true }
}

export async function deletePlant(plantId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('plants').delete().eq('id', plantId)

  if (error) return { error: error.message }
  revalidatePath('/inventory')
  return { success: true }
}
