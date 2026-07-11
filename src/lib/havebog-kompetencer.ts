/**
 * Dyrkerkompetencer-deriver (11. juli 2026).
 *
 * Afleder kompetencer af FAKTISKE handlinger i plant_logs — grupperet pr. art.
 * Ren funktion, ingen DB. Kun log-typer der findes i dag; ALDRIG gættede
 * kompetencer (opbinding/frøavl/tørring/overvintring/kompost findes ikke som
 * log-typer og udelades bevidst — de venter på en log-/migrations-sprint).
 *
 * Output er editorial: område + korte færdighedsord, ikke "X af Y"-badges.
 */

import type { Kompetenceomraade } from '@/data/havebog-demo'

export interface KompLog { plant_id: string; type: string }
export interface KompPlant { name: string }

// Log-type → kompetence. Kun de typer der findes i PlantLogType i dag.
const KOMPETENCE: Record<string, string> = {
  sowing: 'Såning',
  germination: 'Spiring',
  planting_out: 'Udplantning',
  pruning: 'Beskæring',
  harvest: 'Høst',
  repotting: 'Ompotning',
  pest_disease: 'Sygdom & skadedyr',
}
// Fast rækkefølge så færdigheder læses som en sæson-bue (så → høst).
const RAEKKEFOELGE = ['Såning', 'Spiring', 'Udplantning', 'Beskæring', 'Høst', 'Ompotning', 'Sygdom & skadedyr']

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Byg kompetenceområder fra logs. Grupperer pr. art (plantens navn), samler
 * de kompetencer arten har logs for. Områder sorteres efter flest færdigheder.
 */
export function byggKompetencer(
  logs: KompLog[],
  plantById: Map<string, KompPlant>,
  maxOmraader = 4,
): Kompetenceomraade[] {
  const perArt = new Map<string, Set<string>>()
  for (const l of logs) {
    const komp = KOMPETENCE[l.type]
    if (!komp) continue
    const plant = plantById.get(l.plant_id)
    if (!plant) continue
    const art = plant.name.trim()
    if (!art) continue
    const set = perArt.get(art) ?? new Set<string>()
    set.add(komp)
    perArt.set(art, set)
  }

  const out: Kompetenceomraade[] = []
  for (const [art, skills] of perArt) {
    out.push({
      omraade: `${capitalize(art)}dyrkning`,
      faerdigheder: RAEKKEFOELGE.filter(s => skills.has(s)),
    })
  }
  return out
    .sort((a, b) => b.faerdigheder.length - a.faerdigheder.length || a.omraade.localeCompare(b.omraade, 'da'))
    .slice(0, maxOmraader)
}

/** Samlet antal færdigheder — til gating (vis kun sektionen ved >= 2). */
export function kompetenceAntal(omraader: Kompetenceomraade[]): number {
  return omraader.reduce((n, o) => n + o.faerdigheder.length, 0)
}
