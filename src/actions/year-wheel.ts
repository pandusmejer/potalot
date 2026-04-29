'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  YEAR_WHEEL_TASKS, type YearWheelTask, type YearWheelCategory, type YearWheelTimeWindow,
} from '@/lib/year-wheel-library'

const CATEGORY_TO_TASK_TYPE: Record<YearWheelCategory, string> = {
  jord: 'maintenance',
  saaning: 'sowing',
  plantning: 'plant_out',
  beskaering: 'pruning',
  vanding: 'watering',
  goedning: 'fertilizing',
  plaene: 'maintenance',
  skadedyr: 'pest_check',
  hoest: 'harvest',
  drivhus: 'maintenance',
  krukker: 'maintenance',
  'frugt-baer': 'maintenance',
  pryd: 'maintenance',
  haek: 'pruning',
  dyreliv: 'maintenance',
  vinterklargoering: 'maintenance',
  planlaegning: 'planning',
}

function dayOfMonth(window: YearWheelTimeWindow): number {
  switch (window) {
    case 'early_month': return 5
    case 'mid_month': return 15
    case 'late_month': return 25
    case 'all_month': return 15
    case 'after_frost': return 15
    case 'when_soil_ready': return 15
    case 'when_growth_starts': return 15
    case 'before_frost': return 25
  }
}

function templateDate(t: YearWheelTask, year: number): string {
  const day = dayOfMonth(t.timeWindow)
  return `${year}-${String(t.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export interface AddYearWheelInput {
  templateIds: string[]
  year: number
}

export async function addYearWheelTasks(input: AddYearWheelInput): Promise<
  | { added: number; skipped: number }
  | { error: string }
> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const templates = YEAR_WHEEL_TASKS.filter(t => input.templateIds.includes(t.id))
  if (templates.length === 0) return { added: 0, skipped: 0 }

  // Skip dem brugeren allerede har tilføjet (samme template_id, samme år)
  const sourceIds = templates.map(t => t.id)
  const { data: existing } = await supabase
    .from('calendar_tasks')
    .select('source_id')
    .eq('user_id', userId)
    .eq('source', 'general')
    .in('source_id', sourceIds)
  const existingIds = new Set((existing ?? []).map((r: { source_id: string }) => r.source_id))

  const toInsert = templates
    .filter(t => !existingIds.has(t.id))
    .map(t => ({
      user_id: userId,
      title: t.title,
      description: t.description,
      date: templateDate(t, input.year),
      task_type: CATEGORY_TO_TASK_TYPE[t.category],
      priority: t.priority === 'high' ? 'high' : t.priority === 'low' ? 'low' : 'medium',
      status: 'open',
      source: 'general',
      source_id: t.id,
      is_recurring: false,
    }))

  if (toInsert.length === 0) {
    return { added: 0, skipped: templates.length }
  }

  const { error } = await supabase.from('calendar_tasks').insert(toInsert)
  if (error) return { error: error.message }

  revalidatePath('/kalender')
  revalidatePath('/')
  return { added: toInsert.length, skipped: templates.length - toInsert.length }
}
