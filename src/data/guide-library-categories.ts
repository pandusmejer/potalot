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
// mest almindelige i en køkkenhave) — se libraryCategoryOf. Holdes ajour med
// arts-guiderne: hver ny art tilføjes her, ellers havner den forkert.
const MAP: Record<string, LibraryCategory> = {
  // ── Grøntsager ──
  agurk: 'groentsager',
  artiskok: 'groentsager',
  asparges: 'groentsager',
  aubergine: 'groentsager',
  bladbede: 'groentsager',
  broccoli: 'groentsager',
  blomkål: 'groentsager',
  bønne: 'groentsager',
  buskbønne: 'groentsager',
  stangbønne: 'groentsager',
  chili: 'groentsager',
  cikorie: 'groentsager',
  endivie: 'groentsager',
  fennikel: 'groentsager',
  knoldfennikel: 'groentsager',
  græskar: 'groentsager',
  gulerod: 'groentsager',
  havrerod: 'groentsager',
  kål: 'groentsager',
  kålroe: 'groentsager',
  majroe: 'groentsager',
  majs: 'groentsager',
  melon: 'groentsager',
  okra: 'groentsager',
  'pak choi': 'groentsager',
  pastinak: 'groentsager',
  peberfrugt: 'groentsager',
  peberrod: 'groentsager',
  portulak: 'groentsager',
  radise: 'groentsager',
  rucola: 'groentsager',
  rødbede: 'groentsager',
  salat: 'groentsager',
  selleri: 'groentsager',
  skorzonerrod: 'groentsager',
  spinat: 'groentsager',
  squash: 'groentsager',
  zucchini: 'groentsager',
  tomat: 'groentsager',
  tomatillo: 'groentsager',
  vårsalat: 'groentsager',
  ært: 'groentsager',
  sukkerært: 'groentsager',

  // ── Frugt & bær (ikke-vedagtige/bløde bær) ──
  jordbær: 'frugt-baer',
  hindbær: 'frugt-baer',
  rabarber: 'frugt-baer',

  // ── Buske (vedagtige bærbuske) ──
  solbær: 'buske',
  ribs: 'buske',
  blåbær: 'buske',
  stikkelsbær: 'buske',
  brombær: 'buske',

  // ── Træer (frugttræer) ──
  æble: 'traeer',
  pære: 'traeer',
  blomme: 'traeer',
  kirsebær: 'traeer',

  // ── Prydgræsser ──
  blåtop: 'prydgraesser',
  elefantgræs: 'prydgraesser',
  hakonegræs: 'prydgraesser',
  lampepudsergræs: 'prydgraesser',
  rørhvene: 'prydgraesser',
  staudehirse: 'prydgraesser',

  // ── Blomster ──
  dahlia: 'blomster',
  zinnia: 'blomster',
  solsikke: 'blomster',
  tagetes: 'blomster',
  morgenfrue: 'blomster',
  cosmos: 'blomster',
  kosmos: 'blomster',
  kornblomst: 'blomster',
  kornvalmue: 'blomster',
  løvemund: 'blomster',
  tallerkensmækker: 'blomster',
  ærteblomst: 'blomster',
  ranunkel: 'blomster',
  stedmoderblomst: 'blomster',

  // ── Urter ──
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
  citronmelisse: 'urter',

  // ── Løg & knolde ──
  hvidløg: 'loeg-knolde',
  løg: 'loeg-knolde',
  rødløg: 'loeg-knolde',
  skalotteløg: 'loeg-knolde',
  porre: 'loeg-knolde',
  kartoffel: 'loeg-knolde',
  jordskok: 'loeg-knolde',
  'sød kartoffel': 'loeg-knolde',
}

export function libraryCategoryOf(plantName: string): LibraryCategory {
  return MAP[plantName.toLowerCase().trim()] ?? 'groentsager'
}

/**
 * Kategori → EKSISTERENDE Potalot soft-glyph (public/images/glyphs/*.png, samme
 * familie som frøbanken bruger). Ingen nye ikoner opfindes — kun genbrug. Vises
 * som afdæmpet vandmærke på kategori-kortet.
 */
export const LIBRARY_CATEGORY_GLYPH: Record<LibraryCategory, string> = {
  groentsager: 'groentsager',
  'frugt-baer': 'baer',
  blomster: 'blomster',
  urter: 'krydderurter',
  traeer: 'traeer',
  buske: 'buske',
  prydgraesser: 'prydgrasser',
  'loeg-knolde': 'loeg',
}

/** Kort intro pr. kategori — vises på kategorisidens hero. */
export const LIBRARY_CATEGORY_INTRO: Record<LibraryCategory, string> = {
  groentsager: 'Fra de første frø til det, du høster.',
  'frugt-baer': 'Søde bær og frugter til haven',
  blomster: 'Blomster til bed, krukke og buket',
  urter: 'Krydderurter til køkken og vindueskarm',
  traeer: 'Frugttræer til den lille og store have',
  buske: 'Bærbuske, der giver høst år efter år',
  prydgraesser: 'Græsser med struktur og bevægelse',
  'loeg-knolde': 'Løg og knolde — læg nu, høst senere',
}
