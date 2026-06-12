/**
 * Årshjul — timing-lag datamodel.
 *
 * Bygger plante-rækker med faser (forspiring/saaning/udplantning/
 * høst) fordelt over årets måneder. Hver række = en plante, hver
 * fase = en horisontal bar med specifikke måneder.
 *
 * Dette er IKKE et Gantt-data-format. Det er en sæson-rytme — vi
 * tegner hver fases måneder, ikke start/slut-tidspunkter.
 */

import type { InventoryItem, Plant } from './types'

export type TimelinePhase = 'forspiring' | 'saaning' | 'udplantning' | 'host'

export interface TimelinePhaseRange {
  phase: TimelinePhase
  /** Måneder 1-12 hvor fasen er aktiv */
  months: number[]
  /** Dansk label vist på bar'en: "Forspir", "Så", "Plant ud", "Høst" */
  label: string
}

export interface TimelineEntry {
  id: string
  plant: string
  variety?: string
  phases: TimelinePhaseRange[]
  /** Om denne entry kommer fra brugerens egen frøbank/planter eller
   *  fra den generelle forslags-pulje. */
  source: 'mine' | 'forslag'
}

/**
 * Konverterer en InventoryItem til en timeline-række. Vi splitter
 * sowingMonths op i 'forspiring' og 'saaning' baseret på item's
 * preCultivation-flag.
 */
function inventoryToTimelineEntry(item: InventoryItem): TimelineEntry | null {
  const phases: TimelinePhaseRange[] = []

  if (item.sowingMonths && item.sowingMonths.length > 0) {
    if (item.preCultivation) {
      phases.push({
        phase: 'forspiring',
        months: [...item.sowingMonths].sort((a, b) => a - b),
        label: 'Forspir',
      })
    } else {
      phases.push({
        phase: 'saaning',
        months: [...item.sowingMonths].sort((a, b) => a - b),
        label: 'Så',
      })
    }
  }

  if (item.plantingOutMonths && item.plantingOutMonths.length > 0) {
    phases.push({
      phase: 'udplantning',
      months: [...item.plantingOutMonths].sort((a, b) => a - b),
      label: 'Plant ud',
    })
  }

  if (item.harvestMonths && item.harvestMonths.length > 0) {
    phases.push({
      phase: 'host',
      months: [...item.harvestMonths].sort((a, b) => a - b),
      label: 'Høst',
    })
  }

  // Hvis ingen faser overhovedet — drop den
  if (phases.length === 0) return null

  return {
    id: `inv-${item.id}`,
    plant: item.name,
    variety: item.variety ?? undefined,
    phases,
    source: 'mine',
  }
}

/**
 * Generisk pulje af typiske danske køkkenhave-planter med deres
 * sæson-faser. Bruges når brugeren vælger "Alle forslag" eller
 * når frøbanken er tom. Måneder er kalibreret til dansk klima
 * (zone 7-8, ca. midt-Sjælland som reference).
 */
