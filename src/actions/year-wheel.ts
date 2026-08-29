'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { opgaveDatoForGoeremaal } from '@/lib/kalender/tidsvindue'

/**
 * Tilføj generelle haveopgaver til brugerens kalender.
 *
 * Trækker template-data direkte fra general_garden_tasks (DB) som
 * single source of truth. Linker via source='general' og source_id =
 * general_garden_tasks.id, så det er idempotent (kan ikke tilføjes igen
 * samme år hvis allerede der).
 */

/*
 * KAL-0115 (audit 26/8): her lå `inferDayFromTimeWindow` — en ANDEN
 * fortolker af general_garden_tasks.time_window end den planneren bruger.
 * De var uenige, så det SAMME gøremål fik forskellig dato alt efter hvilken
 * knap brugeren trykkede på:
 *
 *     time_window        her      planneren (tolkTidsvindue)
 *     (tom)              15       1
 *     "primo september"   5       1
 *     "fra midt august"  15       11
 *     "slut september"   25       21
 *     "efter høst"       15       betinget — ingen dato-påstand
 *
 * Værre: den opfandt en præcis dato (den 15.) for BETINGEDE vinduer og for
 * vejrafhængige former ("milde tørre dage"), bare for at få feltet udfyldt.
 * Og den havde intet gulv, så et marts-gøremål tilføjet i august blev
 * oprettet allerede forsinket — og udløser nu præcis én ulæst påmindelse,
 * der bliver hængende til opgaven lukkes.
 *
 * Nu bruges `opgaveDatoForGoeremaal` — samme fortolkningslag som
 * planner-visningen og som "+"-knappen. Dagen kommer fra vinduet, når det
 * er dato-fortolkeligt; ellers den 1. i måneden (månedens start er den
 * mindst påståelige dato — den 15. lyver om midtmåneds-præcision). Aldrig
 * en dato i fortiden.
 */

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

  // Idempotens: samme gøremål må kun ligge én gang pr. ÅR. Nøglen bygges på
  // den eksisterende rækkes eget år — ikke på input.year — så gulvet
  // ("aldrig i fortiden") ikke kan skabe dubletter, når en tidligere
  // tilføjelse blev flyttet til i dag.
  type ExistingRow = { source_id: string; date: string }
  const existingThisYear = new Set(
    ((existing ?? []) as ExistingRow[]).map(r => `${r.source_id}:${r.date.slice(0, 4)}`)
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

  const idag = new Date()
  const toInsert = (templates as Template[])
    .map(t => ({ t, date: opgaveDatoForGoeremaal(t.time_window, t.month, input.year, idag) }))
    .filter(({ t, date }) => !existingThisYear.has(`${t.id}:${date.slice(0, 4)}`))
    .map(({ t, date }) => {
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
