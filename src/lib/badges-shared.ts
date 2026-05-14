// Foruddefinerede badges. Tildeles via lib/badge-rules.ts når events sker.

export type BadgeId =
  // Sociale (eksisterende)
  | 'first_post'
  | 'helpful'           // markeret som bedste svar
  | 'seed_keeper'       // har frø til bytte (har lavet et frøbytte-tilbud)
  | 'community_starter' // oprettet en gruppe
  | 'green_thumb'       // dyrker mindst 3 sorter
  | 'curator'           // tilføjet 5 sorter til en gruppe
  // Dyrkning / lifecycle (eksisterende)
  | 'first_sowing'      // første plante sået
  | 'first_harvest'     // første høst
  | 'season_finisher'   // første plante med status='afsluttet'
  | 'the_collector'     // 25+ items i frøbank
  | 'master_apprentice' // har klonet en master-guide til personlig version
  // Genre-specifikke (nye)
  | 'tomato_master'     // 3+ tomat-sorter
  | 'chili_lord'        // 3+ chili-sorter
  | 'herb_keeper'       // 5+ krydderurter
  | 'altan_grower'      // 5+ planter på altan
  | 'drivhus_keeper'    // 5+ planter i drivhus
  // Samler / diversitet (nye)
  | 'fifty_varieties'   // 50+ items totalt
  | 'perennial_keeper'  // 5+ flerårige (knolde/buske/træer)
  | 'biodiversity_friend' // 5+ forskellige plante-kategorier
  // Læring (nye)
  | 'monthly_logger'    // log-aktivitet i 12 forskellige måneder
  | 'autobiograf'       // 10+ private noter på guides
  // Hemmelige med humor (nye, secret: true)
  | 'slagteren'         // 3+ planter afsluttet under 30 dage
  | 'hasarderen'        // sået varmekrævende før 1. marts
  | 'sneglefaelleren'   // 3+ pest_disease-logs
  // Sæson-deltagelse (secret: true, en pr. challenge-slug)
  | 's_altankassen_vaagner'
  | 's_forspirings_marts'
  | 's_tomatmaj'
  | 's_plant_for_bierne'
  | 's_foerste_tomat_i_hus'
  | 's_snegle_saesonen'
  | 's_hoest_uge'
  | 's_efteraarsklargoering'
  | 's_froesamler'
  | 's_vinterhvile'

export interface BadgeMeta {
  id: BadgeId
  label: string
  description: string
  hint?: string
  icon:
    | 'Sparkles' | 'Award' | 'Gift' | 'Users' | 'Sprout' | 'BookOpen'
    | 'Leaf' | 'Wheat' | 'Flag' | 'Package' | 'GitFork'
    | 'Flame' | 'Apple' | 'Home' | 'TreePine' | 'Library' | 'Globe'
    | 'PencilLine' | 'Skull' | 'Snowflake' | 'Bug' | 'Flower2'
  color: 'green' | 'amber' | 'blue' | 'purple'
  category: 'social' | 'dyrkning' | 'samler' | 'laering' | 'saeson'
  /** Hemmelige badges vises ikke i låst-tilstand — kun når optjent. */
  secret?: boolean
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
  tomato_master: {
    id: 'tomato_master',
    label: 'Tomatekspert',
    description: 'Dyrker eller har dyrket 3 eller flere tomatsorter.',
    hint: 'Aktivér 3 forskellige tomat-planter.',
    icon: 'Apple',
    color: 'amber',
    category: 'dyrkning',
  },
  chili_lord: {
    id: 'chili_lord',
    label: 'Chilihoved',
    description: 'Dyrker eller har dyrket 3 eller flere chilisorter.',
    hint: 'Aktivér 3 forskellige chili-planter.',
    icon: 'Flame',
    color: 'amber',
    category: 'dyrkning',
  },
  herb_keeper: {
    id: 'herb_keeper',
    label: 'Krydderurtevogter',
    description: 'Har 5 eller flere krydderurter i sit dyrkningsspor.',
    hint: 'Aktivér 5 forskellige krydderurter (basilikum, persille, mynte, oregano osv.).',
    icon: 'Leaf',
    color: 'green',
    category: 'dyrkning',
  },
  altan_grower: {
    id: 'altan_grower',
    label: 'Altanbonde',
    description: 'Dyrker 5 eller flere planter på altan eller balkon.',
    hint: 'Aktivér planter med "altan" eller "balkon" i placering.',
    icon: 'Home',
    color: 'blue',
    category: 'dyrkning',
  },
  drivhus_keeper: {
    id: 'drivhus_keeper',
    label: 'Drivhusvogter',
    description: 'Dyrker 5 eller flere planter i drivhus.',
    hint: 'Aktivér planter med "drivhus" i placering.',
    icon: 'TreePine',
    color: 'green',
    category: 'dyrkning',
  },

