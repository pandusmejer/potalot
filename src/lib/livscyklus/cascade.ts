/**
 * Kaskade-motor for livscyklus-handlinger.
 *
 * En handling på en plante udløser side-effekter:
 *  - opdaterer plant.livscyklus
 *  - opretter plant_event
 *  - trækker fra/lægger til frø-beholdning
 *  - lukker pendende opgaver der ikke længere er relevante
 *  - opretter nye opgaver fra guide-template
 *  - opretter ny frøpose ved 'gemt til frø'
 *
 * Pure server-side. Bruges af lifecycle.ts server actions.
 */

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import {
  type Handling,
  HANDLING_TIL_EVENT,
  naesteLivscyklus,
  erHandlingTilladt,
} from './state-machine'
import type { Livscyklus, PlantGuide } from '@/lib/types'

// ============================================
// Hovedfunktion: udfør handling med kaskade
// ============================================

export async function udfoerHandling(
  plantId: string,
  handling: Handling
): Promise<{ success: true; new_livscyklus: Livscyklus } | { error: string }> {
  const supabase = await createClient()

  // 1. Hent plante (med variety + guide)
  const { data: plant, error: pErr } = await supabase
    .from('plants')
    .select('*, variety_ref:varieties(*, guide:plant_guides(*))')
    .eq('id', plantId)
    .single()

  if (pErr || !plant) return { error: 'Plante ikke fundet' }

  const currentLivscyklus = (plant.livscyklus as Livscyklus) ?? 'planlagt'

  // 2. Validér tilladt overgang
  if (!erHandlingTilladt(currentLivscyklus, handling.type)) {
    return { error: `Handlingen "${handling.type}" er ikke tilladt fra "${currentLivscyklus}"` }
  }

  // 3. Beregn ny livscyklus
  const newLivscyklus = naesteLivscyklus(currentLivscyklus, handling.type)

  // 4. Skriv event (append-only)
  const eventDate = handling.dato ?? new Date().toISOString().split('T')[0]
  const eventData = byggEventData(handling)
  const eventNotes = byggEventNotes(handling)

  const { error: eErr } = await supabase
    .from('plant_events')
    .insert({
      plant_id: plantId,
      user_id: plant.user_id,
      event_type: HANDLING_TIL_EVENT[handling.type],
      event_date: eventDate,
      data: eventData,
      notes: eventNotes,
      photo_urls: handling.type === 'note' ? handling.foto_urls ?? null : null,
      auto_generated: false,
    })

  if (eErr) return { error: `Kunne ikke skrive event: ${eErr.message}` }

  // 5. Opdater plante (livscyklus, placering, datoer hvis relevant)
  const plantUpdates: Record<string, unknown> = {
    livscyklus: newLivscyklus,
    updated_at: new Date().toISOString(),
  }

  // Skift placering hvis handling specificerer det
  if ('placering_id' in handling && handling.placering_id) {
    plantUpdates.placering_id = handling.placering_id
  }

  // Opdater dato-felter (legacy — bevarer kompatibilitet med eksisterende UI)
  if (handling.type === 'soe') plantUpdates.sow_date = eventDate
  if (handling.type === 'spiret') plantUpdates.germination_date = eventDate
  if (handling.type === 'prikle') plantUpdates.prick_date = eventDate
  if (handling.type === 'plant_ud') plantUpdates.plant_out_date = eventDate
  if (handling.type === 'hoest' && !plant.first_harvest_date) {
    plantUpdates.first_harvest_date = eventDate
  }
  if (handling.type === 'hoest') plantUpdates.last_harvest_date = eventDate

  // Opdater status (legacy enum) ud fra livscyklus
  plantUpdates.status = livscyklusTilLegacyStatus(newLivscyklus)

  const { error: uErr } = await supabase
    .from('plants')
    .update(plantUpdates)
    .eq('id', plantId)

  if (uErr) return { error: `Kunne ikke opdatere plante: ${uErr.message}` }

  // 6. Side-effekter per handling
  if (handling.type === 'soe' && plant.seed_id) {
    await trækFraBeholdning(plant.seed_id, handling.antal)
  }

  if (handling.type === 'afslut' && handling.gem_froe) {
    await opretFroeposeFraPlante(plant)
  }

  // 7. Opdater opgaver — luk relevante, opret nye
  await opdaterOpgaver(plantId, handling, plant.variety_ref?.guide as PlantGuide | undefined ?? plant.guide)

  return { success: true, new_livscyklus: newLivscyklus }
}

// ============================================
// Helpers
// ============================================

function byggEventData(handling: Handling): Record<string, unknown> {
  switch (handling.type) {
    case 'soe':
      return { antal: handling.antal, placering_id: handling.placering_id ?? null }
    case 'prikle':
      return { antal: handling.antal, placering_id: handling.placering_id ?? null }
    case 'plant_ud':
      return { placering_id: handling.placering_id ?? null }
    case 'flyt':
      return { til_placering_id: handling.placering_id }
    case 'hoest':
      return { maengde: handling.maengde ?? null, enhed: handling.enhed ?? 'stk' }
    case 'afslut':
      return { aarsag: handling.aarsag, gem_froe: handling.gem_froe ?? false }
    default:
      return {}
  }
}

function byggEventNotes(handling: Handling): string | null {
  if ('noter' in handling && handling.noter) return handling.noter
  if (handling.type === 'note') return handling.tekst
  return null
}

/**
 * Map ny livscyklus tilbage til gammel status enum
 * (så eksisterende UI/views fortsat virker)
 */
