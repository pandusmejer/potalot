'use server'

/**
 * "Tal til din have" — inputmotoren (v1).
 *
 * Server-action:
 *   fortolkTale(transcript, ankerDato?) → 0-3 strukturerede forslag,
 *   eller en kendt fejltype (INTERPRETATION_INVALID / STT_INTERPRET_FAILED).
 *
 * Fortolkeren (src/lib/tale-fortolk.ts) SKRIVER ikke i domænetabeller.
 * Godkendte forslag gemmes separat via behandlOptagelse i
 * actions/optagelser.ts, dateret til optagelsens recorded_at.
 *
 * Skema-virkelighed (jf. migrations): log-typerne skrives til plant_logs_v2
 * (plant_id NOT NULL → kræver plante når muligt); opgave/naeste_saeson
 * skrives til calendar_tasks, som godt kan stå uden plante.
 */

import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { byggForslag, type TaleForslag } from '@/lib/tale-fortolk'

function idag(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Fortolk en transskription til forslag.
 *
 * Returtyper:
 *  - { forslag }                    — 0-3 forslag (tom = intet brugbart sagt)
 *  - { error, code }                — kendt, forventet fejl (vis + bevar tekst)
 *
 * `ankerDato` (YYYY-MM-DD) bruges til at løse tidsudtryk; udelades den,
 * bruges i dag (optagelse fortolkes normalt umiddelbart efter den er lavet).
 */
export async function fortolkTale(
  transcript: string,
  ankerDato?: string,
): Promise<
  | { forslag: TaleForslag[] }
  | { error: string; code: 'INTERPRETATION_INVALID' | 'STT_INTERPRET_FAILED' }
> {
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
    const res = await byggForslag({
      transcript,
      plants,
      ankerDato: ankerDato ?? idag(),
    })
    if (!res.ok) {
      return { error: res.message, code: res.code }
    }
    return { forslag: res.forslag }
  } catch {
    return {
      error: 'Kunne ikke fortolke lige nu — prøv igen om lidt.',
      code: 'STT_INTERPRET_FAILED',
    }
  }
}

/**
 * Domæneordliste til STT-prompten (spec 2.4): brugerens egne arts- og
 * sortsnavne, så transskriptionen biases mod havesprog og fanger latinske
 * sortsnavne ("San Marzano", "Café au Lait") korrekt. Tom streng hvis ingen
 * planter. Sendes til transcribe-Edge Function som `prompt` — aldrig lagret.
 */
export async function hentSortsOrdliste(): Promise<string> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('plants_v2')
    .select('name, variety')
    .eq('user_id', userId)
    .eq('is_archived', false)

  const navne = new Set<string>()
  for (const p of data ?? []) {
    const name = (p.name as string | null)?.trim()
    const variety = (p.variety as string | null)?.trim()
    if (name) navne.add(name)
    if (variety) navne.add(variety)
  }
  if (navne.size === 0) return ''
  return `Havenoter på dansk. Nævnte planter og sorter: ${[...navne].join(', ')}.`
}
