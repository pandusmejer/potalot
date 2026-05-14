/**
 * System-konstanter for PotAlot.
 * Kategorier, labels, ikoner — alt statisk der ikke kommer fra DB.
 */

import type {
  PrimaryCategory, PrimaryCategoryId, Subcategory, UserMode,
  PlantStatus, InventoryStatus, TaskType, TaskPriority,
  Difficulty, Light, Water, GrowingLocation,
} from './types'

// ============================================
// Primære kategorier (Niveau 1)
// ============================================

export const PRIMARY_CATEGORIES: Record<PrimaryCategoryId, PrimaryCategory> = {
  fro:            { id: 'fro',            name: 'Frø',                    icon: 'Sprout',      isSystem: true },
  loeg:           { id: 'loeg',           name: 'Løg',                    icon: 'CircleDot',   isSystem: true },
  knolde:         { id: 'knolde',         name: 'Knolde',                 icon: 'Gem',         isSystem: true },
  buske:          { id: 'buske',          name: 'Buske',                  icon: 'TreeDeciduous', isSystem: true },
  traeer:         { id: 'traeer',         name: 'Træer',                  icon: 'Trees',       isSystem: true },
  stauder:        { id: 'stauder',        name: 'Stauder',                icon: 'Flower2',     isSystem: true },
  indkoebsliste:  { id: 'indkoebsliste',  name: 'Indkøbs- og ønskeliste', icon: 'ShoppingCart', isSystem: true },
  favoritter:     { id: 'favoritter',     name: 'Favoritter',             icon: 'Star',        isSystem: true, isDynamic: true },
}

export const PRIMARY_CATEGORY_IDS: PrimaryCategoryId[] = [
  'fro', 'loeg', 'knolde', 'buske', 'traeer', 'stauder', 'indkoebsliste', 'favoritter',
]

// ============================================
// System-underkategorier (Niveau 2)
// ============================================

export const SYSTEM_SUBCATEGORIES: Subcategory[] = [
  { id: 'groentsager',        name: 'Grøntsager',         parentCategoryIds: ['fro', 'loeg', 'knolde'], isSystem: true },
  { id: 'blomster_1aarige',   name: 'Blomster, 1-årige',  parentCategoryIds: ['fro'],                    isSystem: true },
  { id: 'blomster_fleraarige',name: 'Blomster, flerårige', parentCategoryIds: ['fro', 'stauder', 'loeg', 'knolde'], isSystem: true },
  { id: 'krydderurter',       name: 'Krydderurter',       parentCategoryIds: ['fro', 'stauder'],         isSystem: true },
  { id: 'graesser',           name: 'Græsser',            parentCategoryIds: ['stauder', 'fro'],         isSystem: true },
  { id: 'baer',               name: 'Bær',                parentCategoryIds: ['buske', 'stauder'],       isSystem: true },
  { id: 'frugt',              name: 'Frugt',              parentCategoryIds: ['traeer', 'buske'],        isSystem: true },
  { id: 'pryd',               name: 'Pryd',               parentCategoryIds: ['stauder', 'buske', 'traeer'], isSystem: true },
]

// ============================================
// User modes
// ============================================

export const USER_MODES: Record<UserMode, { label: string; tagline: string; description: string }> = {
  maalrettet: {
    label: 'Målrettet',
    tagline: 'For den ambitiøse dyrker',
    description: 'Flere påmindelser, flere forslag, alt info synligt. Du vil gerne have optimeret hvert bed og hver plante.',
  },
  afslappet: {
    label: 'Afslappet',
    tagline: 'For hobbygartneren',
    description: 'Roligt tempo, kun vigtige opgaver fremhæves. Haven er glæde, ikke et KPI-projekt.',
  },
  minimal: {
    label: 'Minimal',
    tagline: 'Uden notifikationer',
    description: 'Ingen påmindelser. Ingen forslag. Du åbner appen når du vil vide noget, ikke når den vil have din opmærksomhed.',
  },
}

