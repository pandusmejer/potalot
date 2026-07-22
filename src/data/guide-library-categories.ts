/**
 * Bibliotekskategori — NAVIGATIONS-kategori for guidebiblioteket (IA), ikke en
 * botanisk sandhed og ikke en produktionskategori (primaryCategoryId: fro/loeg/
 * knolde …). Svarer til den måde HAVEFOLK tænker planter på.
 *
 * Bevidst let: et kurateret plantenavn→kategori-opslag, så biblioteket kan
 * bygge sit træ (kategori → art → sort) uden schema/import/backfill. Hver art
 * bor ÉT sted (tomat = grøntsag, ikke frugt — brugeren kommer ikke for en
 * botanisk debat). Tilføj nye planter her efterhånden som guiderne kommer.
 */

export type LibraryCategory =
  | 'groentsager'
  | 'frugt-baer'
  | 'blomster'
  | 'urter'
  | 'traeer'
  | 'buske'
  | 'prydgraesser'
  | 'loeg-knolde'

export const LIBRARY_CATEGORY_ORDER: LibraryCategory[] = [
  'groentsager',
  'frugt-baer',
  'blomster',
  'urter',
  'traeer',
  'buske',
  'prydgraesser',
  'loeg-knolde',
]

export const LIBRARY_CATEGORY_LABEL: Record<LibraryCategory, string> = {
  groentsager: 'Grøntsager',
  'frugt-baer': 'Frugt & bær',
  blomster: 'Blomster',
  urter: 'Urter',
  traeer: 'Træer',
  buske: 'Buske',
  prydgraesser: 'Prydgræsser',
  'loeg-knolde': 'Løg & knolde',
}

// Nøgle = plantName i småt. Ukendte planter falder til 'groentsager' (langt det
// mest almindelige i en køkkenhave) — se libraryCategoryOf.
const MAP: Record<string, LibraryCategory> = {
  // Grøntsager
  tomat: 'groentsager',
  agurk: 'groentsager',
  chili: 'groentsager',
  peberfrugt: 'groentsager',
  salat: 'groentsager',
  kål: 'groentsager',
  majs: 'groentsager',
  ært: 'groentsager',
  sukkerært: 'groentsager',
  radise: 'groentsager',
  squash: 'groentsager',
  græskar: 'groentsager',
  zucchini: 'groentsager',
  bønne: 'groentsager',
  stangbønne: 'groentsager',
  buskbønne: 'groentsager',
  gulerod: 'groentsager',
  rødbede: 'groentsager',
  pastinak: 'groentsager',
  selleri: 'groentsager',
  spinat: 'groentsager',
  broccoli: 'groentsager',
  blomkål: 'groentsager',
  fennikel: 'groentsager',
  aubergine: 'groentsager',

  // Frugt & bær
  jordbær: 'frugt-baer',
  hindbær: 'frugt-baer',
  ribs: 'frugt-baer',
  solbær: 'frugt-baer',
  blåbær: 'frugt-baer',
  stikkelsbær: 'frugt-baer',
  rabarber: 'frugt-baer',

  // Blomster
  dahlia: 'blomster',
  zinnia: 'blomster',
  solsikke: 'blomster',
  tagetes: 'blomster',
  morgenfrue: 'blomster',
  kosmos: 'blomster',
  ranunkel: 'blomster',
  stedmoderblomst: 'blomster',

  // Urter
  basilikum: 'urter',
  persille: 'urter',
  dild: 'urter',
  koriander: 'urter',
  mynte: 'urter',
  timian: 'urter',
  rosmarin: 'urter',
  oregano: 'urter',
  purløg: 'urter',
  salvie: 'urter',

  // Løg & knolde
  hvidløg: 'loeg-knolde',
  løg: 'loeg-knolde',
  rødløg: 'loeg-knolde',
  skalotteløg: 'loeg-knolde',
  kartoffel: 'loeg-knolde',

  // Træer / Buske / Prydgræsser: tilføjes når guiderne kommer.
}

export function libraryCategoryOf(plantName: string): LibraryCategory {
  return MAP[plantName.toLowerCase().trim()] ?? 'groentsager'
}
