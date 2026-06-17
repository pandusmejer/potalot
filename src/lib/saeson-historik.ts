import type { Plant } from '@/lib/types'

/**
 * "Fra frø til nu" — sæsonens vækst udledt af FAKTISKE plante-hændelser
 * (planter-persistens-sprint, step 5). Ikke statisk havepoesi: hver måneds
 * linje kommer fra rigtige datoer på brugerens planter.
 *
 * Datakilder pr. plante (TZ-sikker ISO-parse, ingen Date-objekt):
 *   sowDate          → "N frø kom i jorden"
 *   plantingOutDate  → "N planter flyttede ud"
 *   firstHarvestDate → "N blev klar til høst" — KUN når planten faktisk
 *                       nåede høst (status hoestklar/afsluttet), så vi ikke
 *                       fortæller om en forventet fremtidig høst som fortid.
 *
 * Kun hændelser med dato ≤ i dag tælles med (fremtiden er ikke "vækst til nu").
 * Tom → []: kalderen skjuler sektionen (rolig fallback, intet opdigtet).
 */

export interface MaanedHistorie {
  maaned: string
  historie: string
}

export const MAANEDER = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December',
]

/** Månedsnavn for en ISO-dato (YYYY-MM-DD). */
export function maanedNavn(iso: string): string {
  return MAANEDER[Number(iso.slice(5, 7)) - 1] ?? ''
}

interface Bucket { sow: number; out: number; harvest: number }

function plural(n: number, en: string, flere: string): string {
  return `${n} ${n === 1 ? en : flere}`
}

const HARVEST_STATUSER = new Set(['hoestklar', 'afsluttet'])

/**
 * Byg sæsonens månedspunkter for indeværende sæson (året i `today`).
 * @param plants  Alle brugerens planter (inkl. arkiverede — de hører til sæsonen).
 * @param today   Dagens dato, YYYY-MM-DD (server-tid), bruges som øvre grænse.
 */
export function buildSaesonHistorik(plants: Plant[], today: string): MaanedHistorie[] {
  const year = today.slice(0, 4)
  const buckets = new Map<number, Bucket>()
  const touch = (monthIndex: number): Bucket => {
    let b = buckets.get(monthIndex)
    if (!b) { b = { sow: 0, out: 0, harvest: 0 }; buckets.set(monthIndex, b) }
    return b
  }

  // Tæl kun hændelser i indeværende år og som allerede er sket (dato ≤ i dag).
  const sameSeason = (iso: string | null | undefined): boolean =>
    !!iso && iso.slice(0, 4) === year && iso.slice(0, 10) <= today

  for (const p of plants) {
    const qty = p.quantity ?? 0
    if (qty <= 0) continue
    if (sameSeason(p.sowDate)) touch(Number(p.sowDate!.slice(5, 7)) - 1).sow += qty
    if (sameSeason(p.plantingOutDate)) touch(Number(p.plantingOutDate!.slice(5, 7)) - 1).out += qty
    if (sameSeason(p.firstHarvestDate) && HARVEST_STATUSER.has(p.status)) {
      touch(Number(p.firstHarvestDate!.slice(5, 7)) - 1).harvest += qty
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([monthIndex, b]) => {
      const dele: string[] = []
      if (b.sow > 0) dele.push(`${plural(b.sow, 'frø', 'frø')} kom i jorden`)
      if (b.out > 0) dele.push(`${plural(b.out, 'plante', 'planter')} flyttede ud`)
      if (b.harvest > 0) dele.push(`${plural(b.harvest, 'plante', 'planter')} blev klar til høst`)
      const linje = dele.join(' · ')
      return { maaned: MAANEDER[monthIndex], historie: linje ? `${linje}.` : '' }
    })
    .filter(m => m.historie !== '')
}
