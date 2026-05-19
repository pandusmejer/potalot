/**
 * "Denne uge i haven" — personaliserede anbefalinger.
 *
 * Kobler brugerens frøbank + aktive planter + aktuel sæson til konkrete
 * handlinger. Det er PotAlots kerne-feature: ikke "her er alle dine
 * planter", men "her er hvad du bør gøre lige nu".
 *
 * Ren funktion uden DB-kald — kaldes med allerede-hentet data.
 */

import type { InventoryItem, Plant, PlantStatus } from './types'
import type { GardenAlert } from '@/actions/weather'
import { saeson } from './datetime'

export type SuggestionKind = 'sow' | 'plant_out' | 'harvest' | 'tend'

export interface WeekSuggestion {
  id: string
  kind: SuggestionKind
  /** Lucide-ikon-navn */
  icon: 'Sprout' | 'TreePine' | 'Wheat' | 'Droplets' | 'Scissors' | 'Leaf'
  title: string
  detail: string
  /** Hvor brugeren sendes hen ved klik */
  href: string
  /** Sorterings-vægt — højere = mere presserende */
  weight: number
}

const KIND_META: Record<SuggestionKind, { icon: WeekSuggestion['icon']; weight: number }> = {
  sow: { icon: 'Sprout', weight: 80 },
  plant_out: { icon: 'TreePine', weight: 90 },
  harvest: { icon: 'Wheat', weight: 95 },
  tend: { icon: 'Droplets', weight: 60 },
}

function dageSiden(iso: string): number {
  const d = new Date(iso)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / 86400000)
}

/**
 * Beregn ugens anbefalinger for en given måned.
 * Returnerer maks 5, sorteret efter presserende-hed.
 */
export function computeWeekSuggestions(
  inventory: InventoryItem[],
  plants: Plant[],
  month: number
): WeekSuggestion[] {
  const out: WeekSuggestion[] = []
  const activePlants = plants.filter(p => !p.isArchived)

  // Hvilke sorter har brugeren allerede aktive? (undgå at foreslå "så X"
  // hvis X allerede er i jorden)
  const activeKeys = new Set(
    activePlants.map(p => `${p.name.toLowerCase().trim()}|${(p.variety ?? '').toLowerCase().trim()}`)
  )

  // ---- Fra frøbank: såning / udplantning denne måned ----
  for (const item of inventory) {
    const key = `${item.name.toLowerCase().trim()}|${(item.variety ?? '').toLowerCase().trim()}`
    const navn = item.variety ? `${item.name} — ${item.variety}` : item.name

    if (item.sowingMonths?.includes(month) && !activeKeys.has(key)) {
      out.push({
        id: `sow-${item.id}`,
        kind: 'sow',
        icon: KIND_META.sow.icon,
        title: item.preCultivation ? `Forspir ${navn}` : `Så ${navn}`,
        detail: item.preCultivation
          ? 'Frøbanken siger forspiring denne måned.'
          : 'Frøbanken siger såning denne måned.',
        href: '/mine-planter',
        weight: KIND_META.sow.weight,
      })
    } else if (item.plantingOutMonths?.includes(month) && !activeKeys.has(key)) {
      out.push({
        id: `plantout-${item.id}`,
        kind: 'plant_out',
        icon: KIND_META.plant_out.icon,
        title: `Plant ${navn} ud`,
        detail: 'Frøbanken siger udplantning denne måned.',
        href: '/mine-planter',
        weight: KIND_META.plant_out.weight,
      })
    } else if (item.harvestMonths?.includes(month)) {
      out.push({
        id: `harvest-${item.id}`,
        kind: 'harvest',
        icon: KIND_META.harvest.icon,
        title: `${navn} kan høstes`,
        detail: 'Frøbanken siger høst-måned.',
        href: '/mine-planter',
        weight: KIND_META.harvest.weight - 10, // lavere end faktisk-høstklar plante
      })
    }
  }

  // ---- Fra aktive planter: pleje baseret på stadie ----
  for (const p of activePlants) {
    const navn = p.variety ? `${p.name} — ${p.variety}` : p.name
    const href = `/mine-planter/${p.id}`
    const status: PlantStatus = p.status

    if (status === 'hoestklar') {
      out.push({
        id: `tend-harvest-${p.id}`,
        kind: 'harvest',
        icon: KIND_META.harvest.icon,
        title: `Høst ${navn}`,
        detail: 'Planten er markeret høstklar.',
        href,
        weight: KIND_META.harvest.weight,
      })
    } else if (status === 'klar_til_udplantning') {
      out.push({
        id: `tend-plantout-${p.id}`,
        kind: 'plant_out',
        icon: KIND_META.plant_out.icon,
        title: `Udplant ${navn}`,
        detail: 'Planten er klar til at komme i jorden.',
        href,
        weight: KIND_META.plant_out.weight,
      })
    } else if (status === 'saaet' && p.sowDate && dageSiden(p.sowDate) >= 21) {
      out.push({
        id: `tend-germ-${p.id}`,
        kind: 'tend',
        icon: 'Leaf',
        title: `Tjek spiring på ${navn}`,
        detail: `Sået for ${dageSiden(p.sowDate)} dage siden — burde være spiret nu.`,
        href,
        weight: 70,
      })
    } else if (status === 'udplantet') {
      out.push({
        id: `tend-water-${p.id}`,
        kind: 'tend',
        icon: 'Droplets',
        title: `Tilse ${navn}`,
        detail: 'Udplantet — tjek vanding og opbinding.',
        href,
        weight: KIND_META.tend.weight,
      })
    }
  }

  // Dedup på title (frøbank + plante kan overlappe), sortér, top 5
  const seen = new Set<string>()
  return out
    .sort((a, b) => b.weight - a.weight)
    .filter(s => {
      if (seen.has(s.title)) return false
      seen.add(s.title)
      return true
    })
    .slice(0, 5)
}

