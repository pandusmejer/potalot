/**
 * Reaktiv motor — hovedorkestrator.
 *
 * Kører:
 *  - ved livscyklus-skift (trigget fra cascade.ts)
 *  - ved manuelt refresh fra /api/motor/refresh
 *  - ved dagsskifte (kan scheduleres via cron/Netlify)
 *
 * Indlæser:
 *  - alle aktive planter + placeringer
 *  - vejr for default-have
 *  - historik (sidste events per plante)
 *
 * Evaluerer regler og opretter nye opgaver (med dedup).
 */

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { hentForecast } from './weather'
import { evaluerRegler, type PlanteKontekst, type ForslagTilOpgave } from './regler'
import { hentModeIndstillinger } from '@/lib/user-modes'
import type { Plant, Placering, Garden, Livscyklus } from '@/lib/types'

/**
 * Hovedfunktion — kører motoren for en bruger.
 * Returnerer antal nye forslag oprettet.
 */
export async function koerMotor(): Promise<{ forslag_oprettet: number; skippet: number }> {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  // 0. Respektér brugerens mode — Minimal-mode = ingen forslag
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_mode')
    .eq('id', userId)
    .maybeSingle()

  const modeIndstillinger = hentModeIndstillinger(profile?.user_mode)
  if (modeIndstillinger.maxMotorForslag === 0) {
    return { forslag_oprettet: 0, skippet: 0 }
  }

  // 1. Hent default-have for vejr
  const { data: garden } = await supabase
    .from('gardens')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .limit(1)
    .single<Garden>()

  const forecast = garden?.latitude && garden?.longitude
    ? await hentForecast(garden.latitude, garden.longitude)
    : null

  // 2. Hent aktive planter (ikke afsluttet) med placering
  const { data: plants } = await supabase
    .from('plants')
    .select('*, placering:placeringer(*)')
    .eq('user_id', userId)
    .not('livscyklus', 'eq', 'afsluttet')

  if (!plants || plants.length === 0) {
    return { forslag_oprettet: 0, skippet: 0 }
  }

  // 3. Byg kontekst per plante (inkl. sidste event-datoer)
  const contexts: PlanteKontekst[] = []
  for (const p of plants as (Plant & { placering: Placering | null })[]) {
    const { data: events } = await supabase
      .from('plant_events')
      .select('event_type, event_date')
      .eq('plant_id', p.id)
      .order('event_date', { ascending: false })
      .limit(20)

    const now = new Date()
    const dageSiden = (iso: string | undefined) => {
      if (!iso) return undefined
      return Math.floor((now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
    }

    const lastWater = events?.find(e => e.event_type === 'vandet')?.event_date
    const lastFeed = events?.find(e => e.event_type === 'goedet')?.event_date
    const lastEvent = events?.[0]?.event_date

    contexts.push({
      plant: p,
      placering: p.placering ?? undefined,
      dageSidenVandet: dageSiden(lastWater),
      dageSidenGoedet: dageSiden(lastFeed),
      dageSidenSidsteEvent: dageSiden(lastEvent),
      livscyklus: (p.livscyklus as Livscyklus) ?? 'planlagt',
    })
  }

  // 4. Evaluér regler — begræns antal iht. brugerens mode
  const allForslag = evaluerRegler(contexts, forecast)
  const forslag = allForslag.slice(0, modeIndstillinger.maxMotorForslag)

  // 5. Opret tasks (med dedup mod eksisterende opgaver)
  let oprettet = 0
  let skippet = 0

  for (const f of forslag) {
    const laavet = await erForslagAlleredeAktivt(f)
    if (laavet) {
      skippet++
      continue
    }

    await supabase.from('tasks').insert({
      user_id: userId,
      plant_id: f.plant_id,
      title: f.titel,
      description: f.forklaring,
      task_type: f.task_type,
      due_date: f.due_date,
      priority: f.priority,
    })
    oprettet++
  }

  // 6. Udløb irrelevante opgaver (fx vanding når der kommer kraftig regn)
  await udloebIrrelevanteOpgaver(forecast, contexts)

  return { forslag_oprettet: oprettet, skippet }
}

async function erForslagAlleredeAktivt(f: ForslagTilOpgave): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('id')
    .eq('plant_id', f.plant_id)
    .eq('task_type', f.task_type)
    .is('completed_at', null)
    .limit(1)
  return (data?.length ?? 0) > 0
}

/**
 * Udløb opgaver der ikke længere er relevante:
 *  - vanding når der kommer kraftig regn inden for 24t
 *  - frost-advarsel når frost er afblæst
 */
async function udloebIrrelevanteOpgaver(
  forecast: Awaited<ReturnType<typeof hentForecast>> | null,
  contexts: PlanteKontekst[]
) {
  if (!forecast) return
  const supabase = await createClient()

  // Kommer der mere end 5mm regn inden for 24 timer?
  const regn24h = forecast.hourly.slice(0, 24).reduce((sum, h) => sum + h.precipitation_mm, 0)
  if (regn24h >= 5) {
    // Luk vandings-opgaver på friland/altan (indendørs får stadig vand)
    const outdoorPlantIds = contexts
      .filter(c => c.placering && c.placering.exposure !== 'indendoers')
      .map(c => c.plant.id)

    if (outdoorPlantIds.length > 0) {
      await supabase
        .from('tasks')
        .update({
          completed_at: new Date().toISOString(),
          description: 'Annulleret — regn kom.',
        })
        .in('plant_id', outdoorPlantIds)
        .eq('task_type', 'water')
        .is('completed_at', null)
    }
  }
}
