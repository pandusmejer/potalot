/**
 * resolvePotalotImage — ÉN canonical billed-resolver for Potalot.
 *
 * Træffer beslutning om hvilket billede der vises HVOR for en given
 * guide / sort / art. Bruger 4 prioritets-niveauer i fald-orden:
 *
 *   1. user-upload        — explicit preferredSrc (valideret mod manifest)
 *   2. guide-images       — POTALOT_IMAGE_SETS_BY_ID entry
 *   3. asset-convention   — /images/<role>/<slug>.{jpg,png}
 *   4. fallback           — placeholder med kendt path
 *
 * Hver kandidat valideres mod IMAGE_MANIFEST før den returneres —
 * vi returnerer ALDRIG en path til en fil der ikke findes på disken.
 *
 * REGLER (Annas image-pipeline-instruktion, juni 2026):
 *
 *   - Ingen cross-role fall. En variety-rolle (seed-card, plant-card,
 *     variety-hero) må ALDRIG falde til species-niveau eller en
 *     beslægtet sorts fil. Corno må aldrig vise California Wonder.
 *   - macro må KUN komme fra POTALOT_IMAGE_SETS_BY_ID. Ingen
 *     asset-convention for macro. Ingen gæt på /images/makro/<slug>
 *     uden entry.
 *   - Forkert billede er værre end intet billede — vi falder altid
 *     tilbage til neutral placeholder, aldrig til relateret sort.
 *
 * Spec: src/lib/images/types.ts (PotalotImageSet/PotalotImageRole)
 *       Docs/design-system/guides.md sektion -2 (billedhierarki)
 */

import { IMAGE_MANIFEST } from '@/data/image-manifest.generated'
import { POTALOT_IMAGE_SETS_BY_ID } from '@/data/potalot-image-sets'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import type {
  PotalotImageInput,
  PotalotImageOutput,
  PotalotImageRole,
  PotalotMacroInput,
  PotalotMacroOutput,
  CropProfile,
  CropProfileName,
  MacroImage,
  MacroRole,
  PotalotImageSet,
} from './types'

export type {
  PotalotImageInput,
  PotalotImageOutput,
  PotalotImageRole,
  PotalotImageSource,
  PotalotMacroInput,
  PotalotMacroOutput,
} from './types'

const PLACEHOLDER_SRC = '/images/ui/placeholder-card.svg'
const PLACEHOLDER_ALT = 'Billede mangler'

// ─── Crop-profiler (genbrugt af resolvePotalotMacro) ──────────

const cropProfiles: Record<CropProfileName, CropProfile> = {
  'soft-left':    { objectPosition: '35% 50%', scale: 1.08, rotation: '-1deg' },
  'soft-right':   { objectPosition: '65% 50%', scale: 1.08, rotation: '1deg' },
  'center-zoom':  { objectPosition: '50% 50%', scale: 1.18, rotation: '0deg' },
  'top-band':     { objectPosition: '50% 28%', scale: 1.12, rotation: '0deg' },
  'detail-close': { objectPosition: '45% 55%', scale: 1.28, rotation: '-1deg' },
}

const cropOrder: CropProfileName[] = [
  'soft-left',
  'soft-right',
  'center-zoom',
  'top-band',
  'detail-close',
]

const focalPosition = {
  center: '50% 50%',
  top: '50% 28%',
  bottom: '50% 72%',
  left: '35% 50%',
  right: '65% 50%',
} as const

// ─── Slug helpers ──────────────────────────────────────────────

/**
 * Konverterer fri tekst til kebab-case (uden æøå).
 * Matcher konventionen i scripts/import-guides.ts.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Asset-convention paths pr. rolle.
 *
 * VIGTIGT: variety-roller (seed-card, plant-card, variety-hero) bygger
 * KUN fra varietySlug. species-hero bygger KUN fra speciesSlug.
 * Ingen cross-role candidates — der ville være "forkert billede".
 *
 * macro returnerer altid [] — makros må kun komme fra
 * POTALOT_IMAGE_SETS_BY_ID.
 */
function conventionPaths(
  role: PotalotImageRole,
  speciesSlug: string | null | undefined,
  varietySlug: string | null | undefined,
): string[] {
  switch (role) {
    case 'seed-card':
      if (!varietySlug) return []
      return [
        `/images/frokort/${varietySlug}.png`, // png er primær (transparens)
        `/images/frokort/${varietySlug}.jpg`,
      ]
    case 'plant-card':
    case 'variety-hero':
      if (!varietySlug) return []
      return [
        `/images/plantekort/${varietySlug}.jpg`,
        `/images/plantekort/${varietySlug}.png`,
      ]
    case 'species-hero':
      if (!speciesSlug) return []
      return [
        `/images/arts/${speciesSlug}.jpg`,
        `/images/arts/${speciesSlug}.png`,
      ]
    case 'macro':
      // ingen asset-convention for macro — pr. Annas regel
      return []
  }
}

