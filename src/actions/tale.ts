'use server'

/**
 * "Tal til din have" — inputmotoren (V19).
 *
 * To server-actions:
 *   fortolkTale(transcript)   → Claude foreslår 1-3 strukturerede ting
 *   gemTaleForslag(forslag)   → gemmer de godkendte det rigtige sted
 *
 * Den producerer råstoffet til resten af Havebogen: noter,
 * observationer, høst (→ minder/vendepunkter) og opgaver.
 *
 * Skema-virkelighed (jf. migrations): note/observation/høst skrives
 * til plant_logs_v2, hvor plant_id er NOT NULL → de KRÆVER en plante.
 * Opgaver skrives til calendar_tasks, som godt kan stå uden plante.
 */

import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { byggForslag, type TaleForslag } from '@/lib/tale-fortolk'
import { createPlantLog } from '@/actions/mine-planter'
import { createTask } from '@/actions/havekalender'

function idag(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function fortolkTale(
  transcript: string,
): Promise<{ forslag: TaleForslag[] } | { error: string }> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('plants_v2')
    .select('id, name, variety')
    .eq('user_id', userId)
    .eq('is_archived', false)

  const plants = (data ?? []).map(p => ({
    id: p.id as string,
    name: p.name as string,
    variety: (p.variety as string | null) ?? null,
  }))

  try {
    const forslag = await byggForslag({ transcript, plants, today: idag() })
    return { forslag }
  } catch {
    return { error: 'Kunne ikke fortolke lige nu — prøv igen om lidt.' }
  }
}

export async function gemTaleForslag(
  forslag: TaleForslag[],
): Promise<{ gemt: number; sprunget: number } | { error: string }> {
  await requireUser()
  const today = idag()
  let gemt = 0
  let sprunget = 0

  for (const f of forslag) {
    if (f.type === 'opgave') {
      const r = await createTask({
        title: f.titel,
        description: f.tekst || undefined,
        date: f.dato ?? today,
        taskType: 'custom',
        source: 'manual',
        linkedPlantId: f.plantId ?? undefined,
      })
      if ('id' in r) gemt++
      else sprunget++
    } else if (f.plantId) {
      // note/observation → 'note'; hoest → 'harvest' (bliver til minde)
      const r = await createPlantLog({
        plantId: f.plantId,
        date: today,
        type: f.type === 'hoest' ? 'harvest' : 'note',
        title: f.titel,
        note: f.tekst || undefined,
      })
      if ('id' in r) gemt++
      else sprunget++
    } else {
      // note/observation/hoest uden plante kan ikke gemmes som log
      sprunget++
    }
  }

  return { gemt, sprunget }
}
