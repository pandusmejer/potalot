/**
 * Månedsplan-logik: "Det kan du så i april" baseret på guides.
 *
 * Matcher danske månedsforkortelser (jan, feb, mar, apr, maj, jun, jul, aug, sep, okt, nov, dec)
 * mod en aktuel måned.
 */

import type { PlantGuide } from '@/lib/types'

const MAANED_FORKORTELSER = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export function maanedFraDato(d: Date): string {
  return MAANED_FORKORTELSER[d.getMonth()]
}

/**
 * Er månden inden for et interval?
 * fx isMaanedMellem('apr', 'mar', 'maj') = true (mar→maj spænder over apr)
 * fx isMaanedMellem('dec', 'nov', 'feb') = true (wrap around year)
 */
export function isMaanedMellem(maaned: string, start: string | null, slut: string | null): boolean {
  if (!start || !slut) return false
  const mIdx = MAANED_FORKORTELSER.indexOf(maaned.toLowerCase())
  const sIdx = MAANED_FORKORTELSER.indexOf(start.toLowerCase())
  const eIdx = MAANED_FORKORTELSER.indexOf(slut.toLowerCase())
  if (mIdx === -1 || sIdx === -1 || eIdx === -1) return false

  if (sIdx <= eIdx) {
    return mIdx >= sIdx && mIdx <= eIdx
  }
  // Wrap around year-end
  return mIdx >= sIdx || mIdx <= eIdx
}

export interface MaanedsAktivitet {
  guide: PlantGuide
  aktivitet: 'so_inde' | 'so_ude' | 'plant_ud' | 'host'
  periode: string
}

export function genererMaanedsplan(guides: PlantGuide[], maaned: string): MaanedsAktivitet[] {
  const resultat: MaanedsAktivitet[] = []

  for (const g of guides) {
    if (isMaanedMellem(maaned, g.sow_indoor_start, g.sow_indoor_end)) {
      resultat.push({
        guide: g,
        aktivitet: 'so_inde',
        periode: `${g.sow_indoor_start}–${g.sow_indoor_end}`,
      })
    }
    if (isMaanedMellem(maaned, g.sow_outdoor_start, g.sow_outdoor_end)) {
      resultat.push({
        guide: g,
        aktivitet: 'so_ude',
        periode: `${g.sow_outdoor_start}–${g.sow_outdoor_end}`,
      })
    }
    if (isMaanedMellem(maaned, g.plant_out_start, g.plant_out_end)) {
      resultat.push({
        guide: g,
        aktivitet: 'plant_ud',
        periode: `${g.plant_out_start}–${g.plant_out_end}`,
      })
    }
    if (isMaanedMellem(maaned, g.harvest_start, g.harvest_end)) {
      resultat.push({
        guide: g,
        aktivitet: 'host',
        periode: `${g.harvest_start}–${g.harvest_end}`,
      })
    }
  }

  return resultat
}

export const AKTIVITET_LABEL: Record<MaanedsAktivitet['aktivitet'], string> = {
  so_inde: 'Så indendørs',
  so_ude: 'Så udendørs',
  plant_ud: 'Plant ud',
  host: 'Høst',
}

export const MAANED_FULD: Record<string, string> = {
  jan: 'Januar', feb: 'Februar', mar: 'Marts', apr: 'April',
  maj: 'Maj', jun: 'Juni', jul: 'Juli', aug: 'August',
  sep: 'September', okt: 'Oktober', nov: 'November', dec: 'December',
}

export { MAANED_FORKORTELSER }
