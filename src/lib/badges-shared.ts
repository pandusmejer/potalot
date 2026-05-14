// Foruddefinerede badges. Tildeles via lib/badge-rules.ts når events sker.

export type BadgeId =
  // Sociale (eksisterende)
  | 'first_post'
  | 'helpful'           // markeret som bedste svar
  | 'seed_keeper'       // har frø til bytte (har lavet et frøbytte-tilbud)
  | 'community_starter' // oprettet en gruppe
  | 'green_thumb'       // dyrker mindst 3 sorter
  | 'curator'           // tilføjet 5 sorter til en gruppe
  // Dyrkning / lifecycle (nye)
  | 'first_sowing'      // første plante sået
  | 'first_harvest'     // første høst
  | 'season_finisher'   // første plante med status='afsluttet'
  | 'the_collector'     // 25+ items i frøbank
  | 'master_apprentice' // har klonet en master-guide til personlig version

export interface BadgeMeta {
  id: BadgeId
  label: string
  description: string
  hint?: string
  icon:
    | 'Sparkles' | 'Award' | 'Gift' | 'Users' | 'Sprout' | 'BookOpen'
    | 'Leaf' | 'Wheat' | 'Flag' | 'Package' | 'GitFork'
  color: 'green' | 'amber' | 'blue' | 'purple'
  category: 'social' | 'dyrkning' | 'samler' | 'laering'
}

export const BADGES: Record<BadgeId, BadgeMeta> = {
  // Sociale
  first_post: {
    id: 'first_post',
    label: 'Første opslag',
    description: 'Skrev sit første forum-opslag.',
    hint: 'Lav et opslag i en gruppes forum.',
    icon: 'Sparkles',
    color: 'blue',
    category: 'social',
  },
  helpful: {
    id: 'helpful',
    label: 'Hjælpsom',
    description: 'Et af deres svar blev markeret som bedste svar.',
    hint: 'Svar på et forum-opslag — og bliv valgt som bedste svar.',
    icon: 'Award',
    color: 'amber',
    category: 'social',
  },
  seed_keeper: {
    id: 'seed_keeper',
    label: 'Frøvogter',
    description: 'Tilbyder frø til bytte i en gruppe.',
    hint: 'Læg et frøbytte-tilbud op i en gruppe.',
    icon: 'Gift',
    color: 'green',
    category: 'social',
  },
  community_starter: {
    id: 'community_starter',
    label: 'Pioner',
    description: 'Oprettede sin første gruppe.',
    hint: 'Opret en gruppe under /grupper.',
    icon: 'Users',
    color: 'purple',
    category: 'social',
  },
  green_thumb: {
    id: 'green_thumb',
    label: 'Grønne fingre',
    description: 'Dyrker mindst 3 sorter på tværs af grupper.',
    hint: 'Marker dig som dyrker af 3 sorter i grupperne.',
    icon: 'Sprout',
    color: 'green',
    category: 'social',
  },
  curator: {
    id: 'curator',
    label: 'Kurator',
    description: 'Tilføjede 5 sorter til en gruppe.',
    hint: 'Tilføj sorter til en gruppes katalog.',
    icon: 'BookOpen',
    color: 'amber',
    category: 'social',
  },

  // Dyrkning / lifecycle
  first_sowing: {
    id: 'first_sowing',
    label: 'Første gang i jorden',
    description: 'Den første plante er sået.',
    hint: 'Aktivér en plante fra frøbanken eller log en såning.',
    icon: 'Sprout',
    color: 'green',
    category: 'dyrkning',
  },
  first_harvest: {
    id: 'first_harvest',
    label: 'Første høst',
    description: 'Første plante har nået høstklar — eller du har logget en høst.',
    hint: 'Log en høst eller skift plantens stadie til Høstklar.',
    icon: 'Wheat',
    color: 'amber',
    category: 'dyrkning',
  },
  season_finisher: {
    id: 'season_finisher',
    label: 'Hele vejen rundt',
    description: 'En plante er ført gennem hele sin sæson til afsluttet.',
    hint: 'Arkivér en plante når sæsonen er slut.',
    icon: 'Flag',
    color: 'purple',
    category: 'dyrkning',
  },

  // Samler
  the_collector: {
    id: 'the_collector',
    label: 'Frøhamstrer',
    description: 'Har 25 eller flere items i frøbanken.',
    hint: 'Tilføj frøposer, knolde eller stiklinger til frøbanken.',
    icon: 'Package',
    color: 'amber',
    category: 'samler',
  },

  // Læring
  master_apprentice: {
    id: 'master_apprentice',
    label: 'Lærling',
    description: 'Har klonet en master-guide til en personlig version.',
    hint: 'Find en master-guide og vælg "Lav min egen version".',
    icon: 'GitFork',
    color: 'blue',
    category: 'laering',
  },
}

export const BADGE_LIST = Object.values(BADGES)

export const BADGE_CATEGORY_LABELS: Record<BadgeMeta['category'], string> = {
  social: 'Fællesskab',
  dyrkning: 'Dyrkning',
  samler: 'Samler',
  laering: 'Læring',
}
