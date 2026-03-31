export const TASK_TYPES = {
  sow: { label: 'Så', color: 'bg-green-100 text-green-800' },
  water: { label: 'Vand', color: 'bg-blue-100 text-blue-800' },
  fertilize: { label: 'Gød', color: 'bg-amber-100 text-amber-800' },
  prick_out: { label: 'Prikl ud', color: 'bg-purple-100 text-purple-800' },
  harden_off: { label: 'Afhærd', color: 'bg-orange-100 text-orange-800' },
  plant_out: { label: 'Plant ud', color: 'bg-emerald-100 text-emerald-800' },
  harvest: { label: 'Høst', color: 'bg-red-100 text-red-800' },
  prune: { label: 'Beskær', color: 'bg-yellow-100 text-yellow-800' },
  pest_check: { label: 'Skadedyr', color: 'bg-rose-100 text-rose-800' },
  custom: { label: 'Andet', color: 'bg-gray-100 text-gray-800' },
} as const

export type TaskType = keyof typeof TASK_TYPES

export const PLANT_STATUSES = {
  planned: { label: 'Planlagt', color: 'bg-gray-100 text-gray-800' },
  sown: { label: 'Sået', color: 'bg-green-100 text-green-800' },
  germinated: { label: 'Spiret', color: 'bg-lime-100 text-lime-800' },
  pricked: { label: 'Priklet', color: 'bg-purple-100 text-purple-800' },
  hardening: { label: 'Afhærdes', color: 'bg-orange-100 text-orange-800' },
  planted_out: { label: 'Plantet ud', color: 'bg-emerald-100 text-emerald-800' },
  growing: { label: 'Vokser', color: 'bg-green-200 text-green-900' },
  flowering: { label: 'Blomstrer', color: 'bg-pink-100 text-pink-800' },
  harvesting: { label: 'Høstes', color: 'bg-red-100 text-red-800' },
  done: { label: 'Færdig', color: 'bg-gray-200 text-gray-600' },
  dead: { label: 'Død', color: 'bg-gray-300 text-gray-500' },
} as const

export type PlantStatus = keyof typeof PLANT_STATUSES

export const SEED_STATUSES = {
  in_stock: { label: 'På lager', color: 'bg-green-100 text-green-800' },
  sown: { label: 'Sået', color: 'bg-blue-100 text-blue-800' },
  depleted: { label: 'Opbrugt', color: 'bg-gray-100 text-gray-600' },
  expired: { label: 'Udløbet', color: 'bg-red-100 text-red-800' },
} as const

export const GUIDE_CATEGORIES = {
  froe: { label: 'Frø', color: 'bg-green-100 text-green-800' },
  loeg: { label: 'Løg', color: 'bg-amber-100 text-amber-800' },
  knolde: { label: 'Knolde', color: 'bg-orange-100 text-orange-800' },
  buske: { label: 'Buske', color: 'bg-emerald-100 text-emerald-800' },
  traeer: { label: 'Træer', color: 'bg-teal-100 text-teal-800' },
  stauder: { label: 'Stauder', color: 'bg-pink-100 text-pink-800' },
  indkoebsliste: { label: 'Indkøbs- og ønskeliste', color: 'bg-gray-100 text-gray-800' },
} as const

export const MONTHS_DA = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
] as const

export const PRIMARY_CATEGORIES = {
  froe: { label: 'Frø', icon: 'Sprout' },
  loeg: { label: 'Løg', icon: 'CircleDot' },
  knolde: { label: 'Knolde', icon: 'Droplets' },
  buske: { label: 'Buske', icon: 'TreePine' },
  traeer: { label: 'Træer', icon: 'Trees' },
  stauder: { label: 'Stauder', icon: 'Flower' },
  indkoebsliste: { label: 'Indkøbs- og ønskeliste', icon: 'ShoppingCart' },
} as const

export type PrimaryCategory = keyof typeof PRIMARY_CATEGORIES

export const LOG_TYPES = {
  observation: { label: 'Observation', color: 'bg-blue-100 text-blue-800', icon: 'Eye' },
  harvest: { label: 'Høst', color: 'bg-red-100 text-red-800', icon: 'Apple' },
  problem: { label: 'Problem', color: 'bg-amber-100 text-amber-800', icon: 'AlertTriangle' },
  learning: { label: 'Læring', color: 'bg-purple-100 text-purple-800', icon: 'Lightbulb' },
  milestone: { label: 'Milepæl', color: 'bg-green-100 text-green-800', icon: 'Flag' },
  weather: { label: 'Vejr', color: 'bg-cyan-100 text-cyan-800', icon: 'Cloud' },
  other: { label: 'Andet', color: 'bg-gray-100 text-gray-800', icon: 'PenLine' },
} as const

export type LogType = keyof typeof LOG_TYPES

export const DEFAULT_SUBCATEGORIES = [
  'Grøntsager',
  'Blomster (1-årige)',
  'Blomster (flerårige)',
  'Krydderurter',
  'Græsser',
  'Bær',
  'Frugt',
  'Pryd',
] as const