// ============================================
// Status-labels og farver
// ============================================

export const PLANT_STATUS_META: Record<PlantStatus, { label: string; badgeVariant: string; description: string }> = {
  planlagt:             { label: 'Planlagt',             badgeVariant: 'muted',   description: 'Klar til at blive sået eller plantet' },
  saaet:                { label: 'Sået',                 badgeVariant: 'info',    description: 'Frø i jorden, venter på spiring' },
  spirer:               { label: 'Spirer',               badgeVariant: 'success', description: 'Nye skud er oppe' },
  i_vaekst:             { label: 'I vækst',              badgeVariant: 'success', description: 'Vokser aktivt' },
  klar_til_udplantning: { label: 'Klar til udplantning', badgeVariant: 'warning', description: 'Kan rykkes ud i haven' },
  udplantet:            { label: 'Udplantet',            badgeVariant: 'info',    description: 'Står i sit blivende bed' },
  hoestklar:            { label: 'Høstklar',             badgeVariant: 'warning', description: 'Kan høstes snart' },
  afsluttet:            { label: 'Afsluttet',            badgeVariant: 'muted',   description: 'Sæsonen er slut' },
}

export const INVENTORY_STATUS_META: Record<InventoryStatus, { label: string; badgeVariant: string }> = {
  i_froebank:  { label: 'I frøbank',  badgeVariant: 'muted' },
  planlagt:    { label: 'Planlagt',   badgeVariant: 'outline' },
  saaet:       { label: 'Sået',       badgeVariant: 'info' },
  i_jord:      { label: 'I jord',     badgeVariant: 'info' },
  i_vaekst:    { label: 'I vækst',    badgeVariant: 'success' },
  afsluttet:   { label: 'Afsluttet',  badgeVariant: 'muted' },
  arkiveret:   { label: 'Arkiveret',  badgeVariant: 'muted' },
}

// ============================================
// Opgave-typer
// ============================================

export const TASK_TYPE_META: Record<TaskType, { label: string; icon: string }> = {
  pre_sow:     { label: 'Forspir',       icon: 'Sprout' },
  sowing:      { label: 'Så',            icon: 'Sprout' },
  repot:       { label: 'Omplant',       icon: 'ArrowUpRight' },
  plant_out:   { label: 'Udplant',       icon: 'TreePine' },
  watering:    { label: 'Vand',          icon: 'Droplets' },
  fertilizing: { label: 'Gød',           icon: 'Leaf' },
  pruning:     { label: 'Beskær',        icon: 'Scissors' },
  pest_check:  { label: 'Skadedyr-tjek', icon: 'Bug' },
  harvest:     { label: 'Høst',          icon: 'Wheat' },
  weeding:     { label: 'Luge',          icon: 'Trash2' },
  maintenance: { label: 'Vedligehold',   icon: 'Wrench' },
  planning:    { label: 'Planlæg',       icon: 'ClipboardList' },
  custom:      { label: 'Opgave',        icon: 'ListTodo' },
}

export const TASK_PRIORITY_META: Record<TaskPriority, { label: string; badgeVariant: string }> = {
  low:      { label: 'Lav',     badgeVariant: 'muted' },
  medium:   { label: 'Medium',  badgeVariant: 'outline' },
  high:     { label: 'Høj',     badgeVariant: 'warning' },
  critical: { label: 'Kritisk', badgeVariant: 'destructive' },
}

// ============================================
// Dyrkningsinfo
// ============================================

