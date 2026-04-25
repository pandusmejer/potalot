'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { InventoryItem, PrimaryCategoryId, InventoryStatus, GrowingLocation } from '@/lib/types'

// ============================================
// Mappers (snake_case DB ↔ camelCase TypeScript)
// ============================================

interface InventoryRow {
  id: string
  user_id: string
  name: string
  variety: string | null
  supplier: string | null
  primary_category_id: string
  subcategory_id: string | null
  quantity: number | null
  purchase_date: string | null
  expiry_date: string | null
  notes: string | null
  sowing_months: number[]
  sowing_depth_mm: number
  pre_cultivation: boolean | null
  planting_out_months: number[]
  harvest_months: number[]
  light: string | null
  water: string | null
  soil: string | null
  germination_temperature: string | null
  germination_days: string | null
  plant_spacing: string | null
  row_spacing: string | null
  growing_locations: string[]
  status: string
  is_favorite: boolean
  is_pinned: boolean
  image_urls: string[]
  primary_image_url: string | null
  guide_id: string | null
  created_at: string
  updated_at: string
}

function rowToItem(row: InventoryRow): InventoryItem {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    variety: row.variety,
    supplier: row.supplier,
    primaryCategoryId: row.primary_category_id as PrimaryCategoryId,
    subcategoryId: row.subcategory_id,
    quantity: row.quantity,
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    notes: row.notes,
    sowingMonths: row.sowing_months ?? [],
    sowingDepthMm: row.sowing_depth_mm ?? 0,
    preCultivation: row.pre_cultivation,
    plantingOutMonths: row.planting_out_months ?? [],
    harvestMonths: row.harvest_months ?? [],
    light: (row.light as InventoryItem['light']) ?? null,
    water: (row.water as InventoryItem['water']) ?? null,
    soil: row.soil,
    germinationTemperature: row.germination_temperature,
    germinationDays: row.germination_days,
    plantSpacing: row.plant_spacing,
    rowSpacing: row.row_spacing,
    growingLocations: (row.growing_locations ?? []) as GrowingLocation[],
    status: row.status as InventoryStatus,
    isFavorite: row.is_favorite,
    isPinned: row.is_pinned,
    imageIds: [], // legacy felt, ikke brugt
    primaryImageId: row.primary_image_url,
    guideId: row.guide_id,
    linkedPlantIds: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// Read
// ============================================

export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .order('is_pinned', { ascending: false })
    .order('is_favorite', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('getAllInventoryItems error:', error)
    return []
  }
  return (data as InventoryRow[]).map(rowToItem)
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)
    .single()

  if (error || !data) return null
  return rowToItem(data as InventoryRow)
}

// ============================================
// Mutations
// ============================================

export interface CreateInventoryInput {
  name: string
  variety?: string
  supplier?: string
  primaryCategoryId: PrimaryCategoryId
  subcategoryId?: string
  quantity?: number
  purchaseDate?: string
  expiryDate?: string
  notes?: string
  sowingMonths?: number[]
  sowingDepthMm?: number
  preCultivation?: boolean
  plantingOutMonths?: number[]
  harvestMonths?: number[]
  light?: 'full_sun' | 'partial_shade' | 'shade'
  water?: 'low' | 'regular' | 'high'
  growingLocations?: GrowingLocation[]
  imageUrls?: string[]
  primaryImageUrl?: string
}

export async function createInventoryItem(input: CreateInventoryInput): Promise<{ id: string } | { error: string }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      user_id: DEMO_USER_ID,
      name: input.name,
      variety: input.variety || null,
      supplier: input.supplier || null,
      primary_category_id: input.primaryCategoryId,
      subcategory_id: input.subcategoryId || null,
      quantity: input.quantity ?? null,
      purchase_date: input.purchaseDate || null,
      expiry_date: input.expiryDate || null,
      notes: input.notes || null,
      sowing_months: input.sowingMonths ?? [],
      sowing_depth_mm: input.sowingDepthMm ?? 0,
      pre_cultivation: input.preCultivation ?? null,
      planting_out_months: input.plantingOutMonths ?? [],
      harvest_months: input.harvestMonths ?? [],
      light: input.light ?? null,
      water: input.water ?? null,
      growing_locations: input.growingLocations ?? [],
      status: 'i_froebank',
      image_urls: input.imageUrls ?? [],
      primary_image_url: input.primaryImageUrl ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette' }

  revalidatePath('/froebank')
  return { id: data.id as string }
}

