/**
 * Reaktiv motor — regelsæt.
 *
 * En regel kombinerer:
 *  - livscyklus-state
 *  - vejr
 *  - historik (tid siden sidste event)
 *  - placeringens flags
 *
 * Og producerer ForslagTilOpgave med klar rationalle ("jeg foreslår X fordi Y").
 */

import type { Plant, Placering, Livscyklus } from '@/lib/types'
import type { Forecast } from './weather'
import {
  kommerFrost,
  kommerKraftigRegn,
  kommerStorm,
  behoeverVanding,
} from './weather'

export interface ForslagTilOpgave {
  plant_id: string
  regel_id: string
  titel: string
  forklaring: string  // "fordi X" — altid gennemsigtig
  task_type: 'water' | 'fertilize' | 'prick_out' | 'plant_out' | 'harvest' | 'prune' | 'pest_check' | 'custom'
  due_date: string    // ISO-date
  priority: 'low' | 'medium' | 'high'
  haster: boolean     // Om det skal ende i acute notification
}

export interface PlanteKontekst {
  plant: Plant
  placering?: Placering
  dageSidenVandet?: number
  dageSidenGoedet?: number
  dageSidenSidsteEvent?: number
  livscyklus: Livscyklus
}

// ============================================
// Regel-evaluering
// ============================================

export function evaluerRegler(
  plants: PlanteKontekst[],
  forecast: Forecast | null
): ForslagTilOpgave[] {
  const forslag: ForslagTilOpgave[] = []

  for (const ctx of plants) {
    // Vejrafhængige regler (kræver forecast)
    if (forecast) {
      forslag.push(...frostRegel(ctx, forecast))
      forslag.push(...vandingRegel(ctx, forecast))
      forslag.push(...stormRegel(ctx, forecast))
      forslag.push(...kraftigRegnRegel(ctx, forecast))
    }

    // Historik-regler
    forslag.push(...vandIndendoersRegel(ctx))
    forslag.push(...tjekSpireRegel(ctx))
  }

  return dedupForslag(forslag)
}

// ============================================
// Individuelle regler
// ============================================

function frostRegel(ctx: PlanteKontekst, forecast: Forecast): ForslagTilOpgave[] {
  // Kun relevant for planter der ikke tåler frost, og ikke er i opvarmet placering
  if (ctx.placering?.heated) return []

  // Hvis planten er frosthårdig, spring over (baseret på guide når linked)
  // Kun spiret/priklet/udplantet planter er sårbare
  if (!['spiret', 'priklet', 'udplantet', 'i_vaekst'].includes(ctx.livscyklus)) return []

  const f = kommerFrost(forecast, 2)
  if (!f.ja || !f.hvornaar) return []

  const placeringInfo = ctx.placering ? ` på ${ctx.placering.name}` : ''
  const hvornaarDato = new Date(f.hvornaar)
  const dueDate = hvornaarDato.toISOString().split('T')[0]

  return [{
    plant_id: ctx.plant.id,
    regel_id: 'frost-advarsel',
    titel: `Flyt ${ctx.plant.name} inden natten`,
    forklaring: `Det bliver koldt${placeringInfo} — ${Math.round(forecast.hourly.find(h => h.time === f.hvornaar)?.temperature_c ?? 0)}°C. Planten tåler ikke frost.`,
    task_type: 'custom',
    due_date: dueDate,
    priority: 'high',
    haster: true,
  }]
}

function vandingRegel(ctx: PlanteKontekst, forecast: Forecast): ForslagTilOpgave[] {
  // Kun friland + altan er afhængige af regn
  if (ctx.placering?.exposure === 'indendoers') return []

  // Kun plante i vækst (ikke bare sået)
  if (!['udplantet', 'i_vaekst'].includes(ctx.livscyklus)) return []

  // Skip hvis vandet for nylig
  if (ctx.dageSidenVandet != null && ctx.dageSidenVandet < 2) return []

  if (!behoeverVanding(forecast, 3)) return []

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 1)

  return [{
    plant_id: ctx.plant.id,
    regel_id: 'vanding-torkeperiode',
    titel: `Vand ${ctx.plant.name}`,
    forklaring: 'Der er ikke regn i vente de næste dage, og det er varmt.',
    task_type: 'water',
    due_date: dueDate.toISOString().split('T')[0],
    priority: 'medium',
    haster: false,
  }]
}

