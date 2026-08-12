'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { GeneralGardenTask, UserGardenTask, TaskPriority } from '@/lib/types'

interface GeneralRow {
  id: string
  title: string
  description: string | null
  month: number
  season: string | null
  category: string | null
  priority: string
  time_window: string | null
  tip: string | null
  risk: string | null
  linked_guide_ids: string[] | null
  recurrence: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserRow {
  id: string
  user_id: string
  title: string
  description: string | null
  month: number
  category: string | null
  priority: string
  time_window: string | null
  notify_enabled: boolean
  created_at: string
  updated_at: string
}

function rowToGeneral(row: GeneralRow, hiddenIds: Set<string>): GeneralGardenTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    month: row.month,
    season: row.season,
    category: row.category ?? 'andet',
    priority: row.priority as TaskPriority,
    timeWindow: row.time_window,
    tip: row.tip,
    risk: row.risk,
    recurrence: (row.recurrence as 'yearly' | 'monthly' | 'weekly') ?? 'yearly',
    isActive: row.is_active,
    linkedGuideIds: row.linked_guide_ids ?? [],
    isHiddenByMe: hiddenIds.has(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToUser(row: UserRow): UserGardenTask {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? '',
    month: row.month,
    category: row.category ?? 'andet',
    priority: row.priority as TaskPriority,
    timeWindow: row.time_window,
    notifyEnabled: row.notify_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// READ
// ============================================

/**
 * Hent globale gøremål. Anonyme: kun aktive.
 * Logget-ind: aktive + skjul-status fra user_hidden_general_tasks.
 * Admin: kan inkludere inaktive.
 */
export async function getGeneralGardenTasks(opts?: { includeInactive?: boolean }): Promise<GeneralGardenTask[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  let query = supabase.from('general_garden_tasks').select('*').order('month', { ascending: true })
  if (!opts?.includeInactive) query = query.eq('is_active', true)

  // Gøremål + brugerens skjulte ids er uafhængige — parallelt, ikke waterfall.
  const [{ data, error }, hiddenRes] = await Promise.all([
    query,
    user
      ? supabase
          .from('user_hidden_general_tasks')
          .select('general_task_id')
          .eq('user_id', user.id)
      : Promise.resolve({ data: null }),
  ])
  if (error) {
    console.error('getGeneralGardenTasks:', error)
    return []
  }

  const hiddenIds = new Set(
    ((hiddenRes.data ?? []) as { general_task_id: string }[]).map(h => h.general_task_id)
  )

  return (data as GeneralRow[]).map(r => rowToGeneral(r, hiddenIds))
}

/** Hent brugerens egne gøremål. Tom for anonyme. */
export async function getUserGardenTasks(): Promise<UserGardenTask[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_garden_tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('month', { ascending: true })
  if (error) return []
  return (data as UserRow[]).map(rowToUser)
}

// ============================================
// USER WRITE
// ============================================

export interface CreateUserTaskInput {
  title: string
  description?: string
  month: number
  category?: string
  priority?: TaskPriority
  timeWindow?: string
  notifyEnabled?: boolean
}

export async function createUserGardenTask(input: CreateUserTaskInput): Promise<{ id: string } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_garden_tasks')
    .insert({
      user_id: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      month: input.month,
      category: input.category ?? 'andet',
      priority: input.priority ?? 'medium',
      time_window: input.timeWindow?.trim() || null,
      notify_enabled: input.notifyEnabled ?? true,
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('createUserGardenTask fejlede:', error)
    return { error: 'Kunne ikke oprette gøremålet. Prøv igen.' }
  }
  revalidatePath('/kalender')
  return { id: data.id as string }
}

export async function updateUserGardenTask(
  id: string,
  input: Partial<CreateUserTaskInput>
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.description !== undefined) update.description = input.description?.trim() || null
  if (input.month !== undefined) update.month = input.month
  if (input.category !== undefined) update.category = input.category
  if (input.priority !== undefined) update.priority = input.priority
  if (input.timeWindow !== undefined) update.time_window = input.timeWindow?.trim() || null
  if (input.notifyEnabled !== undefined) update.notify_enabled = input.notifyEnabled
  const { error } = await supabase
    .from('user_garden_tasks')
    .update(update)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) {
    console.error('updateUserGardenTask fejlede:', error)
    return { error: 'Kunne ikke gemme ændringerne. Prøv igen.' }
  }
  revalidatePath('/kalender')
  return { ok: true }
}

export async function deleteUserGardenTask(id: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_garden_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) {
    console.error('deleteUserGardenTask fejlede:', error)
    return { error: 'Kunne ikke slette gøremålet. Prøv igen.' }
  }
  revalidatePath('/kalender')
  return { ok: true }
}

