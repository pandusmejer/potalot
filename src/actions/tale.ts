'use server'

/**
 * "Tal til din have" — inputmotoren (V19).
 *
 * Server-action:
 *   fortolkTale(transcript)   → Claude foreslår 1-3 strukturerede ting
 *
 * Godkendte forslag gemmes via optagelser-sporet (behandlOptagelse i
 * actions/optagelser.ts), dateret til optagelsens recorded_at.
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