/**
 * Hent den asset der svarer til rollen i et PotalotImageSet.
 * Returnerer undefined hvis rollen ikke er udfyldt på sættet.
 */
function setAssetForRole(
  set: PotalotImageSet,
  role: PotalotImageRole,
): { src: string; alt: string } | undefined {
  switch (role) {
    case 'seed-card':     return set.seedCard
    case 'plant-card':    return set.plantCard
    case 'species-hero':  return set.speciesHero
    case 'variety-hero':  return set.varietyHero
    case 'macro':         return set.macro[0]  // første macro er default
  }
}

// ─── Hoved-resolver ────────────────────────────────────────────

/**
 * Hovedfunktion. Returnerer altid en gyldig src — i værste fald
 * placeholder. source-feltet fortæller hvilket lag der vandt.
 */
export function resolvePotalotImage(
  input: PotalotImageInput,
): PotalotImageOutput {
  const { guideId, role, preferredSrc, speciesSlug, varietySlug } = input

  // ── 1. user-upload — brugerens explicit preferredSrc ───────
  if (preferredSrc) {
    const isExternal = /^https?:\/\//.test(preferredSrc)
    const isLocal = preferredSrc.startsWith('/images/')
    if (isExternal) {
      return {
        src: preferredSrc,
        alt: varietySlug ?? speciesSlug ?? PLACEHOLDER_ALT,
        type: role,
        source: 'user-upload',
      }
    }
    if (isLocal && IMAGE_MANIFEST.has(preferredSrc)) {
      return {
        src: preferredSrc,
        alt: varietySlug ?? speciesSlug ?? PLACEHOLDER_ALT,
        type: role,
        source: 'user-upload',
      }
    }
    // Lokal sti der ikke findes (stale DB-data, fantasi-path) →
    // fortsæt til de andre lag. Returnerer aldrig brudt sti.
  }

  // ── 2. POTALOT_IMAGE_SETS_BY_ID entry ──────────────────────
  // Søg på guideId først, derefter på varietySlug, derefter speciesSlug
  // — men kun til at finde SET'ET; rolle-opslaget er stadig strikt.
  const candidateIds = uniqueCompact([
    guideId,
    role !== 'species-hero' ? varietySlug : null,
    role === 'species-hero' ? speciesSlug : null,
  ])

  for (const id of candidateIds) {
    const set = POTALOT_IMAGE_SETS_BY_ID[id]
    if (!set) continue
    const asset = setAssetForRole(set, role)
    if (asset && IMAGE_MANIFEST.has(asset.src)) {
      return {
        src: asset.src,
        alt: asset.alt,
        type: role,
        source: 'guide-images',
      }
    }
  }

  // ── 2b. imported-guide fallback (kun for variety/species hero) ─
  // IMPORTED_GUIDES sætter primaryImageId ved import. Det dækker
  // tilfælde hvor potalot-image-sets endnu ikke har en entry.
  // Bruges KUN på samme rolle-niveau (variety→variety, species→species).
  if (
    guideId &&
    (role === 'variety-hero' || role === 'species-hero' || role === 'plant-card')
  ) {
    const imported = IMPORTED_GUIDES.find((g) => g.id === guideId)
    if (imported?.primaryImageId && IMAGE_MANIFEST.has(imported.primaryImageId)) {
      return {
        src: imported.primaryImageId,
        alt: imported.variety ?? imported.plantName,
        type: role,
        source: 'guide-images',
      }
    }
  }

  // ── 3. asset-convention ────────────────────────────────────
  const paths = conventionPaths(role, speciesSlug, varietySlug)
  for (const path of paths) {
    if (IMAGE_MANIFEST.has(path)) {
      return {
        src: path,
        alt: varietySlug ?? speciesSlug ?? PLACEHOLDER_ALT,
        type: role,
        source: 'asset-convention',
      }
    }
  }

  // ── 4. fallback — neutral placeholder ──────────────────────
  return {
    src: PLACEHOLDER_SRC,
    alt: varietySlug ?? speciesSlug ?? PLACEHOLDER_ALT,
    type: role,
    source: 'fallback',
  }
}

// ─── Makro-resolver med intelligent slot-selektion ─────────────

/**
 * resolvePotalotMacro — intelligent makro-vælger.
 *
 * Bruges på sider hvor flere makros skal vises på samme tid (fact-
 * blok, Vidste du, Potalot-tip). Hver kalder passer et unikt `slot`
 * + et avoidSrcs-set så samme makro ikke bruges flere gange.
 *
 * Returnerer altid en PotalotMacroOutput hvis der findes mindst én
 * makro i sættet — ellers null. Consumeren skal håndtere null
 * (typisk ved at skjule den dekorative makro-baggrund).
 */
