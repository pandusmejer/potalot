'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { SowingEvent } from '@/lib/types'

interface SowingEventRow {
  id: string
  user_id: string
  plant_id: string
  inventory_item_id: string | null
  sown_count: number
  sowing_date: string
  container_type: string | null
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function rowToEvent(row: SowingEventRow): SowingEvent {
  return {
    id: row.id,
    userId: row.user_id,
    plantId: row.plant_id,
    inventoryItemId: row.inventory_item_id,
    sownCount: row.sown_count,
    sowingDate: row.sowing_date,
    containerType: row.container_type,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getSowingEventsForPlant(plantId: string): Promise<SowingEvent[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sowing_events')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .order('sowing_date', { ascending: false })

  if (error) return []
  return (data as SowingEventRow[]).map(rowToEvent)
}

export interface UpdateSowingEventInput {
  sownCount?: number
  sowingDate?: string
  containerType?: string | null
  location?: string | null
  notes?: string | null
}

export async function updateSowingEvent(
  id: string,
  input: UpdateSowingEventInput
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.sownCount !== undefined) update.sown_count = input.sownCount
  if (input.sowingDate !== undefined) update.sowing_date = input.sowingDate
  if (input.containerType !== undefined) update.container_type = input.containerType
  if (input.location !== undefined) update.location = input.location
  if (input.notes !== undefined) update.notes = input.notes

  const { data: row, error } = await supabase
    .from('sowing_events')
    .update(update)
    .eq('id', id)
    .eq('user_id', userId)
    .select('plant_id, inventory_item_id')
    .single()

  if (error || !row) {
    console.error('updateSowingEvent fejlede:', error)
    return { error: 'Kunne ikke gemme ændringerne. Prøv igen.' }
  }

  revalidatePath('/froebank')
  if (row.inventory_item_id) revalidatePath(`/froebank/${row.inventory_item_id}`)
  revalidatePath(`/mine-planter/${row.plant_id}`)
  return { ok: true }
}

export async function deleteSowingEvent(id: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('sowing_events')
    .select('plant_id, inventory_item_id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  const { error } = await supabase
    .from('sowing_events')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('deleteSowingEvent fejlede:', error)
    return { error: 'Kunne ikke slette hændelsen. Prøv igen.' }
  }

  revalidatePath('/froebank')
  if (row?.inventory_item_id) revalidatePath(`/froebank/${row.inventory_item_id}`)
  if (row?.plant_id) revalidatePath(`/mine-planter/${row.plant_id}`)
  return { ok: true }
}