export const DIFFICULTY_META: Record<Difficulty, { label: string; chipClass: string }> = {
  easy:   { label: 'Nem',       chipClass: 'bg-green-100 text-green-800 border-green-200' },
  medium: { label: 'Mellem',    chipClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  hard:   { label: 'Krævende',  chipClass: 'bg-orange-100 text-orange-900 border-orange-200' },
}

export const LIGHT_META: Record<Light, { label: string; icon: string }> = {
  full_sun:      { label: 'Fuld sol',   icon: 'Sun' },
  partial_shade: { label: 'Halvskygge', icon: 'CloudSun' },
  shade:         { label: 'Skygge',     icon: 'Cloud' },
}

export const WATER_META: Record<Water, { label: string; icon: string }> = {
  low:     { label: 'Lidt',       icon: 'Droplet' },
  regular: { label: 'Regelmæssig', icon: 'Droplets' },
  high:    { label: 'Meget',      icon: 'CloudRain' },
}

export const GROWING_LOCATION_META: Record<GrowingLocation, { label: string; icon: string }> = {
  vindueskarm: { label: 'Vindueskarm',   icon: 'Home' },
  drivhus:     { label: 'Drivhus',       icon: 'Warehouse' },
  hoejbed:     { label: 'Højbed',        icon: 'Box' },
  friland:     { label: 'Friland',       icon: 'Mountain' },
  krukke:      { label: 'Krukke',        icon: 'Flower' },
  custom:      { label: 'Egen placering', icon: 'MapPin' },
}

// ============================================
// Måneder
// ============================================

export const MONTHS_DA = [
  { num: 1, short: 'jan', full: 'Januar' },
  { num: 2, short: 'feb', full: 'Februar' },
  { num: 3, short: 'mar', full: 'Marts' },
  { num: 4, short: 'apr', full: 'April' },
  { num: 5, short: 'maj', full: 'Maj' },
  { num: 6, short: 'jun', full: 'Juni' },
  { num: 7, short: 'jul', full: 'Juli' },
  { num: 8, short: 'aug', full: 'August' },
  { num: 9, short: 'sep', full: 'September' },
  { num: 10, short: 'okt', full: 'Oktober' },
  { num: 11, short: 'nov', full: 'November' },
  { num: 12, short: 'dec', full: 'December' },
] as const

// ============================================
// Navigation
// ============================================

export const PRIMARY_NAV = [
  { href: '/', label: 'Havebog', icon: 'Notebook' },
  { href: '/mine-planter', label: 'Planter', icon: 'Sprout' },
  { href: '/froebank', label: 'Frøbank', icon: 'Package', isHero: true },   // Visuelt dominerende
  { href: '/kalender', label: 'Kalender', icon: 'CalendarDays' },
  { href: '/guides', label: 'Guides', icon: 'BookOpen' },
] as const

export const SECONDARY_NAV = [
  { href: '/profil', label: 'Min profil', icon: 'User' },
  { href: '/grupper', label: 'Mine grupper', icon: 'Users' },
  { href: '/idetavle', label: 'Min idétavle', icon: 'Lightbulb' },
  { href: '/indstillinger', label: 'Indstillinger', icon: 'Settings' },
] as const

// ============================================
// Grupper
// ============================================

// Lukket tag-vokabular til interessegrupper, organiseret i tre akser.
// Plantefokus håndteres i et separat felt (focus_plants) — ikke som tag.
export const TAG_AXES = [
  {
    id: 'sted',
    label: 'Sted',
    tags: [
      { id: 'drivhus',       label: 'Drivhus' },
      { id: 'altan',         label: 'Altan' },
      { id: 'koekkenhave',   label: 'Køkkenhave' },
      { id: 'kolonihave',    label: 'Kolonihave' },
      { id: 'sommerhushave', label: 'Sommerhushave' },
      { id: 'indendoers',    label: 'Indendørs' },
      { id: 'vinduskarm',    label: 'Vinduskarm' },
      { id: 'tagterrasse',   label: 'Tagterrasse' },
      { id: 'hydroponics',   label: 'Hydroponics' },
    ],
  },
  {
    id: 'stil',
    label: 'Stil',
    tags: [
      { id: 'oekologisk',     label: 'Økologisk' },
      { id: 'permakultur',    label: 'Permakultur' },
      { id: 'no_dig',         label: 'No-dig' },
      { id: 'vild_med_vilje', label: 'Vild med vilje' },
      { id: 'bivenlig',       label: 'Bi-venlig' },
      { id: 'selvforsyning',  label: 'Selvforsyning' },
      { id: 'skaerehave',     label: 'Skærehave' },
      { id: 'hoejbede',       label: 'Højbede' },
      { id: 'samdyrkning',    label: 'Samdyrkning' },
      { id: 'skovhave',       label: 'Skovhave' },
      { id: 'biodynamisk',    label: 'Biodynamisk' },
    ],
  },
  {
    id: 'niveau_emne',
    label: 'Niveau & emne',
    tags: [
      { id: 'begyndere',         label: 'Begyndere' },
      { id: 'oevede',            label: 'Øvede' },
      { id: 'boernevenlig',      label: 'Børnevenlig' },
      { id: 'froebytte',         label: 'Frøbytte' },
      { id: 'froesamling',       label: 'Frøsamling' },
      { id: 'sjaeldne_sorter',   label: 'Sjældne sorter' },
      { id: 'gamle_sorter',      label: 'Gamle sorter' },
      { id: 'plantesygdomme',    label: 'Plantesygdomme' },
      { id: 'kompost_jord',      label: 'Kompost & jord' },
      { id: 'forspiring',        label: 'Forspiring' },
      { id: 'beskaering',        label: 'Beskæring' },
      { id: 'krukker',           label: 'Krukke-dyrkning' },
      { id: 'vintergroent',      label: 'Vintergrønt' },
      { id: 'hoest_madlavning',  label: 'Høst & madlavning' },
      { id: 'haveprojekter',     label: 'Haveprojekter' },
    ],
  },
] as const

export type TagAxisId = typeof TAG_AXES[number]['id']
export type TagId = typeof TAG_AXES[number]['tags'][number]['id']

// Flat lookup-map for label → tag-id, så vi kan vise label uden at iterere
export const TAG_LABEL_BY_ID: Record<string, string> = TAG_AXES.reduce<Record<string, string>>(
  (acc, axis) => {
    for (const t of axis.tags) acc[t.id] = t.label
    return acc
  },
  {},
)

export const TAG_AXIS_BY_TAG_ID: Record<string, TagAxisId> = TAG_AXES.reduce<Record<string, TagAxisId>>(
  (acc, axis) => {
    for (const t of axis.tags) acc[t.id] = axis.id
    return acc
  },
  {},
)

export const VISIBILITY_LABEL: Record<'open' | 'closed' | 'hidden', string> = {
  open:   'Åben',
  closed: 'Lukket',
  hidden: 'Skjult',
}

export const FORUM_POST_TYPES = [
  { id: 'question',   label: 'Spørgsmål',   icon: 'HelpCircle' },
  { id: 'tip',        label: 'Tip',         icon: 'Sparkles' },
  { id: 'experience', label: 'Erfaring',    icon: 'BookOpen' },
  { id: 'problem',    label: 'Problem',     icon: 'AlertTriangle' },
  { id: 'seed_swap',  label: 'Frøbytte',    icon: 'Gift' },
  { id: 'image',      label: 'Billede',     icon: 'Image' },
  { id: 'guide',      label: 'Guide',       icon: 'BookMarked' },
] as const

export type ForumPostType = typeof FORUM_POST_TYPES[number]['id']

export const FORUM_CATEGORIES = [
  { id: 'generelt',     label: 'Generelt' },
  { id: 'begyndere',    label: 'Begynderspørgsmål' },
  { id: 'spiring',      label: 'Spiring' },
  { id: 'lys_varme',    label: 'Lys og varme' },
  { id: 'sorter',       label: 'Sorter' },
  { id: 'sygdomme',     label: 'Sygdomme og skadedyr' },
  { id: 'froebytte',    label: 'Frøbytte' },
  { id: 'vis_dyrkning', label: 'Vis din dyrkning' },
  { id: 'hoest',        label: 'Høst og brug' },
] as const

export type ForumCategoryId = typeof FORUM_CATEGORIES[number]['id']
