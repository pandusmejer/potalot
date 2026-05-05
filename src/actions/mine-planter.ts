'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  generateTasksFromGuide, resolveGuideForInventory, filterRelevantTasks,
} from '@/lib/task-generation'
import { getAllGuides } from '@/actions/guides'
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
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plants_v2')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getAllPlants error:', error)
    return []
  }
  return (data as PlantRow[]).map(rowToPlant)
}

export async function getPlant(id: string): Promise<Plant | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plants_v2')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return rowToPlant(data as PlantRow)
}

export async function getPlantLogs(plantId: string): Promise<PlantLog[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plant_logs_v2')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
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
  containerType?: string
  location?: string
  note?: string
  /** Hvis sat: tilføj til denne eksisterende plante. Hvis udeladt og en findes for år+inventory, tilbydes valg via mergeStrategy. */
  attachToPlantId?: string
  /** 'merge' = tilføj til eksisterende plante for samme år, 'new' = opret nyt hold */
  mergeStrategy?: 'merge' | 'new'
}

/**
 * Sår fra et frøbank-element. Per spec sektion 13:
 * - Find eksisterende plante med samme inventory_item + growing_year
 * - Hvis findes og mergeStrategy != 'new': tilføj sowing_event til eksisterende plante
 * - Hvis ikke: opret ny plante + sowing_event
 * Returnerer mergeOption hvis valg skal tages.
 */
export async function saaFroeFraInventory(input: SaaFroeInput): Promise<
  | { id: string; tasksCreated: number; mergedIntoExisting: boolean }
  | { needsMergeChoice: true; existingPlantId: string }
  | { error: string }
> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  // Hent inventory item
  const { data: invItem, error: invErr } = await supabase
    .from('inventory_items')
    .select('id, name, variety, guide_id, status')
    .eq('id', input.inventoryItemId)
    .eq('user_id', userId)
    .single()

  if (invErr || !invItem) return { error: 'Frøbank-element ikke fundet' }
  const inv = invItem as { id: string; name: string; variety: string | null; guide_id: string | null; status: string }

  const growingYear = parseInt(input.date.split('-')[0], 10)

  // Find eksisterende plante for samme år
  const { data: existing } = await supabase
    .from('plants_v2')
    .select('id')
    .eq('user_id', userId)
    .eq('source_inventory_id', inv.id)
    .eq('growing_year', growingYear)
    .eq('is_archived', false)
    .limit(1)
    .maybeSingle()

  // Beslut: merge til eksisterende eller opret ny
  let plantId: string
  let mergedIntoExisting = false

  if (input.attachToPlantId) {
    plantId = input.attachToPlantId
    mergedIntoExisting = true
  } else if (existing && input.mergeStrategy === 'new') {
    // Brugeren har valgt "opret nyt hold"
    const { data: newPlant, error: plantErr } = await createNewPlantEntry()
    if (plantErr || !newPlant) return { error: plantErr ?? 'Kunne ikke oprette plante' }
    plantId = newPlant.id
  } else if (existing && !input.mergeStrategy) {
    // Eksisterer og brugeren har ikke valgt — bed UI om valg
    return { needsMergeChoice: true, existingPlantId: existing.id }
  } else if (existing && input.mergeStrategy === 'merge') {
    plantId = existing.id
    mergedIntoExisting = true
  } else {
    // Ingen eksisterende — opret ny
    const { data: newPlant, error: plantErr } = await createNewPlantEntry()
    if (plantErr || !newPlant) return { error: plantErr ?? 'Kunne ikke oprette plante' }
    plantId = newPlant.id
  }

  // Opret sowing_event uanset
  await supabase
    .from('sowing_events')
    .insert({
      user_id: userId,
      plant_id: plantId,
      inventory_item_id: inv.id,
      sown_count: input.quantity,
      sowing_date: input.date,
      container_type: input.containerType || null,
      location: input.location || null,
      notes: input.note || null,
    })

  // Opdater plantens samlede quantity
  const { data: total } = await supabase
    .from('sowing_events')
    .select('sown_count')
    .eq('plant_id', plantId)
  const totalQty = (total ?? []).reduce((sum, r) => sum + (r as { sown_count: number }).sown_count, 0)
  await supabase
    .from('plants_v2')
    .update({ quantity: totalQty, updated_at: new Date().toISOString() })
    .eq('id', plantId)

  // Opdater inventory status hvis 'i_froebank'
  if (inv.status === 'i_froebank') {
    await supabase
      .from('inventory_items')
      .update({ status: 'saaet', updated_at: new Date().toISOString() })
      .eq('id', inv.id)
  }

  // Tasks: kun for nye planter (eksisterende har dem allerede)
  let tasksCreated = 0
  if (!mergedIntoExisting) {
    const allGuides = await getAllGuides()
    const guide = resolveGuideForInventory(
      { guideId: inv.guide_id, name: inv.name },
      allGuides
    )
    if (guide) {
      const generated = filterRelevantTasks(generateTasksFromGuide({
        guide,
        sowDate: input.date,
        plantId,
        inventoryItemId: inv.id as string,
      }))
      if (generated.length > 0) {
        const taskRows = generated.map(t => ({
          user_id: userId,
          title: t.title,
          date: t.date,
          task_type: t.taskType,
          priority: t.priority,
          status: 'open',
          source: t.source,
          source_id: t.sourceId,
          linked_plant_id: t.linkedPlantId,
          linked_inventory_item_id: t.linkedInventoryItemId,
          linked_guide_id: null,
          is_recurring: false,
        }))
        const { error: taskErr } = await supabase.from('calendar_tasks').insert(taskRows)
        if (!taskErr) tasksCreated = taskRows.length
      }
    }
  }

  revalidatePath('/froebank')
  revalidatePath(`/froebank/${inv.id}`)
  revalidatePath('/mine-planter')
  revalidatePath(`/mine-planter/${plantId}`)
  revalidatePath('/kalender')
  revalidatePath('/')

  return { id: plantId, tasksCreated, mergedIntoExisting }

  async function createNewPlantEntry(): Promise<{ data: { id: string } | null; error: string | null }> {
    const { data, error } = await supabase
      .from('plants_v2')
      .insert({
        user_id: userId,
        source_inventory_id: inv.id,
        name: inv.name,
        variety: inv.variety,
        status: 'saaet',
        location: input.location || null,
        sow_date: input.date,
        quantity: 0, // bliver opdateret efter sowing_event er sat
        growing_year: growingYear,
        guide_id: inv.guide_id,
        is_archived: false,
      })
      .select('id')
      .single()
    return { data: data as { id: string } | null, error: error?.message ?? null }
  }
}

export async function createPlantLog(input: {
  plantId: string
  date: string
  type: PlantLogType
  title?: string
  note?: string
}): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  const { data, error } = await supabase
    .from('plant_logs_v2')
    .insert({
      plant_id: input.plantId,
      user_id: userId,
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
  const { id: userId } = await requireUser(); const supabase = await createClient()

  const { error } = await supabase
    .from('plants_v2')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', plantId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  // Skriv også en log-entry så historikken er sporet
  await supabase
    .from('plant_logs_v2')
    .insert({
      plant_id: plantId,
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      type: 'status_change',
      note: `Status ændret til "${status}"`,
    })

  revalidatePath(`/mine-planter/${plantId}`)
  return { ok: true }
}

export async function archivePlant(plantId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()
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
    .eq('user_id', userId)

  if (error) return { error: error.message }

  await supabase.from('plant_logs_v2').insert({
    plant_id: plantId,
    user_id: userId,
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
  const { id: userId } = await requireUser(); const supabase = await createClient()
  const { error } = await supabase
    .from('plants_v2')
    .delete()
    .eq('id', plantId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/mine-planter')
  return { ok: true }
}