/* ------------------------------------------------------------------
 * Uge-overblik — ÉN tydelig primær handling + 2–4 mindre
 * observationer. Svarer på "hvad er det vigtigste jeg bør gøre
 * i haven denne uge?". Bygger på data (frøbank/planter/vejr) og
 * falder tilbage på sæsonlogik, så der ALTID er en primær handling.
 * ------------------------------------------------------------------ */

export type OverviewIcon =
  | 'frost' | 'sun' | 'rain' | 'wind'
  | 'sprout' | 'harvest' | 'water' | 'leaf'
  | 'plan' | 'pest'

export interface OverviewRow {
  icon: OverviewIcon
  primary: string
  secondary?: string
}

export interface PrimaryAction {
  icon: OverviewIcon
  label: string
  headline: string
  body: string
  cta: { label: string; href: string }
}

export interface WeekOverview {
  primary: PrimaryAction
  secondary: OverviewRow[]
}

const ALERT_ICON: Record<GardenAlert['icon'], OverviewIcon> = {
  Snowflake: 'frost', Sun: 'sun', CloudRain: 'rain', Wind: 'wind',
}

const SUGGESTION_ICON: Record<SuggestionKind, OverviewIcon> = {
  sow: 'sprout', plant_out: 'sprout', harvest: 'harvest', tend: 'water',
}

const SUGGESTION_CTA: Record<SuggestionKind, string> = {
  sow: 'Start såning', plant_out: 'Plant ud', harvest: 'Til høst', tend: 'Se planten',
}

type Season = ReturnType<typeof saeson>

// Sæson-fallback: en konkret primær handling pr. sæson, så der
// ALTID er ét tydeligt "gør dette" — også med tom frøbank/uden vejr.
const SEASON_PRIMARY: Record<Season, PrimaryAction> = {
  'Forår': {
    icon: 'sprout',
    label: 'Ugens moment',
    headline: 'Så direkte: rødbede, salat og spinat',
    body: 'Jorden er varm nok, og majregnen hjælper spiringen.',
    cta: { label: 'Start såning', href: '/froebank' },
  },
  'Sommer': {
    icon: 'water',
    label: 'Ugens moment',
    headline: 'Hold vandingen i top denne uge',
    body: 'Drivhus og krukker tørrer hurtigt ud — vand dybt morgen eller aften.',
    cta: { label: 'Se gøremål', href: '#aarshjul' },
  },
  'Efterår': {
    icon: 'harvest',
    label: 'Ugens moment',
    headline: 'Få den sidste store høst i hus',
    body: 'Det modne skal ind, før nattekulden sætter ind for alvor.',
    cta: { label: 'Se gøremål', href: '#aarshjul' },
  },
  'Vinter': {
    icon: 'plan',
    label: 'Ugens moment',
    headline: 'Læg næste sæsons så-plan',
    body: 'Rolig uge i haven — den bedste tid til at planlægge og forkultivere.',
    cta: { label: 'Planlæg sæson', href: '#aarshjul' },
  },
}

