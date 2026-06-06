/**
 * @deprecated Tynd adapter over POTALOT_IMAGE_SETS_BY_ID.
 *
 * Oversætter den nye PotalotImageSet-shape til den gamle GuideImages-
 * shape (hero/seedCard/macro) så consumers af det legacy-navn (`select-
 * guide-image.ts`, `legacy-fallback-macros.ts`, guides/[id]/page.tsx)
 * fortsætter med at virke under Commit 1.
 *
 * Fjernes i Commit 5 når alle consumers er migreret til
 * `resolvePotalotImage` + `resolvePotalotMacro`.
 *
 * @see src/data/potalot-image-sets.ts — den canonical sandhed.
 */

import { POTALOT_IMAGE_SETS_BY_ID } from './potalot-image-sets'
import type { PotalotImageSet } from '@/lib/images/types'
import type { GuideImages } from '@/lib/guides/select-guide-image'

/**
 * PotalotImageSet → legacy GuideImages.
 *
 * `hero` udfyldes pr. niveau:
 *   - varietyHero / plantCard først (sortsniveau)
 *   - speciesHero som fallback (artsniveau)
 * Begge er korrekte for det gamle GuideImages.hero-felt — det blev
 * brugt forskelligt i forskellige consumers.
 */
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

/** @deprecated Brug `getPotalotImageSet` fra `@/data/potalot-image-sets`. */
export function getGuideImages(guideId: string): GuideImages | null {
  return GUIDE_IMAGES_BY_ID[guideId] ?? null
}
