/**
 * "Første gange"-deriver (12. juli 2026) — kort 8.
 *
 * Ren funktion, ingen DB. Finder brugerens FØRSTE beviselige forekomst af hver
 * milepælstype ud fra plant_logs + plantefelter. Kun log-typer/felter der findes
 * i dag — ALDRIG gættede milepæle (ærligheds-reglen).
 *
 * V1-milepæle:
 *   sowing → Første såning · germination → Første spiring ·
 *   planting_out → Første udplantning · harvest → Første <afgrøde>høst ·
 *   pruning → Første beskæring · pest_disease → Første skadedyrsnotat ·
 *   archive/arkiveret plante → Første afsluttede forløb ·
 *   drivhus (plantens location, KUN ved tydelig match) → Første drivhussæson
 *
 * Bevidst UDELADT i V1: blomstring/dahlia (ingen beviselig logtype/felt),
 * frøavl, overvintring, kompost, tørring (ingen log-typer endnu).
 *
 * Drivhus-reglen: vis KUN hvis `location` tydeligt matcher drivhus/greenhouse.
 * Fri, uklar tekst → skjul. Ingen gæt, ingen "måske drivhus".
 */

import type { Bedrift } from '@/data/havebog-demo'

export interface FGLog { plant_id: string; type: string; date: string }
export interface FGPlant {
  name: string
  variety?: string | null
  location?: string | null
  is_archived?: boolean
  archived_at?: string | null
}

/** Milepæl med dato — til deterministisk sortering (Bedrift bærer ikke dato). */
export interface FoersteGang extends Bedrift { dato: string }

// Beviselige log-typer → milepæl (kind + basis-label).
const LOG_MILEPAEL: Record<string, { kind: Bedrift['kind']; label: string }> = {
  sowing: { kind: 'saaning', label: 'såning' },
  germination: { kind: 'spiring', label: 'spiring' },
  planting_out: { kind: 'udplantning', label: 'udplantning' },
  pruning: { kind: 'beskaering', label: 'beskæring' },
  pest_disease: { kind: 'skadedyr', label: 'skadedyrsnotat' },
  harvest: { kind: 'hoest', label: 'høst' },
}

/**
 * Tydelig drivhus-location. STRIKS: behandler location som et LABEL, der skal
 * BEGYNDE med "drivhus"/"greenhouse" ("Drivhus", "Drivhus 1", "Drivhuset",
 * "Greenhouse"). Fri-tekst der bare NÆVNER drivhus ("ved siden af drivhuset")
 * matcher IKKE — hellere skjule end gætte. (Struktureret location-key kan
 * matches direkte her senere.)
 */
function erDrivhus(loc?: string | null): boolean {
  if (!loc) return false
  const s = loc.trim().toLowerCase()
  return s.startsWith('drivhus') || s.startsWith('greenhouse')
}

/**
 * Byg alle beviselige "første gange" — returneres KRONOLOGISK (ældste først).
 * Havebog-preview reverserer + slicer selv (se foersteGangePreview).
 */
export function byggFoersteGange(
  logs: FGLog[],
  plantById: Map<string, FGPlant>,
): FoersteGang[] {
  const ud: FoersteGang[] = []

  // 1-6 · log-type-milepæle: tidligste forekomst af hver type.
  for (const [logType, def] of Object.entries(LOG_MILEPAEL)) {
    let tidligste: FGLog | null = null
    for (const l of logs) {
      if (l.type !== logType) continue
      if (!tidligste || l.date < tidligste.date) tidligste = l
    }
    if (!tidligste) continue
    const plant = plantById.get(tidligste.plant_id)
    const titel =
      def.kind === 'hoest' && plant?.name?.trim()
        ? `Første ${plant.name.trim().toLowerCase()}høst`
        : `Første ${def.label}`
    ud.push({ kind: def.kind, titel, aar: tidligste.date.slice(0, 4), dato: tidligste.date })
  }

  // 7 · afsluttet forløb: tidligste 'archive'-log ELLER arkiverede plantes archived_at.
  let afsluttet: string | null = null
  for (const l of logs) {
    if (l.type !== 'archive') continue
    if (!afsluttet || l.date < afsluttet) afsluttet = l.date
  }
  for (const p of plantById.values()) {
    if (p.is_archived && p.archived_at) {
      const d = p.archived_at.slice(0, 10)
      if (!afsluttet || d < afsluttet) afsluttet = d
    }
  }
  if (afsluttet) {
    ud.push({ kind: 'afsluttet', titel: 'Første afsluttede forløb', aar: afsluttet.slice(0, 4), dato: afsluttet })
  }

  // 8 · drivhussæson: KUN ved tydelig location-match; dato = tidligste log
  //      for en drivhus-plante. Uden logs kan sæsonen ikke dateres → skjul.
  const drivhusPlanter = new Set<string>()
  for (const [id, p] of plantById) {
    if (erDrivhus(p.location)) drivhusPlanter.add(id)
  }
  if (drivhusPlanter.size > 0) {
    let drivhusDato: string | null = null
    for (const l of logs) {
      if (!drivhusPlanter.has(l.plant_id)) continue
      if (!drivhusDato || l.date < drivhusDato) drivhusDato = l.date
    }
    if (drivhusDato) {
      ud.push({ kind: 'drivhus', titel: 'Første drivhussæson', aar: drivhusDato.slice(0, 4), dato: drivhusDato })
    }
  }

  // Kronologisk (ældste først). Deterministisk tie-break på kind.
  return ud.sort((a, b) => a.dato.localeCompare(b.dato) || a.kind.localeCompare(b.kind))
}

/** Havebog-preview: nyeste først, max N. Fjerner intern dato → Bedrift[]. */
export function foersteGangePreview(alle: FoersteGang[], max = 4): Bedrift[] {
  return [...alle]
    .sort((a, b) => b.dato.localeCompare(a.dato) || a.kind.localeCompare(b.kind))
    .slice(0, max)
    .map(({ dato: _dato, ...b }) => b)
}
