import type { Guide } from '@/lib/types'
import { normalizeGuideKey } from './normalize-key'

/**
 * Løs match-nøgle: normalizeGuideKey + fold diakritiske tegn (é→e, ñ→n, ó→o).
 * KUN til at matche en frøbank-sort mod en kurateret sortsguide. Ændrer IKKE
 * normalizeGuideKey (som master-sync-koblingen hænger på).
 *
 * Bevidst IKKE fuzzy/substring: 'Padron' = 'Padrón', men 'Jalapeno' rammer
 * ALDRIG 'Early Jalapeño'. Ved usikkerhed falder vi tilbage til artsniveau —
 * hellere artsguiden end en flot, autoritativ og forkert sortsguide.
 */
export function looseKey(s: string): string {
  return normalizeGuideKey(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Ét guide-objekt i "I din have" — enten en artsguide eller en sortsguide. */
export interface HaveGuideItem {
  guide: Guide
  kind: 'species' | 'variety'
  plantName: string // artsnavn (til label "Chili · Sortsguide")
  rank: number
}

/** Slankt kort-data (billede resolvet server-side) → carousel-klienten. */
export interface HaveCardData {
  guideId: string
  title: string
  subtitle: string
  imageSrc: string | null
  kind: 'species' | 'variety'
}

/** Minimal frøbank-form modellen behøver (afkoblet fra hele InventoryItem). */
export interface MinInventory {
  name: string
  variety?: string | null
  sowingMonths?: number[]
  plantingOutMonths?: number[]
  harvestMonths?: number[]
  isFavorite?: boolean
  isPinned?: boolean
}

/**
 * "I din have" = et personligt udvalg af GUIDE-OBJEKTER (arts- OG sortsguides),
 * ikke et artsindeks. Pr. frøbank-vare: findes en kurateret sortsguide til
 * netop den sort → vis den (mest specifik); ellers artsguiden. Rangeret efter
 * sæson → sortsguide → pinned/favorit. Ingen AI-guides her (de bor i "Dine egne
 * guides") — kun det kuraterede Potalot-lag.
 *
 * @param month 1–12 (sæson-signal).
 */
export function buildMineHaveGuides(
  guides: Guide[],
  inventory: MinInventory[],
  month: number,
): HaveGuideItem[] {
  const byId = new Map(guides.map(g => [g.id, g]))
  const speciesByKey = new Map<string, Guide>()
  const varietyByKey = new Map<string, Guide>()
  for (const g of guides) {
    if (g.guideLevel === 'species') {
      speciesByKey.set(looseKey(g.plantName), g)
    } else if (g.guideLevel === 'variety' && g.variety) {
      const parent = g.parentGuideId ? byId.get(g.parentGuideId) : undefined
      const speciesName = parent?.plantName ?? g.plantName
      varietyByKey.set(`${looseKey(speciesName)}::${looseKey(g.variety)}`, g)
    }
  }

  const seen = new Set<string>()
  const items: HaveGuideItem[] = []
  for (const inv of inventory) {
    const sKey = looseKey(inv.name)
    const species = speciesByKey.get(sKey)
    if (!species) continue // ingen kurateret art → intet kort (AI-guide vises separat)

    let guide = species
    let kind: 'species' | 'variety' = 'species'
    if (inv.variety) {
      const v = varietyByKey.get(`${sKey}::${looseKey(inv.variety)}`)
      if (v) {
        guide = v
        kind = 'variety'
      }
    }
    if (seen.has(guide.id)) continue
    seen.add(guide.id)

    const inSeason = [inv.sowingMonths, inv.plantingOutMonths, inv.harvestMonths].some(
      arr => arr?.includes(month),
    )
    let rank = 0
    if (inSeason) rank += 100
    if (kind === 'variety') rank += 40 // sortsguide til brugerens sort > artsguide
    if (inv.isPinned) rank += 20
    if (inv.isFavorite) rank += 10

    items.push({ guide, kind, plantName: species.plantName, rank })
  }

  items.sort(
    (a, b) => b.rank - a.rank || a.plantName.localeCompare(b.plantName, 'da'),
  )
  return items
}

/** Forside-udvalg: maks ÉN guide pr. art, så seks tomater ikke overtager. */
export function pickForForside(items: HaveGuideItem[], n = 4): HaveGuideItem[] {
  const perArt = new Set<string>()
  const out: HaveGuideItem[] = []
  for (const it of items) {
    if (perArt.has(it.plantName)) continue
    perArt.add(it.plantName)
    out.push(it)
    if (out.length >= n) break
  }
  return out
}
