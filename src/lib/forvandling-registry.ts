/**
 * Spisekammer asset-system (Fase E+, 9. juli 2026).
 *
 * Et lille billedbibliotek Spisekammer-mosaikken kan trække på, så den bliver
 * individuel, sæsonnær og visuelt varieret — uden at blive en opskriftsapp.
 * Kun asset-valg; ingen upload/CMS/DB. Ren funktion → testbar.
 *
 * Fallback (mosaikken knækker ALDRIG på et manglende billede):
 *   1. sortspecifikt asset → 2. afgrøde/art-asset → 3. mood-asset →
 *   4. farve-/typografi-tile (CROP_FARVE).
 *
 * Registret seeder de EKSISTERENDE botaniske makroer (/images/makro/…) så
 * systemet virker i dag; læg rigtige spisekammer-fotos i
 * public/assets/forvandlinger/ og tilføj en linje i FORVANDLING_ASSETS.
 */

export type SpisekammerAssetRole = 'fruit' | 'plant' | 'leaf' | 'flower' | 'kitchen' | 'mood' | 'texture'
export type Saeson = 'spring' | 'summer' | 'autumn' | 'winter'
export function saesonForMaaned(m: number): Saeson {
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}
type Mood = 'fresh' | 'warm' | 'green' | 'summer' | 'kitchen' | 'quiet'
// 'forvandling' = eksplicit egnet til en forvandlings-tile i mosaikken. Bevidst
// adskilt fra 'mosaic'/'cropTile' (crop-foto-tiles), så generiske makroer ikke
// kaprer de redaktionelle forvandlings-felter — kun fotos tagget 'forvandling'
// vælges af selectForvandlingAssets.
export type UseCase = 'mosaic' | 'recipeTile' | 'cropTile' | 'background' | 'noteTile' | 'forvandling'

export interface SpisekammerAsset {
  crop: string          // normaliseret nøgle (ingen æøå): tomat, jordbaer, agurk…
  cropLabel: string     // visningsnavn: "Tomater"
  path: string
  role: SpisekammerAssetRole
  mood?: Mood
  seasons?: Saeson[]
  useCases: UseCase[]
  /** Binder et foto til ÉN bestemt forvandling (fx et resultatfoto). Vinder
   *  over crop-match, så fx en tomatsauce-krukke ikke lander på gazpacho. */
  forvandlingId?: string
  /** Højere = foretrækkes. */
  priority?: number
}

// Afgrøde-farver (Annas palet) — brugt til farvefelter når intet foto findes.
export const CROP_FARVE: Record<string, string> = {
  tomat: '#B85A3D',
  jordbaer: '#C36F7C',
  agurk: '#7E8E68',
  salat: '#A8B88A',
  chili: '#9F3F32',
  basilikum: '#6F7E55',
  squash: '#B7A64A',
  aerter: '#8FAF72',
  ribs: '#9D3F46',
  kartoffel: '#B99A6B',
  lavendel: '#7E6480',
  dahlia: '#C87F94',
}
const STANDARD_FARVE = '#8B9774'

/**
 * Registret. Seedet med eksisterende makroer (rolle = hvad billedet viser).
 * Rigtige spisekammer-fotos tilføjes her efterhånden som de produceres.
 */
