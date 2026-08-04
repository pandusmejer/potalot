'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type {
  CalendarTask, TaskType, TaskPriority, TaskStatus, TaskSource, PlantLogType,
} from '@/lib/types'

// ============================================
// Mappers
// ============================================

interface TaskRow {
  id: string
  user_id: string
  title: string
  description: string | null
  date: string
  due_date: string | null
  task_type: string
  priority: string
  status: string
  source: string
  source_id: string | null
  linked_plant_id: string | null
  linked_inventory_item_id: string | null
  linked_guide_id: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

function rowToTask(row: TaskRow): CalendarTask {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    date: row.date,
    dueDate: row.due_date,
    taskType: row.task_type as TaskType,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    source: row.source as TaskSource,
    sourceId: row.source_id,
    linkedPlantId: row.linked_plant_id,
    linkedInventoryItemId: row.linked_inventory_item_id,
    linkedGuideId: row.linked_guide_id,
    isRecurring: row.is_recurring,
    recurrenceRule: row.recurrence_rule,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// Read
// ============================================

/**
 * Berig tasks med plante-navn + sort fra linked_plant_id. Bruges af
 * TaskRow så brugeren ser HVILKEN plante en opgave hører til, frem
 * for bare 'Til plante'.
 */
async function enrichWithPlantNames(
  tasks: CalendarTask[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<CalendarTask[]> {
  const plantIds = Array.from(new Set(
    tasks.map(t => t.linkedPlantId).filter((x): x is string => !!x)
  ))
  if (plantIds.length === 0) return tasks

  const { data: plants } = await supabase
    .from('plants_v2')
    .select('id, name, variety')
    .in('id', plantIds)

  const byId = new Map<string, { name: string; variety: string | null }>()
  for (const p of (plants ?? []) as { id: string; name: string; variety: string | null }[]) {
    byId.set(p.id, { name: p.name, variety: p.variety })
  }

  return tasks.map(t => {
    if (!t.linkedPlantId) return t
    const info = byId.get(t.linkedPlantId)
    return info
      ? { ...t, linkedPlantName: info.name, linkedPlantVariety: info.variety }
      : t
  })
}

export async function getAllTasks(): Promise<CalendarTask[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  // Opgaver + brugerens plantenavne hentes parallelt (i stedet for tasks →
  // enrich-waterfall): plants_v2-tabellen pr. bruger er lille, og /kalenders
  // samlede Promise.all venter ellers på to serielle hop her.
  const [{ data, error }, { data: plants }] = await Promise.all([
    supabase
      .from('calendar_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true }),
    supabase
      .from('plants_v2')
      .select('id, name, variety')
      .eq('user_id', user.id),
  ])

  if (error) {
    console.error('getAllTasks error:', error)
    return []
  }

  const byId = new Map<string, { name: string; variety: string | null }>()
  for (const p of (plants ?? []) as { id: string; name: string; variety: string | null }[]) {
    byId.set(p.id, { name: p.name, variety: p.variety })
  }
  return (data as TaskRow[]).map(rowToTask).map(t => {
    if (!t.linkedPlantId) return t
    const info = byId.get(t.linkedPlantId)
    return info
      ? { ...t, linkedPlantName: info.name, linkedPlantVariety: info.variety }
      : t
  })
}

export async function getTasksForPlant(plantId: string): Promise<CalendarTask[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('calendar_tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('linked_plant_id', plantId)
    .order('date', { ascending: true })

  if (error) return []
  return enrichWithPlantNames((data as TaskRow[]).map(rowToTask), supabase)
}

// ============================================
// Mutations
// ============================================

export interface CreateTaskInput {
  title: string
  description?: string
  date: string                   // YYYY-MM-DD
  dueDate?: string
  taskType?: TaskType
  priority?: TaskPriority
  source?: TaskSource
  sourceId?: string
  linkedPlantId?: string
  linkedInventoryItemId?: string
  linkedGuideId?: string
  isRecurring?: boolean
  recurrenceRule?: string
  /** Default 'open'. Brug 'completed' når task'en er "allerede gjort"
   *  (fx fra månedens gøremål → "Gjort"-knap). */
  status?: TaskStatus
}

export async function createTask(input: CreateTaskInput): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  const status = input.status ?? 'open'
  const { data, error } = await supabase
    .from('calendar_tasks')
    .insert({
      user_id: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      date: input.date,
      due_date: input.dueDate || null,
      task_type: input.taskType ?? 'custom',
      priority: input.priority ?? 'medium',
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      source: input.source ?? 'manual',
      source_id: input.sourceId || null,
      linked_plant_id: input.linkedPlantId || null,
      linked_inventory_item_id: input.linkedInventoryItemId || null,
      linked_guide_id: input.linkedGuideId || null,
      is_recurring: input.isRecurring ?? false,
      recurrence_rule: input.recurrenceRule || null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Kunne ikke oprette' }

  revalidatePath('/kalender')
  revalidatePath('/')
  if (input.linkedPlantId) revalidatePath(`/mine-planter/${input.linkedPlantId}`)
  return { id: data.id as string }
}

export interface UpdateTaskInput {
  id: string
  title: string
  description?: string
  date: string
  taskType?: TaskType
  priority?: TaskPriority
  linkedPlantId?: string | null
}

export async function updateTask(input: UpdateTaskInput): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  const { data, error } = await supabase
    .from('calendar_tasks')
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      date: input.date,
      task_type: input.taskType ?? 'custom',
      priority: input.priority ?? 'medium',
      linked_plant_id: input.linkedPlantId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('user_id', userId)
    .select('linked_plant_id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Opgave ikke fundet' }

  revalidatePath('/kalender')
  revalidatePath('/')
  if (data.linked_plant_id) revalidatePath(`/mine-planter/${data.linked_plant_id}`)
  return { ok: true }
}

/**
 * Markér opgave som udført. Returnerer plant-info hvis linket, så
 * UI kan prompt'e om at oprette en log-entry.
 */
export async function completeTask(id: string): Promise<
  | { ok: true; linkedPlantId: string | null; suggestedLogType: PlantLogType | null; taskTitle: string }
  | { error: string }
> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  const { data: task, error: fetchErr } = await supabase
    .from('calendar_tasks')
    .select('id, title, task_type, linked_plant_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (fetchErr || !task) return { error: 'Opgave ikke fundet' }

  const { error: updErr } = await supabase
    .from('calendar_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (updErr) return { error: updErr.message }

  revalidatePath('/kalender')
  revalidatePath('/')
  if (task.linked_plant_id) revalidatePath(`/mine-planter/${task.linked_plant_id}`)

  return {
    ok: true,
    linkedPlantId: task.linked_plant_id,
    suggestedLogType: mapTaskTypeToLogType(task.task_type as TaskType),
    taskTitle: task.title,
  }
}

/**
 * Markér som udført + opret en log-entry på den linkede plante.
 */
export async function completeTaskWithLog(input: {
  taskId: string
  plantId: string
  logType: PlantLogType
  logTitle?: string
  logNote?: string
  logDate?: string
}): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()

  // 1. Markér opgave som udført
  const { error: updErr } = await supabase
    .from('calendar_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.taskId)
    .eq('user_id', userId)

  if (updErr) return { error: updErr.message }

  // 2. Opret log-entry
  const { error: logErr } = await supabase
    .from('plant_logs_v2')
    .insert({
      plant_id: input.plantId,
      user_id: userId,
      date: input.logDate ?? new Date().toISOString().split('T')[0],
      type: input.logType,
      title: input.logTitle || null,
      note: input.logNote || null,
      linked_task_id: input.taskId,
    })

  if (logErr) return { error: `Opgave markeret udført, men log-entry fejlede: ${logErr.message}` }

  revalidatePath('/kalender')
  revalidatePath('/')
  revalidatePath(`/mine-planter/${input.plantId}`)
  return { ok: true }
}

export async function uncompleteTask(id: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()
  const { error } = await supabase
    .from('calendar_tasks')
    .update({
      status: 'open',
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/kalender')
  revalidatePath('/')
  return { ok: true }
}

export async function deleteTask(id: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser(); const supabase = await createClient()
  const { error } = await supabase
    .from('calendar_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/kalender')
  return { ok: true }
}

// ============================================
// Mapping: opgave-type → log-type
// ============================================

function mapTaskTypeToLogType(taskType: TaskType): PlantLogType | null {
  switch (taskType) {
    case 'sowing':       return 'sowing'
    case 'pre_sow':      return 'sowing'
    case 'repot':        return 'repotting'
    case 'plant_out':    return 'planting_out'
    case 'watering':     return 'watering'
    case 'fertilizing':  return 'fertilizing'
    case 'pruning':      return 'pruning'
    case 'pest_check':   return 'pest_disease'
    case 'harvest':      return 'harvest'
    default:             return null
  }
}