export function resolvePotalotMacro(
  input: PotalotMacroInput,
): PotalotMacroOutput | null {
  const { guideId, varietySlug, speciesSlug, slot, preferredRoles, avoidSrcs, cropProfile } = input

  const candidateIds = uniqueCompact([guideId, varietySlug, speciesSlug])
  let macros: MacroImage[] = []
  for (const id of candidateIds) {
    const set = POTALOT_IMAGE_SETS_BY_ID[id]
    if (set?.macro && set.macro.length > 0) {
      macros = set.macro
      break
    }
  }
  if (macros.length === 0) return null

  const usable = macros.filter((m) => IMAGE_MANIFEST.has(m.src))
  if (usable.length === 0) return null

  // Foretrukne roller (fx ['atmosphere'] for baggrundsbruge,
  // ['fruit', 'structure'] for tekniske brug)
  const byRole: MacroImage[] =
    preferredRoles && preferredRoles.length > 0
      ? usable.filter((m) => preferredRoles.includes(m.role))
      : []
  const preferred = byRole.length > 0 ? byRole : usable

  // Undgå allerede brugte makros hvis muligt
  const notAvoided = preferred.filter((m) => !avoidSrcs?.has(m.src))
  const pool = notAvoided.length > 0 ? notAvoided : preferred

  const seed = `${candidateIds.join(':')}:${slot}`
  const macro = pool[deterministicIndex(seed, pool.length)]
  const profileName =
    cropProfile ?? cropOrder[deterministicIndex(`${seed}:${macro.src}:crop`, cropOrder.length)]
  const profile = cropProfiles[profileName]

  return {
    src: macro.src,
    alt: macro.alt,
    type: 'macro',
    source: 'guide-images',
    role: macro.role,
    objectPosition: macro.focalPoint ? focalPosition[macro.focalPoint] : profile.objectPosition,
    cropProfile: profileName,
    scale: profile.scale,
    rotation: profile.rotation,
  }
}

// ─── Util ──────────────────────────────────────────────────────

function uniqueCompact(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    if (!v) continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

function deterministicIndex(seed: string, length: number): number {
  if (length <= 1) return 0
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash % length
}

// ─── Deprecated legacy alias (fjernes i Commit 5) ──────────────
//
// Holder bagudkompatibilitet med den oprindelige API der brugte
// felterne {slug, plantType, variety, imageRole: 'frokort' | 'plantekort'
// | 'arts' | 'macro' | 'thumbnail'}. Migrér til den nye API før
// Commit 5 sletter dette.

/** @deprecated Brug PotalotImageRole. */
export type LegacyImageRole = 'frokort' | 'plantekort' | 'arts' | 'macro' | 'thumbnail'

/** @deprecated Brug PotalotImageInput. */
export interface LegacyImageInput {
  guideId?: string | null
  slug?: string | null
  plantType?: string | null
  variety?: string | null
  imageRole: LegacyImageRole
  preferredSrc?: string | null
}

const LEGACY_ROLE_MAP: Record<LegacyImageRole, PotalotImageRole> = {
  frokort:    'seed-card',
  plantekort: 'plant-card',
  arts:       'species-hero',
  macro:      'macro',
  thumbnail:  'plant-card', // thumbnail bruges typisk plantekort-fil
}

/**
 * @deprecated Brug `resolvePotalotImage({ guideId, speciesSlug,
 * varietySlug, role, preferredSrc })`. Denne overload oversætter den
 * gamle API til den nye.
 *
 * Fjernes i Commit 5 når alle consumers er migreret.
 */
export function resolvePotalotImageLegacy(
  input: LegacyImageInput,
): { src: string; alt: string; source: PotalotImageOutput['source'] } {
  const role = LEGACY_ROLE_MAP[input.imageRole]

  const explicitSlug = input.slug ?? null
  const compositeSlug =
    input.plantType && input.variety
      ? slugify(`${input.plantType}-${input.variety}`)
      : null
  const plantTypeSlug = input.plantType ? slugify(input.plantType) : null

  // For variety-roller: brug explicit slug eller composite (plantType+variety)
  // For species-rolle: brug plantTypeSlug (eller explicit slug hvis det er species-niveau)
  const varietySlug =
    role === 'species-hero'
      ? null
      : explicitSlug ?? compositeSlug
  const speciesSlug =
    role === 'species-hero'
      ? explicitSlug ?? plantTypeSlug
      : plantTypeSlug

  const result = resolvePotalotImage({
    guideId: input.guideId,
    speciesSlug,
    varietySlug,
    role,
    preferredSrc: input.preferredSrc,
  })

  return {
    src: result.src,
    alt: result.alt,
    source: result.source,
  }
}
