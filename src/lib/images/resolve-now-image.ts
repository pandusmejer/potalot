/**
 * resolveNowImage — billed-resolver for "Lige nu"-kortet på plantesiden.
 *
 * Anna's princip (juni 2026): ikke ét makrofoto pr. sort (billedinflation),
 * men en RESOLVER der vælger det bedst egnede makro ud fra sort, art, fase
 * og motivrolle — med sikker crossover når motivet er generisk nok.
 *
 * Prioritet:
 *   1. Sort-specifikt makro der matcher rolle/fase
 *   2. Arts-specifikt makro der matcher rolle/fase
 *   3. Sikkert plantefamilie-/fasegenerisk makro
 *   4. (håndteres af kalderen) plantekort-foto
 *   5. (håndteres af kalderen) botanisk placeholder
 *
 * SIKKERHEDSREGLER (Anna):
 *   - Frugt/frø deler ALDRIG på tværs af sort (sortsspecifik form/farve).
 *   - Blomst/blad/struktur/atmosfære deles inden for samme art.
 *   - Frugt-makro fra én art må aldrig vises for en anden art.
 *
 * ÉN KILDE: kataloget bygges ved at BERIGE de eksisterende makroer i
 * POTALOT_IMAGE_SETS_BY_ID — ingen dublerede billed-lister, ingen nye
 * filer pr. sort. Metadata (roller/stadier/shareScope/priority) udledes
 * af makroens rolle; art/sort parses af set-nøglen (species-variety-slug).
 *
 * Bruges KUN af "Lige nu" indtil videre (ikke en generel refaktor).
 */

import { POTALOT_IMAGE_SETS_BY_ID } from '@/data/potalot-image-sets'
import { IMAGE_MANIFEST } from '@/data/image-manifest.generated'
import type { MacroRole } from './types'
import type { PlantStatus } from '@/lib/types'

// ─── Typer ─────────────────────────────────────────────────────

/** Hvad "Lige nu" handler om — afgør hvilke motivroller der søges. */
export type NowType =
  | 'sown' | 'germination' | 'vegetative' | 'flowering'
  | 'fruiting' | 'harvest' | 'care' | 'problem'

/** Hvor bredt et makro må genbruges. */
export type ShareScope = 'variety' | 'species' | 'plantFamily' | 'stageGeneric' | 'global'

/** Motivroller (rigere end MacroRole — flere kan ramme samme billede). */
export type NowRole =
  | 'flower' | 'bud' | 'fruit' | 'harvest' | 'leaf' | 'stem' | 'structure'
  | 'seedling' | 'soil' | 'watering' | 'growth' | 'seed' | 'detail'
  | 'atmosphere' | 'now-card'

interface NowMacro {
  src: string
  alt: string
  speciesSlug: string
  varietySlug: string | null
  plantFamily: string | null
  roles: NowRole[]
  stages: PlantStatus[]
  shareScope: ShareScope
  objectPosition?: string
  priority: number
}

export interface NowImageContext {
  speciesSlug: string | null
  varietySlug: string | null
  plantFamily?: string | null
  stage: PlantStatus
  nowType: NowType
}

export interface NowImageResult {
  src: string
  alt: string
  objectPosition?: string
}

// ─── Afledninger fra makroens rolle ────────────────────────────

const focalPosition: Record<string, string> = {
  center: '50% 50%',
  top: '50% 28%',
  bottom: '50% 72%',
  left: '35% 50%',
  right: '65% 50%',
}

/** Art → plantefamilie (kun til meget generiske motiver). */
const SPECIES_FAMILY: Record<string, string> = {
  tomat: 'solanaceae',
  chili: 'solanaceae',
  peberfrugt: 'solanaceae',
  aubergine: 'solanaceae',
  kartoffel: 'solanaceae',
  agurk: 'cucurbitaceae',
  squash: 'cucurbitaceae',
  graeskar: 'cucurbitaceae',
  melon: 'cucurbitaceae',
  dahlia: 'asteraceae',
  salat: 'asteraceae',
  stangboenne: 'fabaceae',
  boenne: 'fabaceae',
  aert: 'fabaceae',
}

/**
 * shareScope pr. rolle. Frugt/frø/detalje viser sortsidentitet (form,
 * farve, overflade) → låst til sorten. Blomst/blad/struktur/atmosfære
 * er typisk artsgenerisk → deles inden for arten.
 */
function shareScopeForRole(role: MacroRole): ShareScope {
  switch (role) {
    case 'fruit':
    case 'seed':
    case 'detail':
      return 'variety'
    default:
      return 'species'
  }
}

function nowRolesForRole(role: MacroRole): NowRole[] {
  switch (role) {
    case 'atmosphere': return ['atmosphere', 'leaf', 'growth', 'now-card']
    case 'structure':  return ['structure', 'stem', 'now-card']
    case 'flower':     return ['flower', 'bud', 'now-card']
    case 'fruit':      return ['fruit', 'harvest', 'now-card']
    case 'leaf':       return ['leaf', 'growth', 'now-card']
    case 'seed':       return ['seed']
    case 'detail':     return ['detail']
  }
}

function stagesForRole(role: MacroRole): PlantStatus[] {
  switch (role) {
    case 'flower':     return ['i_vaekst', 'udplantet']
    case 'fruit':      return ['udplantet', 'hoestklar', 'afsluttet']
    case 'structure':  return ['i_vaekst', 'klar_til_udplantning', 'udplantet']
    case 'leaf':
    case 'atmosphere': return ['spirer', 'i_vaekst', 'klar_til_udplantning', 'udplantet']
    case 'seed':       return ['hoestklar', 'afsluttet']
    case 'detail':     return ['saaet', 'spirer', 'i_vaekst', 'klar_til_udplantning', 'udplantet', 'hoestklar', 'afsluttet']
  }
}