export const FORVANDLING_ASSETS: SpisekammerAsset[] = [
  // tomat — rigtige forvandlinger-fotos (pakke 1)
  { crop: 'tomat', cropLabel: 'Tomater', path: '/assets/forvandlinger/crops/tomat/tomat-koekken-01.jpg', role: 'fruit', mood: 'warm', seasons: ['summer'], useCases: ['mosaic', 'cropTile', 'recipeTile'], priority: 95 },
  { crop: 'tomat', cropLabel: 'Tomater', path: '/assets/forvandlinger/crops/tomat/tomat-plante-01.jpg', role: 'plant', mood: 'green', seasons: ['summer'], useCases: ['mosaic', 'background'], priority: 62 },
  { crop: 'tomat', cropLabel: 'Tomatsauce på glas', path: '/assets/forvandlinger/crops/tomat/tomat-sauce-01.jpg', role: 'kitchen', mood: 'warm', seasons: ['summer'], useCases: ['forvandling'], forvandlingId: 'tomatsauce', priority: 90 },
  { crop: 'tomat', cropLabel: 'Gem tomatfrø', path: '/assets/forvandlinger/crops/tomat/tomat-froe-01.jpg', role: 'texture', mood: 'quiet', useCases: ['forvandling'], forvandlingId: 'gem-tomatfroe', priority: 90 },
  // lavendel — pakke 1 (vises for lavendel-dyrkere; ikke i demo-mosaikken)
  { crop: 'lavendel', cropLabel: 'Lavendel', path: '/assets/forvandlinger/crops/lavendel/lavendel-plante-01.jpg', role: 'flower', mood: 'quiet', seasons: ['summer'], useCases: ['mosaic', 'cropTile'], priority: 90 },
  { crop: 'lavendel', cropLabel: 'Lavendel', path: '/assets/forvandlinger/crops/lavendel/lavendel-toer-01.jpg', role: 'plant', mood: 'quiet', seasons: ['summer'], useCases: ['mosaic', 'background'], priority: 60 },
  { crop: 'lavendel', cropLabel: 'Lavendelbundter', path: '/assets/forvandlinger/crops/lavendel/lavendel-bundt-01.jpg', role: 'flower', mood: 'quiet', useCases: ['forvandling'], forvandlingId: 'lavendelbundter', priority: 90 },
  { crop: 'lavendel', cropLabel: 'Duftpose', path: '/assets/forvandlinger/crops/lavendel/lavendel-duftpose-01.jpg', role: 'flower', mood: 'quiet', useCases: ['forvandling'], forvandlingId: 'duftpose', priority: 90 },
  // kamille — urte-te-flat-lay (kamille-hero), bundet til kamille-te
  { crop: 'kamille', cropLabel: 'Kamille-te', path: '/assets/forvandlinger/crops/kamille/kamille-te-01.jpg', role: 'kitchen', mood: 'quiet', useCases: ['forvandling'], forvandlingId: 'kamille-te', priority: 90 },
  // jordbær — pakke 2 (vises i demo-mosaikken)
  { crop: 'jordbaer', cropLabel: 'Jordbær', path: '/assets/forvandlinger/crops/jordbaer/jordbaer-koekken-01.jpg', role: 'fruit', mood: 'warm', seasons: ['summer'], useCases: ['mosaic', 'cropTile'], priority: 90 },
  { crop: 'jordbaer', cropLabel: 'Jordbærtærte', path: '/assets/forvandlinger/crops/jordbaer/jordbaer-taerte-01.jpg', role: 'kitchen', mood: 'warm', useCases: ['forvandling'], forvandlingId: 'jordbaertaerte', priority: 90 },
  // chili — rigtigt crop-foto (erstatter makro) + chiliflager
  { crop: 'chili', cropLabel: 'Chili', path: '/assets/forvandlinger/crops/chili/chili-plante-01.jpg', role: 'fruit', mood: 'warm', seasons: ['summer'], useCases: ['mosaic', 'cropTile'], priority: 90 },
  { crop: 'chili', cropLabel: 'Tørrede chilier', path: '/assets/forvandlinger/crops/chili/chili-flakes-01.jpg', role: 'kitchen', mood: 'warm', useCases: ['forvandling'], forvandlingId: 'toerrede-chilier', priority: 90 },
  // basilikum — rigtige fotos (erstatter makro)
  { crop: 'basilikum', cropLabel: 'Basilikum', path: '/assets/forvandlinger/crops/basilikum/basilikum-plante-01.jpg', role: 'plant', mood: 'green', seasons: ['summer'], useCases: ['mosaic', 'cropTile'], priority: 90 },
  { crop: 'basilikum', cropLabel: 'Basilikumpesto', path: '/assets/forvandlinger/crops/basilikum/basilikum-pesto-01.jpg', role: 'kitchen', mood: 'green', useCases: ['forvandling'], forvandlingId: 'basilikumpesto', priority: 90 },
  // dahlia — enkelt bloms, bundet til dahlia-vase
  { crop: 'dahlia', cropLabel: 'Dahlia i vase', path: '/assets/forvandlinger/crops/dahlia/dahlia-plante-01.jpg', role: 'flower', mood: 'quiet', useCases: ['forvandling'], forvandlingId: 'dahlia-vase', priority: 90 },
  // agurk — pakke 2 (crop-tile vises i demo; syltede-agurker bundet, vises i demo)
  { crop: 'agurk', cropLabel: 'Agurker', path: '/assets/forvandlinger/crops/agurk/agurk-koekken-01.jpg', role: 'fruit', mood: 'green', seasons: ['summer'], useCases: ['mosaic', 'cropTile'], priority: 92 },
  { crop: 'agurk', cropLabel: 'Syltede agurker', path: '/assets/forvandlinger/crops/agurk/agurk-sylt-01.jpg', role: 'kitchen', mood: 'green', useCases: ['forvandling'], forvandlingId: 'syltede-agurker', priority: 90 },
  { crop: 'agurk', cropLabel: 'Agurkesalat', path: '/assets/forvandlinger/crops/agurk/agurk-salat-01.jpg', role: 'kitchen', mood: 'green', useCases: ['forvandling'], forvandlingId: 'agurkesalat', priority: 90 },
  // tomat — makro-fallback (bevaret, lavere prioritet)
  { crop: 'tomat', cropLabel: 'Tomater', path: '/images/makro/tomat-san-marzano/klase.jpg', role: 'fruit', mood: 'warm', seasons: ['summer'], useCases: ['mosaic', 'cropTile'], priority: 70 },
  { crop: 'tomat', cropLabel: 'Tomater', path: '/images/makro/tomat/blad-lys.jpg', role: 'leaf', mood: 'fresh', seasons: ['summer'], useCases: ['mosaic', 'background'], priority: 55 },
  // agurk
  { crop: 'agurk', cropLabel: 'Agurker', path: '/images/makro/agurk/frugt.jpg', role: 'fruit', mood: 'green', seasons: ['summer'], useCases: ['mosaic', 'cropTile', 'recipeTile'], priority: 88 },
  { crop: 'agurk', cropLabel: 'Agurker', path: '/images/makro/agurk/blad.jpg', role: 'leaf', mood: 'green', seasons: ['summer'], useCases: ['mosaic', 'background'], priority: 50 },
  // basilikum
  { crop: 'basilikum', cropLabel: 'Basilikum', path: '/images/makro/basilikum/bundt.jpg', role: 'plant', mood: 'green', seasons: ['summer'], useCases: ['mosaic', 'cropTile'], priority: 80 },
  // chili
  { crop: 'chili', cropLabel: 'Chili', path: '/images/makro/chili/blomst.jpg', role: 'flower', mood: 'warm', seasons: ['summer'], useCases: ['mosaic', 'background'], priority: 60 },
  { crop: 'chili', cropLabel: 'Chili', path: '/images/makro/chili/blad.jpg', role: 'leaf', mood: 'green', seasons: ['summer'], useCases: ['mosaic', 'background'], priority: 45 },
]

