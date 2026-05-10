// Foruddefinerede badges. Tildeles via lib/badge-rules.ts når events sker.

export type BadgeId =
  | 'first_post'
  | 'helpful'           // markeret som bedste svar
  | 'seed_keeper'       // har frø til bytte (har lavet et frøbytte-tilbud)
  | 'community_starter' // oprettet en gruppe
  | 'green_thumb'       // dyrker mindst 3 sorter
  | 'curator'           // tilføjet 5 sorter til en gruppe

export interface BadgeMeta {
  id: BadgeId
  label: string
  description: string
  icon: 'Sparkles' | 'Award' | 'Gift' | 'Users' | 'Sprout' | 'BookOpen'
  color: 'green' | 'amber' | 'blue' | 'purple'
}

export const BADGES: Record<BadgeId, BadgeMeta> = {
  first_post: {
    id: 'first_post',
    label: 'Første opslag',
    description: 'Skrev sit første forum-opslag.',
    icon: 'Sparkles',
    color: 'blue',
  },
  helpful: {
    id: 'helpful',
    label: 'Hjælpsom',
    description: 'Et af deres svar blev markeret som bedste svar.',
    icon: 'Award',
    color: 'amber',
  },
  seed_keeper: {
    id: 'seed_keeper',
    label: 'Frøvogter',
    description: 'Tilbyder frø til bytte i en gruppe.',
    icon: 'Gift',
    color: 'green',
  },
  community_starter: {
    id: 'community_starter',
    label: 'Pioner',
    description: 'Oprettede sin første gruppe.',
    icon: 'Users',
    color: 'purple',
  },
  green_thumb: {
    id: 'green_thumb',
    label: 'Grønne fingre',
    description: 'Dyrker mindst 3 sorter på tværs af grupper.',
    icon: 'Sprout',
    color: 'green',
  },
  curator: {
    id: 'curator',
    label: 'Kurator',
    description: 'Tilføjede 5 sorter til en gruppe.',
    icon: 'BookOpen',
    color: 'amber',
  },
}

export const BADGE_LIST = Object.values(BADGES)
