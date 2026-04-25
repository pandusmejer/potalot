'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { Plant, PlantLog, PlantStatus, PlantLogType } from '@/lib/types'

// ============================================
// Mappers
// ============================================

interface PlantRow {
  id: string
  user_id: string
  source_inventory_id: string | null
  name: string
  variety: string | null
  status: string
  location: string | null
  sow_date: string | null
  planting_out_date: string | null
  first_harvest_date: string | null
  quantity: number
  image_urls: string[]
  primary_image_url: string | null
  guide_id: string | null
  is_archived: boolean
  archived_at: string | null
  archived_year: number | null
  created_at: string
  updated_at: string
}

interface PlantLogRow {
  id: string
  plant_id: string
  user_id: string
  date: string
  type: string
  title: string | null
  note: string | null
  image_urls: string[]
  linked_task_id: string | null
  created_at: string
  updated_at: string
}

function rowToPlant(row: PlantRow): Plant {
  return {
    id: row.id,
    userId: row.user_id,
    sourceElementId: row.source_inventory_id,
    name: row.name,
    variety: row.variety,
    status: row.status as PlantStatus,
    location: row.location,
    sowDate: row.sow_date,
    plantingOutDate: row.planting_out_date,
    firstHarvestDate: row.first_harvest_date,
    quantity: row.quantity,
    imageIds: row.image_urls ?? [],
    primaryImageId: row.primary_image_url,
    logIds: [],                  // populated separately
    guideId: row.guide_id,
    isArchived: row.is_archived,
    archivedAt: row.archived_at,
    archivedYear: row.archived_year,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToLog(row: PlantLogRow): PlantLog {
  return {
    id: row.id,
    plantId: row.plant_id,
    userId: row.user_id,
    date: row.date,
    type: row.type as PlantLogType,
    title: row.title,
    note: row.note,
    imageIds: row.image_urls ?? [],
    linkedTaskId: row.linked_task_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// Read
// ============================================

export async function getAllPlants(): Promise<Plant[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('plants_v2')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getAllPlants error:', error)
    return []
  }
  return (data as PlantRow[]).map(rowToPlant)
}

export async function getPlant(id: string): Promise<Plant | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('plants_v2')
    .select('*')
    .eq('id', id)
    .eq('user_id', DEMO_USER_ID)
    .single()

  if (error || !data) return null
  return rowToPlant(data as PlantRow)
}

export async function getPlantLogs(plantId: string): Promise<PlantLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('plant_logs_v2')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', DEMO_USER_ID)
    .order('date', { ascending: false })

  if (error) return []
  return (data as PlantLogRow[]).map(rowToLog)
}

// ============================================
// Mutations
// ============================================

export interface SaaFroeInput {
  inventoryItemId: string
  date: string                      // YYYY-MM-DD
  quantity: number
  location?: string
  note?: string
}

/**
 * Sår fra et frøbank-element. Opretter plante + initial 'sowing' log.
 * Opdaterer også inventory item status til 'saaet'.
 */
export async function saaFroeFraInventory(input: SaaFroeInput): Promise<{ id: string } | { error: string }> {
  const supabase = createClient()

  // Hent inventory item
  const { data: invItem, error: invErr } = await supabase
    .from('inventory_items')
    .select('id, name, variety, guide_id, status')
    .eq('id', input.inventoryItemId)
    .eq('user_id', DEMO_USER_ID)
    .single()

  if (invErr || !invItem) return { error: 'Frøbank-element ikke fundet' }

  // Opret plante
  const { data: plant, error: plantErr } = await supabase
    .from('plants_v2')
    .insert({
      user_id: DEMO_USER_ID,
      source_inventory_id: invItem.id,
      name: invItem.name,
      variety: invItem.variety,
      status: 'saaet',
      location: input.location || null,
      sow_date: input.date,
      quantity: input.quantity,
      guide_id: invItem.guide_id,
      is_archived: false,
    })
    .select('id')
    .single()

  if (plantErr || !plant) return { error: plantErr?.message ?? 'Kunne ikke oprette plante' }

  // Opret initial log
  await supabase
    .from('plant_logs_v2')
    .insert({
      plant_id: plant.id,
      user_id: DEMO_USER_ID,
      date: input.date,
      type: 'sowing',
      title: 'Sået',
      note: input.note || `${input.quantity} ${input.quantity === 1 ? 'frø' : 'frø'} sået` + (input.location ? ` i ${input.location}` : ''),
    })

  // Opdater inventory status til 'saaet' hvis 'i_froebank'
  if (invItem.status === 'i_froebank') {
    await supabase
      .from('inventory_items')
      .update({ status: 'saaet', updated_at: new Date().toISOString() })
      .eq('id', invItem.id)
  }

  revalidatePath('/froebank')
  revalidatePath(`/froebank/${invItem.id}`)
  revalidatePath('/mine-planter')

  return { id: plant.id as string }
}

export async function createPlantLog(input: {
  plantId: string
  date: string
  type: PlantLogType
  title?: string
  note?: string
}): Promise<{ id: string } | { error: string }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('plant_logs_v2')
    .insert({
      plant_id: input.plantId,
      user_id: DEMO_USER_ID,
      date: input.date,
      type: input.type,
      title: input.title || null,
      note: input.note || null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke gemme log' }

  revalidatePath(`/mine-planter/${input.plantId}`)
  return { id: data.id as string }
}

export async function updatePlantStatus(
  plantId: string,
  status: PlantStatus
): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('plants_v2')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', plantId)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  // Skriv også en log-entry så historikken er sporet
  await supabase
    .from('plant_logs_v2')
    .insert({
      plant_id: plantId,
      user_id: DEMO_USER_ID,
      date: new Date().toISOString().split('T')[0],
      type: 'status_change',
      note: `Status ændret til "${status}"`,
    })

  revalidatePath(`/mine-planter/${plantId}`)
  return { ok: true }
}

export async function archivePlant(plantId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient()
  const now = new Date()

  const { error } = await supabase
    .from('plants_v2')
    .update({
      is_archived: true,
      archived_at: now.toISOString(),
      archived_year: now.getFullYear(),
      status: 'afsluttet',
      updated_at: now.toISOString(),
    })
    .eq('id', plantId)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  await supabase.from('plant_logs_v2').insert({
    plant_id: plantId,
    user_id: DEMO_USER_ID,
    date: now.toISOString().split('T')[0],
    type: 'archive',
    title: 'Arkiveret',
    note: `Sæson afsluttet ${now.getFullYear()}`,
  })

  revalidatePath('/mine-planter')
  revalidatePath(`/mine-planter/${plantId}`)
  return { ok: true }
}

export async function deletePlant(plantId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('plants_v2')
    .delete()
    .eq('id', plantId)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/mine-planter')
  return { ok: true }
}