function norm(s: string): string {
  return s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').trim()
}
export function cropKey(navn: string): string {
  const k = norm(navn).split(/[\s-]/)[0]
  // Robust mod flertal ("Agurker"→agurk, "Tomater"→tomat).
  for (const kandidat of [k, k.replace(/er$/, ''), k.replace(/e$/, ''), k.replace(/r$/, '')]) {
    if (CROP_FARVE[kandidat] || FORVANDLING_ASSETS.some(a => a.crop === kandidat)) return kandidat
  }
  return k
}
export function farveForCrop(navn: string): string {
  return CROP_FARVE[cropKey(navn)] ?? STANDARD_FARVE
}

// Rollernes egnethed til et afgrøde-tile (frugt/plante vinder over blad/blomst).
const ROLLE_RANG: Record<SpisekammerAssetRole, number> = {
  fruit: 5, plant: 4, kitchen: 3, leaf: 2, flower: 1, mood: 0, texture: 0,
}

export interface SpisekammerFoto {
  path: string
  cropLabel: string
  role: SpisekammerAssetRole
}

export interface SpisekammerValg {
  fotos: SpisekammerFoto[]
  opskrifter: { navn: string; farve: string }[]
  note: string[]
  /** Høst-status; antalErHoester=true → tallet er høst-logs (vis ikke "18 jordbær"). */
  hoest: { navn: string; antal: string }[]
  antalErHoester: boolean
}

