/**
 * Forvandlinger asset-system (9. juli 2026).
 *
 * `selectForvandlingAssets` vælger det bedste billede til en forvandlings-tile
 * i mosaikken — eller en typografisk farve-tile hvis intet foto findes.
 * Ren funktion: samme input → samme output. Ingen DB, upload eller CMS.
 *
 * Genbruger det eksisterende SPISEKAMMER_ASSETS-registry (afgrøde-fotos) plus
 * et forvandlings-specifikt kategori/mood-registry. Mosaikken KNÆKKER ALDRIG
 * på et manglende billede — den falder til farve-tilen.
 *
 * Fallback-rækkefølge:
 *   1. sortspecifikt asset   (brugerens konkrete sort, hvis kendt)
 *   2. afgrøde/art-asset      (forvandlingens afgrøder, tagget 'forvandling')
 *   3. kategori/mood-asset    (FORVANDLING_KATEGORI_ASSETS)
 *   4. typografisk farve-tile (KATEGORI_FARVE)
 *
 * Navngivning klar til rigtige fotos (intet ekstra kodearbejde):
 *   - afgrøde-foto: læg i public/assets/spisekammer/crops/{afgrøde}/ og tilføj
 *     en linje i SPISEKAMMER_ASSETS med useCases: ['forvandling', …].
 *   - kategori/mood-foto: læg i public/assets/spisekammer/mood/ som
 *     {kategori}-stemning-01.jpg og tilføj en linje i FORVANDLING_KATEGORI_ASSETS.
 */

import {
  SPISEKAMMER_ASSETS,
  cropKey,
  type Saeson,
  type SpisekammerAssetRole,
} from './spisekammer-assets'
import {
  KATEGORI_FARVE,
  type HavebogForvandling,
  type ForvandlingKategori,
} from './havebog-forvandlinger'

export type ForvandlingAssetKilde = 'sort' | 'afgroede' | 'kategori'

export type ForvandlingAssetValg =
  | { slag: 'foto'; path: string; kilde: ForvandlingAssetKilde }
  | { slag: 'farve'; farve: string }

/**
 * Kategori-/mood-fotos til forvandlings-tiles. Tomt indtil rigtige fotos
 * produceres — indtil da rammer fallback farve-tilen. Navngivning:
 * public/assets/spisekammer/mood/{kategori}-stemning-01.jpg
 */
export interface ForvandlingKategoriAsset {
  kategori: ForvandlingKategori
  path: string
  season?: Saeson
}
export const FORVANDLING_KATEGORI_ASSETS: ForvandlingKategoriAsset[] = [
  // fx { kategori: 'bryg', path: '/assets/spisekammer/mood/bryg-stemning-01.jpg', season: 'summer' },
]

// Frugt/køkken/plante-roller egner sig bedst til et forvandlings-foto.
const ROLLE_RANG: Record<SpisekammerAssetRole, number> = {
  fruit: 5, plant: 4, kitchen: 3, leaf: 2, flower: 1, mood: 0, texture: 0,
}

function passerSaeson(assetSeasons: Saeson[] | undefined, season?: Saeson): boolean {
  return !season || !assetSeasons || assetSeasons.includes(season)
}

/**
 * Vælg asset til én forvandlings-tile. `variety` = brugerens konkrete sort
 * (fx "San Marzano") hvis kendt; ellers falder step 1 igennem.
 */
export function selectForvandlingAssets(
  f: HavebogForvandling,
  opts?: { variety?: string; season?: Saeson },
): ForvandlingAssetValg {
  const season = opts?.season

  // Kun fotos eksplicit tagget til forvandlings-brug (ikke generiske makroer).
  const forvandlingsFotos = SPISEKAMMER_ASSETS.filter(a => a.useCases.includes('forvandling'))

  // 1. Sortspecifikt asset.
  if (opts?.variety) {
    const vk = cropKey(opts.variety)
    const sort = forvandlingsFotos
      .filter(a => cropKey(a.crop) === vk && passerSaeson(a.seasons, season))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0]
    if (sort) return { slag: 'foto', path: sort.path, kilde: 'sort' }
  }

  // 2. Afgrøde/art-asset (én af forvandlingens afgrøder).
  const crops = new Set(f.crops.map(cropKey))
  const afgroede = forvandlingsFotos
    .filter(a => crops.has(cropKey(a.crop)) && passerSaeson(a.seasons, season))
    .sort((a, b) => ROLLE_RANG[b.role] - ROLLE_RANG[a.role] || (b.priority ?? 0) - (a.priority ?? 0))[0]
  if (afgroede) return { slag: 'foto', path: afgroede.path, kilde: 'afgroede' }

  // 3. Kategori/mood-asset.
  const kat = FORVANDLING_KATEGORI_ASSETS.filter(
    k => k.kategori === f.category && (!season || !k.season || k.season === season),
  )[0]
  if (kat) return { slag: 'foto', path: kat.path, kilde: 'kategori' }

  // 4. Typografisk farve-tile — mosaikken knækker aldrig.
  return { slag: 'farve', farve: KATEGORI_FARVE[f.category] }
}
