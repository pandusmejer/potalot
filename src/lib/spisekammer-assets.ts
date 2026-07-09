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
 * public/assets/spisekammer/ og tilføj en linje i SPISEKAMMER_ASSETS.
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
type UseCase = 'mosaic' | 'recipeTile' | 'cropTile' | 'background' | 'noteTile'

export interface SpisekammerAsset {
  crop: string          // normaliseret nøgle (ingen æøå): tomat, jordbaer, agurk…
  cropLabel: string     // visningsnavn: "Tomater"
  path: string
  role: SpisekammerAssetRole
  mood?: Mood
  seasons?: Saeson[]
  useCases: UseCase[]
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
}
const STANDARD_FARVE = '#8B9774'

/**
 * Registret. Seedet med eksisterende makroer (rolle = hvad billedet viser).
 * Rigtige spisekammer-fotos tilføjes her efterhånden som de produceres.
 */
export const SPISEKAMMER_ASSETS: SpisekammerAsset[] = [
  // tomat
  { crop: 'tomat', cropLabel: 'Tomater', path: '/images/makro/tomat-san-marzano/klase.jpg', role: 'fruit', mood: 'warm', seasons: ['summer'], useCases: ['mosaic', 'cropTile', 'recipeTile'], priority: 90 },
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
    if (CROP_FARVE[kandidat] || SPISEKAMMER_ASSETS.some(a => a.crop === kandidat)) return kandidat
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
    const kandidater = SPISEKAMMER_ASSETS
      .filter(a => a.crop === key && a.useCases.some(u => u === 'mosaic' || u === 'cropTile'))
      .sort((a, b) => ROLLE_RANG[b.role] - ROLLE_RANG[a.role] || (b.priority ?? 0) - (a.priority ?? 0))
    let valgt = kandidater[0]
    // 3. mood-asset hvis intet afgrøde-foto.
    if (!valgt) {
      valgt = SPISEKAMMER_ASSETS
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