const NOTE_PR_SAESON: Record<Saeson, string[]> = {
  spring: ['Friske', 'første blade'],
  summer: ['Noget køligt', 'til varme dage'],
  autumn: ['Gem sommeren', 'på glas'],
  winter: ['Varme retter', 'af lageret'],
}

/**
 * Vælg mosaik-assets. Ren funktion: samme input → samme output.
 */
export function selectSpisekammerAssets(input: {
  harvestedCrops: { navn: string; antal: string }[]
  recipeIdeas: string[]
  season?: Saeson
  maxPhotos?: number
  antalErHoester?: boolean
}): SpisekammerValg {
  const { harvestedCrops, recipeIdeas, season = 'summer', maxPhotos = 2 } = input

  // ── Foto-tiles: bedste afgrøde-asset pr. crop, ingen dublet-crop (med-
  //    mindre kun én afgrøde). Fallback til mood; ellers ingen foto (→ farvetile).
  const fotos: SpisekammerFoto[] = []
  const brugteCrops = new Set<string>()
  const kunEn = harvestedCrops.length === 1
  for (const h of harvestedCrops) {
    if (fotos.length >= maxPhotos) break
    const key = cropKey(h.navn)
    if (brugteCrops.has(key) && !kunEn) continue
    // 2. afgrøde/art-asset (frugt/plante foretrukket til cropTile).
    const kandidater = FORVANDLING_ASSETS
      .filter(a => a.crop === key && a.useCases.some(u => u === 'mosaic' || u === 'cropTile'))
      .sort((a, b) => ROLLE_RANG[b.role] - ROLLE_RANG[a.role] || (b.priority ?? 0) - (a.priority ?? 0))
    let valgt = kandidater[0]
    // 3. mood-asset hvis intet afgrøde-foto.
    if (!valgt) {
      valgt = FORVANDLING_ASSETS
        .filter(a => a.role === 'mood' && (a.seasons ?? []).includes(season))
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0]
    }
    if (valgt) {
      fotos.push({ path: valgt.path, cropLabel: h.navn, role: valgt.role })
      brugteCrops.add(key)
    }
  }

  // ── Opskrift-tiles: farve fra afgrøde hvis navnet peger på en, ellers
  //    roterende accent — variation frem for gentagelse.
  const roterende = ['#B85A3D', '#C36F7C', '#8B9774', '#7E6480', '#9A6A3E']
  const opskrifter = recipeIdeas.map((navn, i) => {
    const match = Object.keys(CROP_FARVE).find(c => norm(navn).includes(c))
    return { navn, farve: match ? CROP_FARVE[match] : roterende[i % roterende.length] }
  })

  return {
    fotos,
    opskrifter,
    note: NOTE_PR_SAESON[season],
    hoest: harvestedCrops,
    antalErHoester: input.antalErHoester ?? false,
  }
}
