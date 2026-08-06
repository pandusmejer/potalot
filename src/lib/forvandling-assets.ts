/**
 * Forvandlinger asset-system (9. juli 2026).
 *
 * `selectForvandlingAssets` vælger det bedste billede til en forvandlings-tile
 * i mosaikken — eller en typografisk farve-tile hvis intet foto findes.
 * Ren funktion: samme input → samme output. Ingen DB, upload eller CMS.
 *
 * Genbruger det eksisterende FORVANDLING_ASSETS-registry (afgrøde-fotos) plus
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
 *   - afgrøde-foto: læg i public/assets/forvandlinger/crops/{afgrøde}/ og tilføj
 *     en linje i FORVANDLING_ASSETS med useCases: ['forvandling', …].
 *   - kategori/mood-foto: læg i public/assets/forvandlinger/mood/ som
 *     {kategori}-stemning-01.jpg og tilføj en linje i FORVANDLING_KATEGORI_ASSETS.
 */

import {
  FORVANDLING_ASSETS,
  cropKey,
  type Saeson,
  type SpisekammerAssetRole,
} from './forvandling-registry'
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
 * public/assets/forvandlinger/mood/{kategori}-stemning-01.jpg
 */
export interface ForvandlingKategoriAsset {
  kategori: ForvandlingKategori
  path: string
  season?: Saeson
}
export const FORVANDLING_KATEGORI_ASSETS: ForvandlingKategoriAsset[] = [
  // Skønheds-/olie-leverance 6/8 2026. FØRSTE match pr. kategori vinder —
  // primærfotoet står øverst; resten er registreret som reserve.
  { kategori: 'plej', path: '/assets/forvandlinger/mood/plej-hudpleje-01.jpg' },
  { kategori: 'plej', path: '/assets/forvandlinger/mood/plej-wellness-01.jpg' },
  { kategori: 'plej', path: '/assets/forvandlinger/mood/plej-wellness-02.jpg' },
  { kategori: 'plej', path: '/assets/forvandlinger/mood/plej-olier-bred-01.jpg' },
  { kategori: 'plej', path: '/assets/forvandlinger/mood/plej-olier-hoej-01.jpg' },
  { kategori: 'duft', path: '/assets/forvandlinger/mood/duft-olier-01.jpg' },
  { kategori: 'duft', path: '/assets/forvandlinger/mood/duft-olier-02.jpg' },
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
  const forvandlingsFotos = FORVANDLING_ASSETS.filter(a => a.useCases.includes('forvandling'))
  // Generiske (ikke-bundne) forvandlings-fotos til sort/afgrøde-trinnene —
  // bundne fotos hører KUN til deres egen forvandling (trin 0).
  const generiske = forvandlingsFotos.filter(a => !a.forvandlingId)

  // 0. Forvandling-specifikt asset (fx et resultatfoto bundet til netop denne
  //    forvandling) — vinder over crop-match, så en sauce-krukke ikke lander
  //    på gazpacho.
  const bundet = forvandlingsFotos
    .filter(a => a.forvandlingId === f.id && passerSaeson(a.seasons, season))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0]
  if (bundet) return { slag: 'foto', path: bundet.path, kilde: 'afgroede' }

  // 1. Sortspecifikt asset.
  if (opts?.variety) {
    const vk = cropKey(opts.variety)
    const sort = generiske
      .filter(a => cropKey(a.crop) === vk && passerSaeson(a.seasons, season))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0]
    if (sort) return { slag: 'foto', path: sort.path, kilde: 'sort' }
  }

  // 2. Afgrøde/art-asset (én af forvandlingens afgrøder).
  const crops = new Set(f.crops.map(cropKey))
  const afgroede = generiske
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