function stormRegel(ctx: PlanteKontekst, forecast: Forecast): ForslagTilOpgave[] {
  // Kun friland og altan er udsatte
  if (!ctx.placering || ctx.placering.sheltered) return []
  if (!['friland', 'altan'].includes(ctx.placering.exposure ?? '')) return []

  // Kun voksne planter der kan være opbundne
  if (!['udplantet', 'i_vaekst'].includes(ctx.livscyklus)) return []

  const s = kommerStorm(forecast, 15)
  if (!s.ja || !s.hvornaar) return []

  return [{
    plant_id: ctx.plant.id,
    regel_id: 'storm-opbinding',
    titel: `Tjek opbinding af ${ctx.plant.name}`,
    forklaring: `Det blæser op — op mod ${Math.round(forecast.hourly.find(h => h.time === s.hvornaar)?.wind_ms ?? 0)} m/s.`,
    task_type: 'custom',
    due_date: s.hvornaar.split('T')[0],
    priority: 'high',
    haster: true,
  }]
}

function kraftigRegnRegel(ctx: PlanteKontekst, forecast: Forecast): ForslagTilOpgave[] {
  // Skipper vanding hvis der kommer meget regn
  if (ctx.dageSidenVandet != null && ctx.dageSidenVandet < 1) return []

  const r = kommerKraftigRegn(forecast, 10)
  if (!r.ja) return []

  // Dette er snarere en "luk-vanding-opgaver"-regel end et forslag
  // Vi returnerer intet — reglen bruges i opgave-deduplikering
  return []
}

function vandIndendoersRegel(ctx: PlanteKontekst): ForslagTilOpgave[] {
  // Indendørs planter har ingen regn — vand fast hver ~5 dage
  if (ctx.placering?.exposure !== 'indendoers') return []
  if (ctx.livscyklus === 'afsluttet') return []
  if (ctx.dageSidenVandet != null && ctx.dageSidenVandet < 5) return []

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 1)

  return [{
    plant_id: ctx.plant.id,
    regel_id: 'vanding-indendoers',
    titel: `Vand ${ctx.plant.name}`,
    forklaring: 'Indendørs plante — tid til lidt vand.',
    task_type: 'water',
    due_date: dueDate.toISOString().split('T')[0],
    priority: 'low',
    haster: false,
  }]
}

function tjekSpireRegel(ctx: PlanteKontekst): ForslagTilOpgave[] {
  // Hvis sået for X dage siden uden spire-event, foreslå tjek
  if (ctx.livscyklus !== 'soet') return []
  if (ctx.dageSidenSidsteEvent == null || ctx.dageSidenSidsteEvent < 7) return []
  if (ctx.dageSidenSidsteEvent > 30) return [] // Opgiv efter 30 dage

  const dueDate = new Date()

  return [{
    plant_id: ctx.plant.id,
    regel_id: 'tjek-spiring',
    titel: `Tjek spiring på ${ctx.plant.name}`,
    forklaring: `Sået for ${ctx.dageSidenSidsteEvent} dage siden — de fleste frø er oppe nu.`,
    task_type: 'pest_check',
    due_date: dueDate.toISOString().split('T')[0],
    priority: 'low',
    haster: false,
  }]
}

// ============================================
// Deduplikering — aldrig fem identiske påmindelser
// ============================================

function dedupForslag(forslag: ForslagTilOpgave[]): ForslagTilOpgave[] {
  const seen = new Set<string>()
  return forslag.filter(f => {
    const key = `${f.plant_id}:${f.regel_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
