'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { InventoryItem, PrimaryCategoryId, InventoryStatus, GrowingLocation } from '@/lib/types'

interface InventoryRow {
  id: string
  user_id: string
  name: string
  latin_name: string | null
  variety: string | null
  supplier: string | null
  primary_category_id: string
  subcategory_id: string | null
  quantity: number | null
  seed_count: number | null
  purchase_date: string | null
  purchase_year: number | null
  purchase_url: string | null
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

function rowToItem(row: InventoryRow, counts?: { seedsSown?: number; seedsRemaining?: number }): InventoryItem {
  const seedCount = row.seed_count
  const seedsSown = counts?.seedsSown ?? 0
  const seedsRemaining = seedCount != null ? Math.max(seedCount - seedsSown, 0) : undefined
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    latinName: row.latin_name,
    variety: row.variety,
    supplier: row.supplier,
    primaryCategoryId: row.primary_category_id as PrimaryCategoryId,
    subcategoryId: row.subcategory_id,
    quantity: row.quantity,
    seedCount: row.seed_count,
    seedsSown,
    seedsRemaining,
    purchaseDate: row.purchase_date,
    purchaseYear: row.purchase_year,
    purchaseUrl: row.purchase_url,
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
    imageIds: row.image_urls ?? [],
    primaryImageId: row.primary_image_url,
    guideId: row.guide_id,
    linkedPlantIds: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('is_favorite', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('getAllInventoryItems error:', error)
    return []
  }

  const rows = data as InventoryRow[]
  // Hent counts samlet
  const { data: counts } = await supabase
    .from('inventory_seed_counts')
    .select('inventory_item_id, seeds_sown, seeds_remaining')
    .eq('user_id', userId)
  const countMap = new Map(
    (counts ?? []).map((c: { inventory_item_id: string; seeds_sown: number; seeds_remaining: number }) =>
      [c.inventory_item_id, { seedsSown: c.seeds_sown, seedsRemaining: c.seeds_remaining }]
    )
  )
  return rows.map(r => rowToItem(r, countMap.get(r.id)))
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  const { data: counts } = await supabase
    .from('inventory_seed_counts')
    .select('seeds_sown, seeds_remaining')
    .eq('inventory_item_id', id)
    .maybeSingle()
  const c = counts as { seeds_sown: number; seeds_remaining: number } | null
  return rowToItem(data as InventoryRow, c ? { seedsSown: c.seeds_sown, seedsRemaining: c.seeds_remaining } : undefined)
}

export interface CreateInventoryInput {
  name: string
  latinName?: string
  variety?: string
  supplier?: string
  primaryCategoryId: PrimaryCategoryId
  subcategoryId?: string
  quantity?: number
  seedCount?: number
  purchaseDate?: string
  purchaseYear?: number
  purchaseUrl?: string
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
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      user_id: userId,
      name: input.name,
      latin_name: input.latinName || null,
      variety: input.variety || null,
      supplier: input.supplier || null,
      primary_category_id: input.primaryCategoryId,
      subcategory_id: input.subcategoryId || null,
      quantity: input.quantity ?? null,
      seed_count: input.seedCount ?? null,
      purchase_date: input.purchaseDate || null,
      purchase_year: input.purchaseYear ?? null,
      purchase_url: input.purchaseUrl || null,
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
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) update.name = input.name
  if (input.latinName !== undefined) update.latin_name = input.latinName || null
  if (input.variety !== undefined) update.variety = input.variety || null
  if (input.supplier !== undefined) update.supplier = input.supplier || null
  if (input.primaryCategoryId !== undefined) update.primary_category_id = input.primaryCategoryId
  if (input.subcategoryId !== undefined) update.subcategory_id = input.subcategoryId || null
  if (input.quantity !== undefined) update.quantity = input.quantity
  if (input.seedCount !== undefined) update.seed_count = input.seedCount
  if (input.purchaseDate !== undefined) update.purchase_date = input.purchaseDate || null
  if (input.purchaseYear !== undefined) update.purchase_year = input.purchaseYear
  if (input.purchaseUrl !== undefined) update.purchase_url = input.purchaseUrl || null
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
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/froebank')
  revalidatePath(`/froebank/${id}`)
  return { ok: true }
}

export async function deleteInventoryItem(id: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/froebank')
  return { ok: true }
}

export async function toggleFavorite(id: string): Promise<{ ok: true; isFavorite: boolean } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('inventory_items')
    .select('is_favorite')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!current) return { error: 'Element ikke fundet' }

  const newValue = !current.is_favorite
  const { error } = await supabase
    .from('inventory_items')
    .update({ is_favorite: newValue, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/froebank')
  revalidatePath(`/froebank/${id}`)
  return { ok: true, isFavorite: newValue }
}

export async function togglePinned(id: string): Promise<{ ok: true; isPinned: boolean } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('inventory_items')
    .select('is_pinned')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!current) return { error: 'Element ikke fundet' }

  const newValue = !current.is_pinned
  const { error } = await supabase
    .from('inventory_items')
    .update({ is_pinned: newValue, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/froebank')
  revalidatePath(`/froebank/${id}`)
  return { ok: true, isPinned: newValue }
}

export async function getCustomSubcategories() {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('custom_subcategories')
    .select('*')
    .eq('user_id', userId)
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
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('custom_subcategories')
    .insert({
      user_id: userId,
      name: input.name,
      parent_category_ids: input.parentCategoryIds,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette' }

  revalidatePath('/froebank')
  return { id: data.id as string }
}