  // Samler / diversitet
  the_collector: {
    id: 'the_collector',
    label: 'Frøhamstrer',
    description: 'Har 25 eller flere items i frøbanken.',
    hint: 'Tilføj frøposer, knolde eller stiklinger til frøbanken.',
    icon: 'Package',
    color: 'amber',
    category: 'samler',
  },
  fifty_varieties: {
    id: 'fifty_varieties',
    label: 'Sortsamler',
    description: '50 eller flere sorter i din samling.',
    hint: 'Voks din frøbank til 50+ unikke sorter.',
    icon: 'Library',
    color: 'amber',
    category: 'samler',
  },
  perennial_keeper: {
    id: 'perennial_keeper',
    label: 'Knoldsamler',
    description: '5 eller flere flerårige planter (knolde, buske, træer).',
    hint: 'Tilføj knolde, buske eller træer til frøbanken.',
    icon: 'TreePine',
    color: 'green',
    category: 'samler',
  },
  biodiversity_friend: {
    id: 'biodiversity_friend',
    label: 'Biodiversitetsven',
    description: 'Dyrker eller samler i 5 forskellige plante-kategorier.',
    hint: 'Variér mellem frø, løg, knolde, buske, stauder osv.',
    icon: 'Globe',
    color: 'green',
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
  monthly_logger: {
    id: 'monthly_logger',
    label: 'Månedlig logfører',
    description: 'Har logget aktivitet i alle 12 årets måneder.',
    hint: 'Skriv mindst én log pr. måned gennem et helt år.',
    icon: 'PencilLine',
    color: 'blue',
    category: 'laering',
  },
  autobiograf: {
    id: 'autobiograf',
    label: 'Autobiograf',
    description: '10 eller flere private noter på guides.',
    hint: 'Skriv private noter på dyrkningsguides.',
    icon: 'BookOpen',
    color: 'blue',
    category: 'laering',
  },

  // Hemmelige med humor (secret: true — vises ikke før de er optjent)
  slagteren: {
    id: 'slagteren',
    label: 'Slagteren',
    description: 'Tre eller flere planter er gået bort før de nåede 30 dage. Lad det være et hilsen til de faldne.',
    icon: 'Skull',
    color: 'purple',
    category: 'dyrkning',
    secret: true,
  },
  hasarderen: {
    id: 'hasarderen',
    label: 'Hasarderen',
    description: 'Har sået en frostfølsom plante før 1. marts. Mod eller dumdristighed — sjælden grænse.',
    icon: 'Snowflake',
    color: 'blue',
    category: 'dyrkning',
    secret: true,
  },
  sneglefaelleren: {
    id: 'sneglefaelleren',
    label: 'Sneglefælleren',
    description: 'Har logget skadedyr- eller sygdomshændelser 3 eller flere gange. En haveformand kender sin fjende.',
    icon: 'Bug',
    color: 'amber',
    category: 'dyrkning',
    secret: true,
  },

  // Sæson-deltagelse — tildeles ved bidrag til en sæson-challenge.
  // Alle har secret: true så de kun dukker op i galleri når optjent.
  s_altankassen_vaagner: {
    id: 's_altankassen_vaagner',
    label: 'Altankassen vågner',
    description: 'Deltog i april-sæsonen — balkonen kom i drift igen.',
    icon: 'Home',
    color: 'blue',
    category: 'saeson',
    secret: true,
  },
  s_forspirings_marts: {
    id: 's_forspirings_marts',
    label: 'Forspirings-marts',
    description: 'Deltog i marts-sæsonen — forspirede mens vinteren slap.',
    icon: 'Sprout',
    color: 'green',
    category: 'saeson',
    secret: true,
  },
  s_tomatmaj: {
    id: 's_tomatmaj',
    label: 'Tomatmaj',
    description: 'Deltog i maj-sæsonen — tomatplanterne ud i frisk jord.',
    icon: 'Apple',
    color: 'amber',
    category: 'saeson',
    secret: true,
  },
  s_plant_for_bierne: {
    id: 's_plant_for_bierne',
    label: 'For bierne',
    description: 'Deltog i maj-sæsonen — gav en plads til de vilde bestøvere.',
    icon: 'Flower2',
    color: 'amber',
    category: 'saeson',
    secret: true,
  },
  s_foerste_tomat_i_hus: {
    id: 's_foerste_tomat_i_hus',
    label: 'Første tomat',
    description: 'Deltog i juli-sæsonen — fejrede sommerens første modne tomat.',
    icon: 'Apple',
    color: 'amber',
    category: 'saeson',
    secret: true,
  },
  s_snegle_saesonen: {
    id: 's_snegle_saesonen',
    label: 'Snegleveteran',
    description: 'Deltog i juli-sæsonen — overlevede sneglenes festmåned.',
    icon: 'Bug',
    color: 'green',
    category: 'saeson',
    secret: true,
  },
  s_hoest_uge: {
    id: 's_hoest_uge',
    label: 'Høst-ugen',
    description: 'Deltog i august-sæsonen — spiste fra haven 7 dage i træk.',
    icon: 'Wheat',
    color: 'amber',
    category: 'saeson',
    secret: true,
  },
  s_efteraarsklargoering: {
    id: 's_efteraarsklargoering',
    label: 'Efterårsklargøring',
    description: 'Deltog i oktober-sæsonen — ryddede, tækkede, bevarede.',
    icon: 'Leaf',
    color: 'amber',
    category: 'saeson',
    secret: true,
  },
  s_froesamler: {
    id: 's_froesamler',
    label: 'Frø til næste år',
    description: 'Deltog i september-sæsonen — gemte frø fra egen høst.',
    icon: 'Package',
    color: 'green',
    category: 'saeson',
    secret: true,
  },
  s_vinterhvile: {
    id: 's_vinterhvile',
    label: 'Vinterhvile',
    description: 'Deltog i januar-sæsonen — drømte næste sæson på plads.',
    icon: 'Snowflake',
    color: 'blue',
    category: 'saeson',
    secret: true,
  },
}

export const BADGE_LIST = Object.values(BADGES)

export const BADGE_CATEGORY_LABELS: Record<BadgeMeta['category'], string> = {
  saeson: 'Sæson',
  social: 'Fællesskab',
  dyrkning: 'Dyrkning',
  samler: 'Samler',
  laering: 'Læring',
}
