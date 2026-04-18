'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { PlantEvent, EventType } from '@/lib/types'

/**
 * Plant events er append-only. Få aldrig delete-funktion her.
 * I stedet kan en event "annulleres" via en counter-event hvis nødvendigt.
 */

export async function getPlantEvents(plantId: string): Promise<PlantEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plant_events')
    .select('*')
    .eq('plant_id', plantId)
    .order('event_date', { ascending: false })
    .order('event_time', { ascending: false })
  return data ?? []
}

export async function getRecentEvents(limit = 20): Promise<PlantEvent[]> {
  const userId = DEMO_USER_ID
  const supabase = await createClient()
  const { data } = await supabase
    .from('plant_events')
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: false })
    .order('event_time', { ascending: false })
    .limit(limit)
  return data ?? []
}

/**
 * Log en event på en plante. Indeholder INGEN side-effects (ingen kaskade).
 * Kaskade-logik (livscyklus-overgang, opgave-oprettelse) kommer i Fase 2.
 */
export async function logPlantEvent(params: {
  plant_id: string
  event_type: EventType
  event_date?: string
  data?: Record<string, unknown>
  notes?: string
  photo_urls?: string[]
  auto_generated?: boolean
}) {
  const userId = DEMO_USER_ID
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plant_events')
    .insert({
      plant_id: params.plant_id,
      user_id: userId,
      event_type: params.event_type,
      event_date: params.event_date ?? new Date().toISOString().split('T')[0],
      data: params.data ?? {},
      notes: params.notes ?? null,
      photo_urls: params.photo_urls ?? null,
      auto_generated: params.auto_generated ?? false,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true, eventId: data.id }
}
