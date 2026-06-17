'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Udført UDLEDT opgave (planter-persistens-sprint, step 1+2).
 *
 * "I haven i dag"-opgaver er afledt af plantestatus — de er IKKE rigtige
 * calendar_tasks. Når brugeren krydser én af, gemmer vi en completion på en
 * deterministisk task_key (plant_id + task_type + dato) OG skriver en lille note
 * i plantens historie. Reload bevarer afkrydsningen; fortryd fjerner begge dele.
 *
 * Ingen falsk persistens: kald kun disse fra rigtige (ikke-demo) brugere.
 */

/** Dagens dato (server-tid) på YYYY-MM-DD. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface MarkDerivedTaskInput {
  plantId: string
  /** Deterministisk: `${plantId}:${taskType}:${dato}` — bygges i UI'et med samme dato som serveren. */
  taskKey: string
  taskType: string
  /** Menneskelæsbar titel — bruges i log-noten ("Høst markeret som udført."). */
  taskTitle: string
}

/**
 * Markér en udledt opgave som udført. Idempotent: er nøglen allerede udført,
 * returneres den eksisterende completion uden at oprette en dublet-log.
 */
export async function markDerivedTaskDone(
  input: MarkDerivedTaskInput,
): Promise<{ ok: true; completionId: string; logEntryId: string | null } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  // Allerede udført? (task_key er unik pr. bruger) → idempotent no-op.
  const { data: existing } = await supabase
    .from('plant_task_completions')
    .select('id, log_entry_id')
    .eq('user_id', userId)
    .eq('task_key', input.taskKey)
    .maybeSingle()
  if (existing) {
    return { ok: true, completionId: existing.id as string, logEntryId: (existing.log_entry_id as string | null) ?? null }
  }

  const today = todayISO()

  // Lille note i plantens historie. type 'note' → ingen auto-stage-advance
  // (V1 holdes lille: ingen status-spil, ingen bottom-sheet-roman).
  let logEntryId: string | null = null
  const { data: logRow } = await supabase
    .from('plant_logs_v2')
    .insert({
      plant_id: input.plantId,
      user_id: userId,
      date: today,
      type: 'note',
      title: input.taskTitle || null,
      note: 'Markeret som udført fra "I haven i dag".',
    })
    .select('id')
    .single()
  logEntryId = (logRow?.id as string | undefined) ?? null

  const { data: completion, error } = await supabase
    .from('plant_task_completions')
    .insert({
      user_id: userId,
      plant_id: input.plantId,
      task_key: input.taskKey,
      task_title: input.taskTitle || null,
      task_type: input.taskType || null,
      source: 'afledt',
      completed_date: today,
      log_entry_id: logEntryId,
    })
    .select('id')
    .single()

  if (error || !completion) {
    // Rul log-noten tilbage, så vi ikke efterlader en forældreløs historik-linje.
    if (logEntryId) {
      await supabase.from('plant_logs_v2').delete().eq('id', logEntryId).eq('user_id', userId)
    }
    return { error: error?.message ?? 'Kunne ikke gemme udført-status' }
  }

  revalidatePath('/mine-planter')
  revalidatePath(`/mine-planter/${input.plantId}`)
  return { ok: true, completionId: completion.id as string, logEntryId }
}

/**
 * Fortryd en udført udledt opgave. Sletter completion OG den koblede log-note,
 * så historikken ikke beholder en handling, brugeren har taget tilbage.
 */
export async function unmarkDerivedTaskDone(
  taskKey: string,
): Promise<{ ok: true } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('plant_task_completions')
    .select('id, plant_id, log_entry_id')
    .eq('user_id', userId)
    .eq('task_key', taskKey)
    .maybeSingle()
  if (!row) return { ok: true } // allerede væk → idempotent

  const { error } = await supabase
    .from('plant_task_completions')
    .delete()
    .eq('id', row.id as string)
    .eq('user_id', userId)
  if (error) return { error: error.message }

  // Fjern den tilhørende log-note.
  if (row.log_entry_id) {
    await supabase
      .from('plant_logs_v2')
      .delete()
      .eq('id', row.log_entry_id as string)
      .eq('user_id', userId)
  }

  revalidatePath('/mine-planter')
  if (row.plant_id) revalidatePath(`/mine-planter/${row.plant_id as string}`)
  return { ok: true }
}

/**
 * Hent task_keys, brugeren har markeret udført på en given dato (default i dag).
 * Bruges server-side til at gengive afkrydset tilstand på Planter-forsiden.
 */
export async function getTaskCompletionsForDate(date?: string): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plant_task_completions')
    .select('task_key')
    .eq('user_id', user.id)
    .eq('completed_date', date ?? todayISO())
  if (error || !data) return []
  return data.map(r => r.task_key as string)
}