function livscyklusTilLegacyStatus(l: Livscyklus): string {
  switch (l) {
    case 'i_froebank': return 'planned'
    case 'planlagt':   return 'planned'
    case 'soet':       return 'sown'
    case 'spiret':     return 'germinated'
    case 'priklet':    return 'pricked'
    case 'udplantet':  return 'planted_out'
    case 'i_vaekst':   return 'growing'
    case 'afsluttet':  return 'done'
  }
}

async function trækFraBeholdning(seedId: string, antal: number) {
  const supabase = await createClient()

  const { data: seed } = await supabase
    .from('seeds')
    .select('seeds_total, seeds_sown, status')
    .eq('id', seedId)
    .single()

  if (!seed) return

  const newSown = (seed.seeds_sown ?? 0) + antal
  const total = seed.seeds_total ?? null

  const updates: Record<string, unknown> = {
    seeds_sown: newSown,
  }

  // Auto-status: opbrugt hvis vi har solgt alle
  if (total != null && newSown >= total) {
    updates.status = 'depleted'
  } else if (seed.status === 'in_stock') {
    updates.status = 'sown'
  }

  await supabase.from('seeds').update(updates).eq('id', seedId)
}

async function opretFroeposeFraPlante(plant: { id: string; user_id: string; variety_id: string | null; guide_id: string | null; name: string; variety: string | null }) {
  const supabase = await createClient()

  await supabase.from('seeds').insert({
    user_id: plant.user_id,
    variety_id: plant.variety_id,
    guide_id: plant.guide_id,
    parent_plant_id: plant.id,
    name: plant.name,
    variety: plant.variety,
    primary_category: 'froe',
    year_purchased: new Date().getFullYear(),
    status: 'in_stock',
    notes: 'Gemt fra egen plante',
  })
}

/**
 * Luk pendende opgaver der ikke længere er relevante,
 * og opret nye opgaver baseret på guide-template.
 */
async function opdaterOpgaver(
  plantId: string,
  handling: Handling,
  guide: PlantGuide | null | undefined
) {
  const supabase = await createClient()

  // Map handling-type til task-typer der skal lukkes
  const taskTypesAtLukke: string[] = (() => {
    switch (handling.type) {
      case 'spiret':   return ['pest_check'] // ingen direkte spire-task
      case 'prikle':   return ['prick_out']
      case 'plant_ud': return ['plant_out', 'harden_off']
      case 'vand':     return ['water']
      case 'goed':     return ['fertilize']
      case 'beskaar':  return ['prune']
      case 'hoest':    return ['harvest']
      case 'afslut':   return ['water', 'fertilize', 'prune', 'pest_check', 'harvest', 'prick_out', 'plant_out', 'harden_off']
      default: return []
    }
  })()

  if (taskTypesAtLukke.length > 0) {
    await supabase
      .from('tasks')
      .update({ completed_at: new Date().toISOString() })
      .eq('plant_id', plantId)
      .is('completed_at', null)
      .in('task_type', taskTypesAtLukke)
  }

  // Opret nye opgaver fra guide hvis vi netop såede eller priklede
  if (!guide) return

  const baseDate = new Date(handling.dato ?? new Date().toISOString().split('T')[0])

  if (handling.type === 'soe') {
    // Opret prikl-opgave
    if (guide.prick_out_weeks_after_sow) {
      const prickDate = new Date(baseDate)
      prickDate.setDate(prickDate.getDate() + guide.prick_out_weeks_after_sow * 7)
      await opretOpgaveHvisIkkeFindes(plantId, {
        title: `Prikl ${guide.name_da} ud`,
        task_type: 'prick_out',
        due_date: prickDate.toISOString().split('T')[0],
        guide_id: guide.id,
      })
    }
    // Opret spire-tjek opgave
    if (guide.days_to_germination_min) {
      const checkDate = new Date(baseDate)
      checkDate.setDate(checkDate.getDate() + guide.days_to_germination_min)
      await opretOpgaveHvisIkkeFindes(plantId, {
        title: `Tjek spiring på ${guide.name_da}`,
        task_type: 'pest_check',
        due_date: checkDate.toISOString().split('T')[0],
        guide_id: guide.id,
      })
    }
  }

  if (handling.type === 'plant_ud' && guide.days_to_harvest_min) {
    const harvestDate = new Date(baseDate)
    harvestDate.setDate(harvestDate.getDate() + guide.days_to_harvest_min)
    await opretOpgaveHvisIkkeFindes(plantId, {
      title: `Tjek høst på ${guide.name_da}`,
      task_type: 'harvest',
      due_date: harvestDate.toISOString().split('T')[0],
      guide_id: guide.id,
    })
  }
}

async function opretOpgaveHvisIkkeFindes(
  plantId: string,
  task: { title: string; task_type: string; due_date: string; guide_id: string | null }
) {
  const supabase = await createClient()

  // Tjek om opgaven allerede findes (samme plante + type + ikke afsluttet)
  const { data: existing } = await supabase
    .from('tasks')
    .select('id')
    .eq('plant_id', plantId)
    .eq('task_type', task.task_type)
    .is('completed_at', null)
    .maybeSingle()

  if (existing) return

  await supabase.from('tasks').insert({
    user_id: DEMO_USER_ID,
    plant_id: plantId,
    guide_id: task.guide_id,
    title: task.title,
    task_type: task.task_type,
    due_date: task.due_date,
    priority: 'medium',
  })
}
