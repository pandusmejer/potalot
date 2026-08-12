'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Tilføj generelle haveopgaver til brugerens kalender.
 *
 * Trækker template-data direkte fra general_garden_tasks (DB) som
 * single source of truth. Linker via source='general' og source_id =
 * general_garden_tasks.id, så det er idempotent (kan ikke tilføjes igen
 * samme år hvis allerede der).
 */

function inferDayFromTimeWindow(window: string | null): number {
  if (!window) return 15
  const w = window.toLowerCase()
  if (w.includes('primo') || w.includes('begynd')) return 5
  if (w.includes('medio') || w.includes('midt')) return 15
  if (w.includes('slut') || w.includes('sidst')) return 25
  if (w.includes('før frost')) return 25
  return 15
}

function inferTaskType(category: string | null): string {
  if (!category) return 'custom'
  const c = category.toLowerCase()
  if (c.includes('såning') || c.includes('forspiring')) return 'sowing'
  if (c.includes('plantning') || c.includes('udplantning') || c.includes('løgplanter')) return 'plant_out'
  if (c.includes('beskæring')) return 'pruning'
  if (c.includes('vanding')) return 'watering'
  if (c.includes('gødning')) return 'fertilizing'
  if (c.includes('høst')) return 'harvest'
  if (c.includes('planlægning') || c.includes('klargøring')) return 'planning'
  if (c.includes('ukrudt') || c.includes('skadedyr')) return 'pest_check'
  return 'custom'
}

type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

function normalizePriority(p: string | null): TaskPriority {
  if (p === 'low' || p === 'medium' || p === 'high' || p === 'critical') return p
  return 'medium'
}

export interface AddGeneralTasksInput {
  /** UUIDer fra general_garden_tasks (DB) */
  generalTaskIds: string[]
  year: number
}

/**
 * Tilføj en eller flere general_garden_tasks til brugerens kalender for et
 * givent år. Idempotent: skipper rækker brugeren allerede har tilføjet.
 */
export async function addGeneralTasksToCalendar(input: AddGeneralTasksInput): Promise<
  | { added: number; skipped: number }
  | { error: string }
> {
  const { id: userId } = await requireUser()
  if (input.generalTaskIds.length === 0) return { added: 0, skipped: 0 }

  const supabase = await createClient()

  // Hent template-data fra DB
  const { data: templates, error: templatesErr } = await supabase
    .from('general_garden_tasks')
    .select('id, title, description, month, category, priority, time_window')
    .in('id', input.generalTaskIds)
    .eq('is_active', true)

  if (templatesErr) {
    console.error('addGeneralTasksToCalendar opslag fejlede:', templatesErr)
    return { error: 'Kunne ikke tilføje opgaverne. Prøv igen.' }
  }
  if (!templates || templates.length === 0) return { added: 0, skipped: 0 }

  // Skip allerede tilføjede (samme template_id, samme år via source='general')
  const { data: existing } = await supabase
    .from('calendar_tasks')
    .select('source_id, date')
    .eq('user_id', userId)
    .eq('source', 'general')
    .in('source_id', input.generalTaskIds)

  type ExistingRow = { source_id: string; date: string }
  const existingThisYear = new Set(
    ((existing ?? []) as ExistingRow[])
      .filter(r => r.date.startsWith(String(input.year)))
      .map(r => r.source_id)
  )

  type Template = {
    id: string
    title: string
    description: string | null
    month: number
    category: string | null
    priority: string | null
    time_window: string | null
  }

  const toInsert = (templates as Template[])
    .filter(t => !existingThisYear.has(t.id))
    .map(t => {
      const day = inferDayFromTimeWindow(t.time_window)
      const date = `${input.year}-${String(t.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return {
        user_id: userId,
        title: t.title,
        description: t.description,
        date,
        task_type: inferTaskType(t.category),
        priority: normalizePriority(t.priority),
        status: 'open',
        source: 'general',
        source_id: t.id,
        is_recurring: false,
      }
    })

  if (toInsert.length === 0) {
    return { added: 0, skipped: templates.length }
  }

  const { error } = await supabase.from('calendar_tasks').insert(toInsert)
  if (error) {
    console.error('addGeneralTasksToCalendar fejlede:', error)
    return { error: 'Kunne ikke tilføje opgaverne. Prøv igen.' }
  }

  revalidatePath('/kalender')
  revalidatePath('/')
  return { added: toInsert.length, skipped: templates.length - toInsert.length }
}