export async function updateInventoryItem(
  id: string,
  input: Partial<CreateInventoryInput>
): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) update.name = input.name
  if (input.variety !== undefined) update.variety = input.variety || null
  if (input.supplier !== undefined) update.supplier = input.supplier || null
  if (input.primaryCategoryId !== undefined) update.primary_category_id = input.primaryCategoryId
  if (input.subcategoryId !== undefined) update.subcategory_id = input.subcategoryId || null
  if (input.quantity !== undefined) update.quantity = input.quantity
  if (input.purchaseDate !== undefined) update.purchase_date = input.purchaseDate || null
  if (input.expiryDate !== undefined) update.expiry_date = input.expiryDate || null
  if (input.notes !== undefined) update.notes = input.notes || null
  if (input.sowingMonths !== undefined) update.sowing_months = input.sowingMonths
  if (input.sowingDepthMm !== undefined) update.sowing_depth_mm = input.sowingDepthMm
  if (input.preCultivation !== undefined) update.pre_cultivation = input.preCultivation
  if (input.plantingOutMonths !== undefined) update.planting_out_months = input.plantingOutMonths
  if (input.harvestMonths !== undefined) update.harvest_months = input.harvestMonths
  if (input.light !== undefined) update.light = input.light
  if (input.water !== undefined) update.water = input.water
  if (input.growingLocations !== undefined) update.growing_locations = input.growingLocations
  if (input.imageUrls !== undefined) update.image_urls = input.imageUrls
  if (input.primaryImageUrl !== undefined) update.primary_image_url = input.primaryImageUrl

  const { error } = await supabase
    .from('inventory_items')
    .update(update)
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/froebank')
  revalidatePath(`/froebank/${id}`)
  return { ok: true }
}

export async function deleteInventoryItem(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/froebank')
  return { ok: true }
}

export async function toggleFavorite(id: string): Promise<{ ok: true; isFavorite: boolean } | { error: string }> {
  const supabase = createClient()

  // Hent nuværende værdi
  const { data: current } = await supabase
    .from('inventory_items')
    .select('is_favorite')
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)
    .single()

  if (!current) return { error: 'Element ikke fundet' }

  const newValue = !current.is_favorite
  const { error } = await supabase
    .from('inventory_items')
    .update({ is_favorite: newValue, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/froebank')
  revalidatePath(`/froebank/${id}`)
  return { ok: true, isFavorite: newValue }
}

export async function togglePinned(id: string): Promise<{ ok: true; isPinned: boolean } | { error: string }> {
  const supabase = createClient()

  const { data: current } = await supabase
    .from('inventory_items')
    .select('is_pinned')
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)
    .single()

  if (!current) return { error: 'Element ikke fundet' }

  const newValue = !current.is_pinned
  const { error } = await supabase
    .from('inventory_items')
    .update({ is_pinned: newValue, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/froebank')
  revalidatePath(`/froebank/${id}`)
  return { ok: true, isPinned: newValue }
}

// ============================================
// Custom subcategories
// ============================================

export async function getCustomSubcategories() {
  const supabase = createClient()
  const { data } = await supabase
    .from('custom_subcategories')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .order('name')

  return (data ?? []).map(r => ({
    id: r.id as string,
    name: r.name as string,
    parentCategoryIds: (r.parent_category_ids ?? []) as PrimaryCategoryId[],
    isSystem: false as const,
    createdByUserId: r.user_id as string,
    createdAt: r.created_at as string,
  }))
}

export async function createCustomSubcategory(input: {
  name: string
  parentCategoryIds: PrimaryCategoryId[]
}): Promise<{ id: string } | { error: string }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('custom_subcategories')
    .insert({
      user_id: DEMO_USER_ID,
      name: input.name,
      parent_category_ids: input.parentCategoryIds,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette' }

  revalidatePath('/froebank')
  return { id: data.id as string }
}
