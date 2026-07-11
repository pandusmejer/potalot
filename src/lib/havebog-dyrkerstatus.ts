/**
 * Dyrkerstatus-deriver (11. juli 2026).
 *
 * Afleder dyrker-IDENTITETER af faktiske data — ikke gamification. Ingen
 * niveauer, XP, badges eller progressbar. Kun ægte signaler; skjul uden data.
 *
 * Kilder (alle findes i dag, ingen migration):
 *   - plant_logs: harvest / sowing / germination (sæson-scopet)
 *   - frøbank (inventory_items): antal sorter + subcategory_id
 *   - planter: location (drivhus)
 */

import type { Dyrkerstatus } from '@/data/havebog-demo'

export interface StatusLog { plant_id: string; type: string; date: string }
export interface StatusPlant { name: string; location?: string | null }
export interface StatusInventory { name: string; variety?: string | null; subcategory_id?: string | null }

export interface DyrkerstatusInput {
  logs: StatusLog[]
  plantById: Map<string, StatusPlant>
  seasonStart: string | null
  plants: StatusPlant[]
  inventory: StatusInventory[]
}

/**
 * Returnerer kvalificerede statusser i prioriteret rækkefølge (primær først).
 * Tom liste → sektionen skjules (gating i page.tsx).
 */
export function byggDyrkerstatus(input: DyrkerstatusInput): Dyrkerstatus[] {
  const { logs, plantById, seasonStart, plants, inventory } = input
  const iSaeson = (d: string) => !seasonStart || d >= seasonStart

  const hoestLogs = logs.filter(l => l.type === 'harvest' && iSaeson(l.date))
  const hoestArter = new Set<string>()
  for (const l of hoestLogs) {
    const p = plantById.get(l.plant_id)
    if (p) hoestArter.add(p.name.trim().toLowerCase())
  }
  const saaLogs = logs.filter(l => (l.type === 'sowing' || l.type === 'germination') && iSaeson(l.date))
  const froSorter = new Set(inventory.map(i => `${i.name}|${i.variety ?? ''}`.trim().toLowerCase()))
  const harBlomster = inventory.some(i => (i.subcategory_id ?? '').startsWith('blomster'))
  const harKrydderurter = inventory.some(i => (i.subcategory_id ?? '') === 'krydderurter')
  const harDrivhus = plants.some(p => /drivhus/i.test(p.location ?? ''))

  // Prioriteret: den mest identitetsbærende status står først.
  const kandidater: Array<{ ok: boolean; s: Dyrkerstatus }> = [
    { ok: hoestArter.size >= 3, s: { titel: 'Selvforsyner', beskrivelse: 'Du har høstet fra flere afgrøder denne sæson.' } },
    { ok: hoestLogs.length >= 8, s: { titel: 'Høstsamler', beskrivelse: 'Du har samlet mange høster ind i år.' } },
    { ok: harDrivhus, s: { titel: 'Drivhusdyrker', beskrivelse: 'Du dyrker en del af haven under glas.' } },
    { ok: harBlomster, s: { titel: 'Blomsterdyrker', beskrivelse: 'Du dyrker blomster, ikke kun mad.' } },
    { ok: harKrydderurter, s: { titel: 'Krydderurteholder', beskrivelse: 'Du holder krydderurter tæt på køkkenet.' } },
    { ok: froSorter.size >= 6, s: { titel: 'Frøsamler', beskrivelse: 'Din frøbank er vokset til en rigtig samling.' } },
    { ok: saaLogs.length >= 3, s: { titel: 'Sæsonstarter', beskrivelse: 'Du kom tidligt i gang med at forspire og så.' } },
  ]
  return kandidater.filter(k => k.ok).map(k => k.s)
}
