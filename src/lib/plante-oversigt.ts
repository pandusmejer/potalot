/**
 * Mine planters kompakte oversigt (MVP 1.0, fase 2) — rene regler uden UI.
 *
 * Mine planter viser, hvad brugeren DYRKER lige nu: én række pr. dyrkning
 * (en række i plants_v2), ikke pr. sort. Frøbanken viser, hvad man HAR.
 * Samme sort kan derfor stå flere gange her — hver gang med sin egen
 * sådato og placering — og hver række peger tilbage på den oprindelige
 * frøpose via `sourceElementId` (vises på plantens detaljeside).
 *
 * Intet gemmes og intet nyt beregnes ud over visningen: grupperingen følger
 * den eksisterende livscyklus (planlagt → aktiv → afsluttet → arkiveret), og
 * "næste opgave" er blot den tidligste åbne række i calendar_tasks.
 */

import type { CalendarTask, Plant, PlantStatus } from '@/lib/types'

/**
 * Status der betyder "fysisk i dyrkning". Samme sæt som MinePlanterClient
 * bruger (Annas livscyklus-definition, juni 2026). Kopieret her, fordi
 * konstanten bor i en klientkomponent og ikke kan læses fra serverkode.
 */
export const AKTIVE_STATUSSER: ReadonlySet<PlantStatus> = new Set<PlantStatus>([
  'saaet',
  'spirer',
  'i_vaekst',
  'klar_til_udplantning',
  'udplantet',
  'hoestklar',
])

export interface PlanteGrupper {
  /** Fysisk i dyrkning: sået → … → høstklar. */
  dyrkes: Plant[]
  /** Besluttet, men intet i jord endnu. */
  planlagte: Plant[]
  /** Sæsonen er slut, men planten er ikke arkiveret endnu. */
  klarTilArkiv: Plant[]
}

/** Arkiverede dyrkninger hører til Arkivet og indgår aldrig her. */
export function grupperPlanter(plants: Plant[]): PlanteGrupper {
  const levende = plants.filter((p) => !p.isArchived)
  return {
    dyrkes: levende.filter((p) => AKTIVE_STATUSSER.has(p.status)).sort(sammenlignDyrkning),
    planlagte: levende.filter((p) => p.status === 'planlagt').sort(sammenlignDyrkning),
    klarTilArkiv: levende.filter((p) => p.status === 'afsluttet').sort(sammenlignDyrkning),
  }
}

/**
 * Art A–Å, så sort A–Å — og for flere dyrkninger af SAMME sort: nyeste
 * sådato først, så den dyrkning der er mest i gang står øverst. Dyrkninger
 * uden sådato kommer sidst blandt deres sortsfæller.
 */
export function sammenlignDyrkning(a: Plant, b: Plant): number {
  const art = a.name.localeCompare(b.name, 'da')
  if (art !== 0) return art
  const sort = (a.variety ?? '').localeCompare(b.variety ?? '', 'da')
  if (sort !== 0) return sort
  if (a.sowDate && b.sowDate && a.sowDate !== b.sowDate) return b.sowDate.localeCompare(a.sowDate)
  if (a.sowDate && !b.sowDate) return -1
  if (!a.sowDate && b.sowDate) return 1
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
}

/**
 * Hver plantes næste åbne opgave: den tidligste, der ikke er udført eller
 * sprunget over. En forsinket opgave er stadig "næste" — den må ikke gemme
 * sig bag en senere. Planter uden opgaver er simpelthen ikke i kortet
 * (stilhed, ikke "ingen opgaver"-støj).
 */
export function naesteOpgavePrPlante(tasks: CalendarTask[]): Map<string, CalendarTask> {
  const map = new Map<string, CalendarTask>()
  for (const t of tasks) {
    if (t.status !== 'open' || !t.linkedPlantId) continue
    const nuvaerende = map.get(t.linkedPlantId)
    if (!nuvaerende || sammenlignOpgave(t, nuvaerende) < 0) map.set(t.linkedPlantId, t)
  }
  return map
}

function sammenlignOpgave(a: CalendarTask, b: CalendarTask): number {
  const dato = a.date.localeCompare(b.date)
  return dato !== 0 ? dato : (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
}

/** Er opgavens dato passeret? (YYYY-MM-DD mod dagens YYYY-MM-DD.) */
export function erOpgaveForsinket(task: Pick<CalendarTask, 'date'>, idag: string): boolean {
  return task.date < idag
}

/**
 * Åbne opgaver for ÉN plante til detaljesiden: tidligste først, højst `max`.
 * Udførte opgaver tælles, men vises ikke — siden er til det, der kommer.
 */
export function opgaverTilPlante(
  tasks: CalendarTask[],
  max = 5,
): { aabne: CalendarTask[]; antalAabne: number; antalUdfoert: number } {
  const aabne = tasks.filter((t) => t.status === 'open').sort(sammenlignOpgave)
  return {
    aabne: aabne.slice(0, max),
    antalAabne: aabne.length,
    antalUdfoert: tasks.filter((t) => t.status === 'completed').length,
  }
}