// Sæson-pulje af mindre observationer (min. 3 pr. sæson) så de
// sekundære punkter altid kan fyldes op.
const SEASON_SECONDARY: Record<Season, OverviewRow[]> = {
  'Forår': [
    { icon: 'sun', primary: 'Perfekt jordtemperatur denne uge', secondary: 'Ideelt til direkte såning af de hårdføre' },
    { icon: 'pest', primary: 'Sneglene begynder at røre på sig', secondary: 'Tjek bedene tidlig morgen og sen aften' },
    { icon: 'water', primary: 'Drivhuset tørrer hurtigt ud i solen', secondary: 'Hold øje med vandingen på lune dage' },
    { icon: 'leaf', primary: 'Tid til første gødning', secondary: 'Giv bede og krukker en omgang næring' },
  ],
  'Sommer': [
    { icon: 'harvest', primary: 'Løbende høst holder planterne i gang', secondary: 'Pluk ofte — især ærter, bønner og salat' },
    { icon: 'pest', primary: 'Bladlus og snegle topper i varmen', secondary: 'Tjek undersiden af bladene' },
    { icon: 'sprout', primary: 'Stadig tid til efterårsafgrøder', secondary: 'Så grønkål, pak choi og vinterportulak' },
    { icon: 'sun', primary: 'Skyg sart sået jord', secondary: 'Undgå udtørring i højsommerlyset' },
  ],
  'Efterår': [
    { icon: 'leaf', primary: 'Saml blade til løvkompost', secondary: 'Gratis jordforbedring til næste år' },
    { icon: 'sprout', primary: 'Dæk bedene til vinter', secondary: 'Grøngødning eller et lag kompost' },
    { icon: 'frost', primary: 'Hold øje med første nattefrost', secondary: 'Få det sarte ind eller dækket til' },
    { icon: 'plan', primary: 'Evaluér sæsonen', secondary: 'Notér hvad der lykkedes — og hvad ikke' },
  ],
  'Vinter': [
    { icon: 'sprout', primary: 'Tidlig forkultivering kan begynde', secondary: 'Chili og aubergine vil have et forspring' },
    { icon: 'frost', primary: 'Frost-vagt: tjek krukker og kar', secondary: 'Sårbare rødder kan trænge til dække' },
    { icon: 'plan', primary: 'Gennemgå frøbanken', secondary: 'Bestil det du mangler til foråret' },
    { icon: 'leaf', primary: 'Hold ro i haven', secondary: 'Livet under overfladen arbejder videre' },
  ],
}

/**
 * Byg ugens overblik: ÉN primær handling (data-drevet hvis muligt,
 * ellers sæson-fallback) + 2–4 mindre observationer (vejr → øvrige
 * plante-status → sæson), deduppet på tekst.
 */
export function computeWeekOverview(
  suggestions: WeekSuggestion[],
  alerts: GardenAlert[],
  month: number
): WeekOverview {
  const season = saeson(month)

  // Primær: øverste konkrete plante-handling hvis der er data,
  // ellers sæsonens fallback-handling.
  let primary: PrimaryAction
  let restSuggestions: WeekSuggestion[]
  if (suggestions.length > 0) {
    const top = suggestions[0]
    primary = {
      icon: SUGGESTION_ICON[top.kind],
      label: 'Ugens moment',
      headline: top.title,
      body: top.detail,
      cta: { label: SUGGESTION_CTA[top.kind], href: top.href },
    }
    restSuggestions = suggestions.slice(1)
  } else {
    primary = SEASON_PRIMARY[season]
    restSuggestions = []
  }

  const harHandlinger = alerts.length > 0 || suggestions.length > 0

  // Sekundære: vejr (advarsler først) → øvrige plante-status →
  // sæson-observationer. Dedup, og aldrig en dublet af den primære.
  const secondary: OverviewRow[] = []
  const seen = new Set<string>([primary.headline])
  const push = (r: OverviewRow) => {
    if (secondary.length >= 4 || seen.has(r.primary)) return
    seen.add(r.primary)
    secondary.push(r)
  }

  ;[...alerts]
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'warning' ? -1 : 1))
    .forEach(a => push({ icon: ALERT_ICON[a.icon], primary: a.title, secondary: a.detail }))

  restSuggestions.forEach(s =>
    push({ icon: SUGGESTION_ICON[s.kind], primary: s.title, secondary: s.detail })
  )

  SEASON_SECONDARY[season].forEach(push)

  // Hold det stramt: 3 når det er ren sæson-fallback, op til 4 med data.
  return { primary, secondary: secondary.slice(0, harHandlinger ? 4 : 3) }
}
