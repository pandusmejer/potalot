/**
 * resolvePotalotImage — én canonical billed-resolver for Potalot.
 *
 * Træffer beslutning om hvilket billede der vises HVOR for en given
 * guide / sort / art. Bruger 4 prioritets-niveauer i fald-orden:
 *
 *   1. imported-guide        — explicit data fra content/guides/*.md
 *      (kun for hero-rolle på guide-detail)
 *   2. guide-images          — guide-images.ts entry (hero/seedCard/macro)
 *   3. asset-convention      — /images/<role>/<slug>.{jpg,png}
 *   4. fallback              — placeholder med kendt path
 *
 * Hver kandidat valideres mod IMAGE_MANIFEST før den returneres —
 * vi returnerer ALDRIG en path til en fil der ikke findes på disken.
 *
 * Hardcoded fallbacks (som "corno → California Wonder") er bevidst
 * udeladt. Forkert billede er værre end intet billede.
 *
 * Spec: Annas instruktion efter image-pipeline audit (juni 2026).
 */

import { IMAGE_MANIFEST } from '@/data/image-manifest.generated'
import { GUIDE_IMAGES_BY_ID } from '@/data/guide-images'
import { IMPORTED_GUIDES } from '@/data/guides-imported'

export type PotalotImageRole =
  | 'frokort'
  | 'plantekort'
  | 'arts'
  | 'macro'
  | 'thumbnail'

export type PotalotImageSource =
  | 'imported-guide'
  | 'guide-images'
  | 'asset-convention'
  | 'fallback'

export interface PotalotImageInput {
  /** Guide-id (matcher IMPORTED_GUIDES og GUIDE_IMAGES_BY_ID). */
  guideId?: string | null
  /** Slug at konstruere asset-paths fra (typisk samme som guideId). */
  slug?: string | null
  /** Plante-navn (fx "Tomat") — fallback hvis slug mangler. */
  plantType?: string | null
  /** Sortsnavn (fx "San Marzano") — kombineres med plantType. */
  variety?: string | null
  /** Hvilken rolle skal billedet spille i UI'et. */
  imageRole: PotalotImageRole
}

export interface PotalotImageOutput {
  src: string
  alt: string
  source: PotalotImageSource
}

const PLACEHOLDER_SRC = '/images/ui/placeholder-card.svg'

/**
 * Konverterer fri tekst til en kebab-case slug (uden æøå).
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
 * Returnerer en liste af kandidat-slugs i prioritets-rækkefølge.
 *   1. eksplicit slug
 *   2. plantType + variety kombineret
 *   3. plantType alene (for arts-rolle på sorter)
 */
function candidateSlugs(input: PotalotImageInput): string[] {
  const out: string[] = []
  if (input.slug) out.push(input.slug)
  if (input.plantType && input.variety) {
    const composite = slugify(`${input.plantType}-${input.variety}`)
    if (composite && !out.includes(composite)) out.push(composite)
  }
  if (input.plantType) {
    const arts = slugify(input.plantType)
    if (arts && !out.includes(arts)) out.push(arts)
  }
  return out
}

/**
 * Returnerer kandidat-paths for asset-convention pr. rolle.
 * Eksempel: imageRole='plantekort', slug='tomat-san-marzano'
 *   → ['/images/plantekort/tomat-san-marzano.jpg',
 *      '/images/plantekort/tomat-san-marzano.png']
 */
function conventionPaths(slug: string, role: PotalotImageRole): string[] {
  switch (role) {
    case 'frokort':
      return [
        `/images/frokort/${slug}.png`, // png er primær for frokort (transparens)
        `/images/frokort/${slug}.jpg`,
      ]
    case 'plantekort':
      return [
        `/images/plantekort/${slug}.jpg`,
        `/images/plantekort/${slug}.png`,
      ]
    case 'arts':
      return [
        `/images/arts/${slug}.jpg`,
        `/images/arts/${slug}.png`,
      ]
    case 'macro':
      // macro er i undermappe — første kandidat fra guide-images.ts er primær,
      // her bygger vi kun et fald-back symbolsk path (sjældent matches).
      return []
    case 'thumbnail':
      // thumbnail er afledte crops — vi vælger plantekort som default.
      return [
        `/images/plantekort/${slug}.jpg`,
        `/images/plantekort/${slug}.png`,
        `/images/arts/${slug}.jpg`,
      ]
  }
}

/**
 * Hovedfunktion. Returnerer altid en gyldig src — i værste fald
 * placeholder. source-feltet fortæller hvilket lag der vandt.
 */
export function resolvePotalotImage(
  input: PotalotImageInput,
): PotalotImageOutput {
  const { guideId, imageRole } = input

  // ── 1. imported-guide (kun hero — primaryImageId) ──────────
  // Bruges når imageRole matcher den rolle primaryImageId udfylder:
  //   arts-rolle på species, plantekort-rolle på variety.
  if (guideId && (imageRole === 'arts' || imageRole === 'plantekort')) {
    const guide = IMPORTED_GUIDES.find((g) => g.id === guideId)
    if (guide?.primaryImageId && IMAGE_MANIFEST.has(guide.primaryImageId)) {
      return {
        src: guide.primaryImageId,
        alt: guide.variety ?? guide.plantName,
        source: 'imported-guide',
      }
    }
  }

  // ── 2. guide-images.ts entry ───────────────────────────────
  if (guideId) {
    const images = GUIDE_IMAGES_BY_ID[guideId]
    if (images) {
      if (imageRole === 'frokort' && images.seedCard && IMAGE_MANIFEST.has(images.seedCard)) {
        return { src: images.seedCard, alt: '', source: 'guide-images' }
      }
      if (
        (imageRole === 'plantekort' || imageRole === 'arts' || imageRole === 'thumbnail') &&
        images.hero &&
        IMAGE_MANIFEST.has(images.hero)
      ) {
        return { src: images.hero, alt: '', source: 'guide-images' }
      }
      if (imageRole === 'macro' && images.macro && images.macro.length > 0) {
        const found = images.macro.find((m) => IMAGE_MANIFEST.has(m.src))
        if (found) return { src: found.src, alt: found.alt, source: 'guide-images' }
      }
    }
  }

  // ── 3. asset-convention ────────────────────────────────────
  const candidates = candidateSlugs(input)
  for (const candidate of candidates) {
    const paths = conventionPaths(candidate, imageRole)
    for (const path of paths) {
      if (IMAGE_MANIFEST.has(path)) {
        return {
          src: path,
          alt: input.variety ?? input.plantType ?? candidate,
          source: 'asset-convention',
        }
      }
    }
  }

  // ── 4. fallback ────────────────────────────────────────────
  return {
    src: PLACEHOLDER_SRC,
    alt: input.variety ?? input.plantType ?? 'Billede mangler',
    source: 'fallback',
  }
}
