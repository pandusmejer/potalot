/**
 * "Denne uge i haven" — personaliserede anbefalinger.
 *
 * Kobler brugerens frøbank + aktive planter + aktuel sæson til konkrete
 * handlinger. Det er PotAlots kerne-feature: ikke "her er alle dine
 * planter", men "her er hvad du bør gøre lige nu".
 *
 * Ren funktion uden DB-kald — kaldes med allerede-hentet data.
 */

import type { InventoryItem, Plant, PlantStatus } from './types'

export type SuggestionKind = 'sow' | 'plant_out' | 'harvest' | 'tend'

export interface WeekSuggestion {
  id: string
  kind: SuggestionKind
  /** Lucide-ikon-navn */
  icon: 'Sprout' | 'TreePine' | 'Wheat' | 'Droplets' | 'Scissors' | 'Leaf'
  title: string
  detail: string
  /** Hvor brugeren sendes hen ved klik */
  href: string
  /** Sorterings-vægt — højere = mere presserende */
  weight: number
}

const KIND_META: Record<SuggestionKind, { icon: WeekSuggestion['icon']; weight: number }> = {
  sow: { icon: 'Sprout', weight: 80 },
  plant_out: { icon: 'TreePine', weight: 90 },
  harvest: { icon: 'Wheat', weight: 95 },
  tend: { icon: 'Droplets', weight: 60 },
}

function dageSiden(iso: string): number {
  const d = new Date(iso)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / 86400000)
}

/**
 * Beregn ugens anbefalinger for en given måned.
 * Returnerer maks 5, sorteret efter presserende-hed.
 */
export function computeWeekSuggestions(
  inventory: InventoryItem[],
  plants: Plant[],
  month: number
): WeekSuggestion[] {
  const out: WeekSuggestion[] = []
  const activePlants = plants.filter(p => !p.isArchived)

  // Hvilke sorter har brugeren allerede aktive? (undgå at foreslå "så X"
  // hvis X allerede er i jorden)
  const activeKeys = new Set(
    activePlants.map(p => `${p.name.toLowerCase().trim()}|${(p.variety ?? '').toLowerCase().trim()}`)
  )

  // ---- Fra frøbank: såning / udplantning denne måned ----
  for (const item of inventory) {
    const key = `${item.name.toLowerCase().trim()}|${(item.variety ?? '').toLowerCase().trim()}`
    const navn = item.variety ? `${item.name} — ${item.variety}` : item.name

    if (item.sowingMonths?.includes(month) && !activeKeys.has(key)) {
      out.push({
        id: `sow-${item.id}`,
        kind: 'sow',
        icon: KIND_META.sow.icon,
        title: item.preCultivation ? `Forspir ${navn}` : `Så ${navn}`,
        detail: item.preCultivation
          ? 'Frøbanken siger forspiring denne måned.'
          : 'Frøbanken siger såning denne måned.',
        href: '/mine-planter',
        weight: KIND_META.sow.weight,
      })
    } else if (item.plantingOutMonths?.includes(month) && !activeKeys.has(key)) {
      out.push({
        id: `plantout-${item.id}`,
        kind: 'plant_out',
        icon: KIND_META.plant_out.icon,
        title: `Plant ${navn} ud`,
        detail: 'Frøbanken siger udplantning denne måned.',
        href: '/mine-planter',
        weight: KIND_META.plant_out.weight,
      })
    } else if (item.harvestMonths?.includes(month)) {
      out.push({
        id: `harvest-${item.id}`,
        kind: 'harvest',
        icon: KIND_META.harvest.icon,
        title: `${navn} kan høstes`,
        detail: 'Frøbanken siger høst-måned.',
        href: '/mine-planter',
        weight: KIND_META.harvest.weight - 10, // lavere end faktisk-høstklar plante
      })
    }
  }

  // ---- Fra aktive planter: pleje baseret på stadie ----
  for (const p of activePlants) {
    const navn = p.variety ? `${p.name} — ${p.variety}` : p.name
    const href = `/mine-planter/${p.id}`
    const status: PlantStatus = p.status

    if (status === 'hoestklar') {
      out.push({
        id: `tend-harvest-${p.id}`,
        kind: 'harvest',
        icon: KIND_META.harvest.icon,
        title: `Høst ${navn}`,
        detail: 'Planten er markeret høstklar.',
        href,
        weight: KIND_META.harvest.weight,
      })
    } else if (status === 'klar_til_udplantning') {
      out.push({
        id: `tend-plantout-${p.id}`,
        kind: 'plant_out',
        icon: KIND_META.plant_out.icon,
        title: `Udplant ${navn}`,
        detail: 'Planten er klar til at komme i jorden.',
        href,
        weight: KIND_META.plant_out.weight,
      })
    } else if (status === 'saaet' && p.sowDate && dageSiden(p.sowDate) >= 21) {
      out.push({
        id: `tend-germ-${p.id}`,
        kind: 'tend',
        icon: 'Leaf',
        title: `Tjek spiring på ${navn}`,
        detail: `Sået for ${dageSiden(p.sowDate)} dage siden — burde være spiret nu.`,
        href,
        weight: 70,
      })
    } else if (status === 'udplantet') {
      out.push({
        id: `tend-water-${p.id}`,
        kind: 'tend',
        icon: 'Droplets',
        title: `Tilse ${navn}`,
        detail: 'Udplantet — tjek vanding og opbinding.',
        href,
        weight: KIND_META.tend.weight,
      })
    }
  }

  // Dedup på title (frøbank + plante kan overlappe), sortér, top 5
  const seen = new Set<string>()
  return out
    .sort((a, b) => b.weight - a.weight)
    .filter(s => {
      if (seen.has(s.title)) return false
      seen.add(s.title)
      return true
    })
    .slice(0, 5)
}
