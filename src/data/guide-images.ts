/**
 * @deprecated Tynd adapter over POTALOT_IMAGE_SETS_BY_ID.
 *
 * Eksisterer kun så `scripts/check-images.ts` fortsætter med at virke
 * indtil den migreres i Commit 5. Resten af kodebasen bruger den nye
 * canonical resolver direkte.
 *
 * @see src/data/potalot-image-sets.ts — den canonical sandhed.
 * @see src/lib/images/resolve-potalot-image.ts — den canonical resolver.
 */

import { POTALOT_IMAGE_SETS_BY_ID } from './potalot-image-sets'
import type { PotalotImageSet } from '@/lib/images/types'

/** @deprecated Brug MacroImage fra @/lib/images/types. */
type LegacyMacroImage = {
  src: string
  alt: string
  role?: string
  focalPoint?: string
}

/** @deprecated Brug PotalotImageSet fra @/lib/images/types. */
type GuideImages = {
  hero?: string
  seedCard?: string
  macro?: LegacyMacroImage[]
}

function toLegacy(set: PotalotImageSet): GuideImages {
  return {
    hero: set.varietyHero?.src ?? set.plantCard?.src ?? set.speciesHero?.src,
    seedCard: set.seedCard?.src,
    macro: set.macro.map((m) => ({
      src: m.src,
      alt: m.alt,
      role: m.role,
      focalPoint: m.focalPoint,
    })),
  }
}

/** @deprecated Brug `POTALOT_IMAGE_SETS_BY_ID` fra `@/data/potalot-image-sets`. */
export const GUIDE_IMAGES_BY_ID: Record<string, GuideImages> = Object.fromEntries(
  Object.entries(POTALOT_IMAGE_SETS_BY_ID).map(([id, set]) => [id, toLegacy(set)]),
)