const PRIORITY_BY_ROLE: Record<MacroRole, number> = {
  fruit: 90, flower: 90, atmosphere: 75, structure: 70, leaf: 70, detail: 50, seed: 40,
}

/** species-variety-slug → {species, variety}. Konvention: første segment = art. */
function parseSpeciesVariety(key: string): { species: string; variety: string | null } {
  const i = key.indexOf('-')
  if (i < 0) return { species: key, variety: null }
  return { species: key.slice(0, i), variety: key.slice(i + 1) }
}

/** nowType → motivroller der efterspørges. */
const NOWTYPE_ROLES: Record<NowType, NowRole[]> = {
  sown:        ['soil', 'seedling'],
  germination: ['seedling', 'leaf'],
  vegetative:  ['leaf', 'stem', 'growth', 'structure'],
  flowering:   ['flower', 'bud'],
  fruiting:    ['fruit', 'structure'],
  harvest:     ['fruit', 'harvest'],
  care:        ['leaf', 'watering', 'growth'],
  problem:     ['leaf', 'detail'],
}

/** Plantefase → hvad "Lige nu" typisk handler om. */
export function nowTypeForStatus(status: PlantStatus): NowType {
  switch (status) {
    case 'planlagt':
    case 'saaet':                return 'sown'
    case 'spirer':               return 'germination'
    case 'i_vaekst':
    case 'klar_til_udplantning':
    case 'udplantet':            return 'vegetative'
    case 'hoestklar':
    case 'afsluttet':            return 'harvest'
  }
}

// ─── Katalog (bygges én gang fra de eksisterende sets) ─────────

const NOW_MACROS: NowMacro[] = (() => {
  const out: NowMacro[] = []
  for (const [key, set] of Object.entries(POTALOT_IMAGE_SETS_BY_ID)) {
    if (!set.macro?.length) continue
    const { species, variety } = parseSpeciesVariety(key)
    for (const m of set.macro) {
      if (!IMAGE_MANIFEST.has(m.src)) continue
      out.push({
        src: m.src,
        alt: m.alt,
        speciesSlug: species,
        varietySlug: variety,
        plantFamily: SPECIES_FAMILY[species] ?? null,
        roles: nowRolesForRole(m.role),
        stages: stagesForRole(m.role),
        shareScope: shareScopeForRole(m.role),
        objectPosition: m.focalPoint ? focalPosition[m.focalPoint] : undefined,
        priority: PRIORITY_BY_ROLE[m.role] ?? 50,
      })
    }
  }
  return out
})()

// ─── Eligibility + scoring ─────────────────────────────────────

function familyOf(ctx: NowImageContext): string | null {
  if (ctx.plantFamily) return ctx.plantFamily
  return ctx.speciesSlug ? SPECIES_FAMILY[ctx.speciesSlug] ?? null : null
}

/** Gate: må dette makro overhovedet bruges i denne kontekst? */
function eligible(m: NowMacro, ctx: NowImageContext): boolean {
  switch (m.shareScope) {
    case 'variety':
      return m.varietySlug != null && m.varietySlug === ctx.varietySlug && m.speciesSlug === ctx.speciesSlug
    case 'species':
      return m.speciesSlug === ctx.speciesSlug
    case 'plantFamily':
      return m.plantFamily != null && m.plantFamily === familyOf(ctx)
    case 'stageGeneric':
      return m.stages.includes(ctx.stage)
    case 'global':
      return true
  }
}

function score(m: NowMacro, ctx: NowImageContext): number {
  // Hård sikkerhedsregel: et makro der viser frugt/frø deler ALDRIG på
  // tværs af sort (eller art) — sortsspecifik form/farve.
  const showsIdentity = m.roles.includes('fruit') || m.roles.includes('seed')
  if (showsIdentity && (m.varietySlug !== ctx.varietySlug || m.speciesSlug !== ctx.speciesSlug)) {
    return -Infinity
  }

  const needed = NOWTYPE_ROLES[ctx.nowType]
  let s = 0
  if (m.varietySlug != null && m.varietySlug === ctx.varietySlug) s += 100
  if (m.speciesSlug === ctx.speciesSlug) s += 60
  if (m.stages.includes(ctx.stage)) s += 40
  if (m.roles.some((r) => needed.includes(r))) s += 40
  if (m.roles.includes('now-card')) s += 20
  if (m.shareScope === 'variety') s += 20
  else if (m.shareScope === 'species') s += 10
  s += m.priority * 0.1 // blødt tiebreak
  return s
}

/**
 * Vælg det bedst egnede makro til "Lige nu". Returnerer null hvis intet
 * sikkert makro findes — så falder kalderen til plantekort-foto/placeholder.
 * Kun makroer der duer som hero-billede ('now-card') overvejes; rene
 * frø-/detalje-close-ups springes over til denne brug.
 */
export function resolveNowImage(ctx: NowImageContext): NowImageResult | null {
  let best: NowMacro | null = null
  let bestScore = -Infinity
  for (const m of NOW_MACROS) {
    if (!m.roles.includes('now-card')) continue
    if (!eligible(m, ctx)) continue
    const sc = score(m, ctx)
    if (sc > bestScore) {
      bestScore = sc
      best = m
    }
  }
  if (!best || bestScore <= 0) return null
  return { src: best.src, alt: best.alt, objectPosition: best.objectPosition }
}