const FORSLAG_TIMELINE: Omit<TimelineEntry, 'source'>[] = [
  {
    id: 'forslag-tomat-cherry',
    plant: 'Tomat',
    variety: 'Cherry Sweetie',
    phases: [
      { phase: 'forspiring',  months: [3, 4],          label: 'Forspir' },
      { phase: 'udplantning', months: [5, 6],          label: 'Plant ud' },
      { phase: 'host',        months: [7, 8, 9, 10],   label: 'Høst' },
    ],
  },
  {
    id: 'forslag-agurk',
    plant: 'Agurk',
    variety: 'Marketmore',
    phases: [
      { phase: 'forspiring',  months: [4],             label: 'Forspir' },
      { phase: 'udplantning', months: [5, 6],          label: 'Plant ud' },
      { phase: 'host',        months: [7, 8, 9],       label: 'Høst' },
    ],
  },
  {
    id: 'forslag-squash',
    plant: 'Squash',
    variety: 'Patty Pan',
    phases: [
      { phase: 'forspiring',  months: [4],             label: 'Forspir' },
      { phase: 'udplantning', months: [5, 6],          label: 'Plant ud' },
      { phase: 'host',        months: [7, 8, 9],       label: 'Høst' },
    ],
  },
  {
    id: 'forslag-salat',
    plant: 'Salat',
    variety: 'Lollo Rossa',
    phases: [
      { phase: 'saaning',     months: [3, 4, 5, 6, 7], label: 'Så' },
      { phase: 'host',        months: [5, 6, 7, 8, 9], label: 'Høst' },
    ],
  },
  {
    id: 'forslag-radise',
    plant: 'Radise',
    variety: 'French Breakfast',
    phases: [
      { phase: 'saaning', months: [3, 4, 5, 6, 7, 8], label: 'Så' },
      { phase: 'host',    months: [4, 5, 6, 7, 8, 9], label: 'Høst' },
    ],
  },
  {
    id: 'forslag-bonne',
    plant: 'Bønne',
    variety: 'Borlotti',
    phases: [
      { phase: 'forspiring',  months: [4],             label: 'Forspir' },
      { phase: 'saaning',     months: [5, 6],          label: 'Så' },
      { phase: 'host',        months: [7, 8, 9],       label: 'Høst' },
    ],
  },
  {
    id: 'forslag-aerter',
    plant: 'Ærter',
    variety: 'Sukkerært',
    phases: [
      { phase: 'saaning', months: [3, 4, 5],          label: 'Så' },
      { phase: 'host',    months: [6, 7, 8],          label: 'Høst' },
    ],
  },
  {
    id: 'forslag-gulerod',
    plant: 'Gulerod',
    variety: 'Nantes',
    phases: [
      { phase: 'saaning', months: [4, 5, 6, 7],       label: 'Så' },
      { phase: 'host',    months: [7, 8, 9, 10],      label: 'Høst' },
    ],
  },
  {
    id: 'forslag-roedbede',
    plant: 'Rødbede',
    variety: 'Detroit',
    phases: [
      { phase: 'saaning', months: [4, 5, 6],          label: 'Så' },
      { phase: 'host',    months: [7, 8, 9, 10],      label: 'Høst' },
    ],
  },
  {
    id: 'forslag-peberfrugt',
    plant: 'Peberfrugt',
    variety: 'California Wonder',
    phases: [
      { phase: 'forspiring',  months: [2, 3],          label: 'Forspir' },
      { phase: 'udplantning', months: [5, 6],          label: 'Plant ud' },
      { phase: 'host',        months: [8, 9, 10],      label: 'Høst' },
    ],
  },
  {
    id: 'forslag-graeskar',
    plant: 'Græskar',
    variety: 'Hokkaido',
    phases: [
      { phase: 'forspiring',  months: [4],             label: 'Forspir' },
      { phase: 'udplantning', months: [5, 6],          label: 'Plant ud' },
      { phase: 'host',        months: [9, 10],         label: 'Høst' },
    ],
  },
  {
    id: 'forslag-groenkaal',
    plant: 'Grønkål',
    variety: 'Nero di Toscana',
    phases: [
      { phase: 'saaning',     months: [4, 5, 6],       label: 'Så' },
      { phase: 'udplantning', months: [6, 7],          label: 'Plant ud' },
      { phase: 'host',        months: [9, 10, 11, 12], label: 'Høst' },
    ],
  },
]

/**
 * Byg timeline-rækker. Hvis `filterMine === true` vises kun
 * brugerens egen frøbank/planter. Ellers vises både egne + forslag,
 * deduppet på plant+variety så vi ikke får dobbelt-rækker.
 *
 * Rækkefølge: egne planter først (vigtigst for brugeren), derefter
 * generelle forslag. Inden for hver gruppe sorteres alfabetisk på
 * plante-navn for forudsigelig læseflow.
 */
export function buildTimelineRows(
  inventory: InventoryItem[],
  plants: Plant[],
  filterMine: boolean,
): TimelineEntry[] {
  const mineEntries = inventory
    .map(inventoryToTimelineEntry)
    .filter((e): e is TimelineEntry => e !== null)
    .sort((a, b) => a.plant.localeCompare(b.plant, 'da'))

  // Egne aktive planter der ikke allerede er i inventory-listen kan
  // tilføjes som ekstra rækker (uden faser hvis vi ikke har data).
  // For nu: vi stoler på at inventory dækker brugerens dyrkningsdata.
  void plants

  if (filterMine) {
    return mineEntries
  }

  // Dedup nøgle: navn (case-insensitiv) — variety ignoreres ved match
  // så "Tomat — Cherry Sweetie" (mine) ikke kollapser med "Tomat —
  // San Marzano" (forslag). Tværtimod: hvis brugeren HAR en "Tomat",
  // viser vi ikke en generisk "Tomat"-forslag-række.
  const mineNames = new Set(mineEntries.map(e => e.plant.toLowerCase()))
  const forslagEntries: TimelineEntry[] = FORSLAG_TIMELINE
    .filter(f => !mineNames.has(f.plant.toLowerCase()))
    .map(f => ({ ...f, source: 'forslag' as const }))
    .sort((a, b) => a.plant.localeCompare(b.plant, 'da'))

  return [...mineEntries, ...forslagEntries]
}