/** Skjul en global opgave for nuværende bruger ("ikke relevant for min have") */
export async function hideGeneralTask(generalTaskId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_hidden_general_tasks')
    .insert({ user_id: userId, general_task_id: generalTaskId })
  // Ignorér duplicate-fejl
  if (error && !error.message.includes('duplicate')) {
    console.error('hideGeneralTask fejlede:', error)
    return { error: 'Kunne ikke skjule gøremålet. Prøv igen.' }
  }
  revalidatePath('/kalender')
  return { ok: true }
}

export async function unhideGeneralTask(generalTaskId: string): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_hidden_general_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('general_task_id', generalTaskId)
  if (error) {
    console.error('unhideGeneralTask fejlede:', error)
    return { error: 'Kunne ikke vise gøremålet igen. Prøv igen.' }
  }
  revalidatePath('/kalender')
  return { ok: true }
}

// ============================================
// ADMIN WRITE
// ============================================

export interface AdminGeneralTaskInput {
  title: string
  description?: string
  month: number
  season?: string
  category?: string
  priority?: TaskPriority
  timeWindow?: string
  tip?: string
  risk?: string
  isActive?: boolean
  linkedGuideIds?: string[]
}

export async function adminCreateGeneralTask(input: AdminGeneralTaskInput): Promise<{ id: string } | { error: string }> {
  const admin = await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('general_garden_tasks')
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      month: input.month,
      season: input.season?.trim() || null,
      category: input.category ?? 'andet',
      priority: input.priority ?? 'medium',
      time_window: input.timeWindow?.trim() || null,
      tip: input.tip?.trim() || null,
      risk: input.risk?.trim() || null,
      is_active: input.isActive ?? true,
      linked_guide_ids: input.linkedGuideIds ?? [],
      created_by: admin.id,
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('adminCreateGeneralTask fejlede:', error)
    return { error: 'Kunne ikke oprette gøremålet. Prøv igen.' }
  }
  revalidatePath('/kalender')
  revalidatePath('/admin')
  return { id: data.id as string }
}

export async function adminUpdateGeneralTask(
  id: string,
  input: Partial<AdminGeneralTaskInput>
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const supabase = await createClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.description !== undefined) update.description = input.description?.trim() || null
  if (input.month !== undefined) update.month = input.month
  if (input.season !== undefined) update.season = input.season?.trim() || null
  if (input.category !== undefined) update.category = input.category
  if (input.priority !== undefined) update.priority = input.priority
  if (input.timeWindow !== undefined) update.time_window = input.timeWindow?.trim() || null
  if (input.tip !== undefined) update.tip = input.tip?.trim() || null
  if (input.risk !== undefined) update.risk = input.risk?.trim() || null
  if (input.isActive !== undefined) update.is_active = input.isActive
  if (input.linkedGuideIds !== undefined) update.linked_guide_ids = input.linkedGuideIds
  const { error } = await supabase
    .from('general_garden_tasks')
    .update(update)
    .eq('id', id)
  if (error) {
    console.error('adminUpdateGeneralTask fejlede:', error)
    return { error: 'Kunne ikke gemme ændringerne. Prøv igen.' }
  }
  revalidatePath('/kalender')
  revalidatePath('/admin')
  return { ok: true }
}

export async function adminDeleteGeneralTask(id: string): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('general_garden_tasks')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('adminDeleteGeneralTask fejlede:', error)
    return { error: 'Kunne ikke slette gøremålet. Prøv igen.' }
  }
  revalidatePath('/kalender')
  revalidatePath('/admin')
  return { ok: true }
}
