/**
 * Mad-kategori for artsguider — KURATERET frontend-kort, ikke et datamodel-felt.
 *
 * Bevidst let: Grøntsager/Blomster/Frugt/Urter kan IKKE udledes af de
 * plantnings-baserede primaryCategoryId (fro/loeg/knolde/stauder — en tomat,
 * chili og kål er alle "fro"). I stedet et simpelt plantenavn→kategori-opslag,
 * så biblioteket kan gruppere uden schema/import/backfill. Tilføj nye planter
 * her efterhånden som guiderne kommer.
 */

export type FoodCategory = 'groentsag' | 'blomst' | 'frugt' | 'urt'

export const FOOD_CATEGORY_ORDER: FoodCategory[] = [
  'groentsag',
  'blomst',
  'frugt',
  'urt',
]

export const FOOD_CATEGORY_LABEL: Record<FoodCategory, string> = {
  groentsag: 'Grøntsager',
  blomst: 'Blomster',
  frugt: 'Frugt og bær',
  urt: 'Urter',
}

// Nøgle = plantName i småt. Ukendte planter falder til 'groentsag' (langt det
// mest almindelige i en køkkenhave) — se foodCategoryOf.
const MAP: Record<string, FoodCategory> = {
  // Grøntsager
  tomat: 'groentsag',
  agurk: 'groentsag',
  chili: 'groentsag',
  peberfrugt: 'groentsag',
  salat: 'groentsag',
  kål: 'groentsag',
  majs: 'groentsag',
  ært: 'groentsag',
  sukkerært: 'groentsag',
  radise: 'groentsag',
  hvidløg: 'groentsag',
  løg: 'groentsag',
  porre: 'groentsag',
  squash: 'groentsag',
  græskar: 'groentsag',
  zucchini: 'groentsag',
  bønne: 'groentsag',
  stangbønne: 'groentsag',
  buskbønne: 'groentsag',
  gulerod: 'groentsag',
  rødbede: 'groentsag',
  pastinak: 'groentsag',
  selleri: 'groentsag',
  spinat: 'groentsag',
  broccoli: 'groentsag',
  blomkål: 'groentsag',
  fennikel: 'groentsag',
  aubergine: 'groentsag',

  // Blomster
  dahlia: 'blomst',
  zinnia: 'blomst',
  solsikke: 'blomst',
  tagetes: 'blomst',
  morgenfrue: 'blomst',
  kosmos: 'blomst',
  ranunkel: 'blomst',
  stedmoderblomst: 'blomst',

  // Frugt og bær
  jordbær: 'frugt',
  hindbær: 'frugt',
  ribs: 'frugt',
  solbær: 'frugt',
  blåbær: 'frugt',
  stikkelsbær: 'frugt',
  rabarber: 'frugt',

  // Urter
  basilikum: 'urt',
  persille: 'urt',
  dild: 'urt',
  koriander: 'urt',
  mynte: 'urt',
  timian: 'urt',
  rosmarin: 'urt',
  oregano: 'urt',
  purløg: 'urt',
  salvie: 'urt',
}

export function foodCategoryOf(plantName: string): FoodCategory {
  return MAP[plantName.toLowerCase().trim()] ?? 'groentsag'
}
