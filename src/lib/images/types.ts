/**
 * Potalot image system — canonical types.
 *
 * Hver plante/sort/art beskrives af et PotalotImageSet med op til
 * fire rolle-specifikke heroes + et array af makrofotos.
 *
 *   - Species guides normally only define speciesHero + macro.
 *   - Variety guides may define seedCard, plantCard, varietyHero + macro.
 *
 * plantCard og varietyHero kan pege på samme fysiske fil — typisk
 * /images/plantekort/<slug>.jpg — men de er TO forskellige roller:
 *
 *   plantCard    bruges på Mine planter, Kalender, aktive planter, vækst
 *   varietyHero  bruges på sortsguider, sortskort, sortslister
 *
 * Filerne kan senere splittes uden at ændre komponenterne.
 *
 * Spec: Annas image-pipeline-instruktion, juni 2026.
 */

export type FocalPoint = 'center' | 'top' | 'bottom' | 'left' | 'right'

/** Roller for makrofotos — bruges af resolverens makro-selektion. */
export type MacroRole =
  | 'atmosphere'  // bag faktabokse, atmosfærisk lag
  | 'structure'   // klase, forgrening, stængel
  | 'flower'      // blomst, blomsterknop
  | 'fruit'       // frugt, modning
  | 'leaf'        // blad, bladmønster
  | 'seed'        // frø, frøkammer
  | 'detail'      // generel detalje (hår, dråber, overflade)

export interface ImageAsset {
  src: string
  alt: string
}

export interface MacroImage extends ImageAsset {
  role: MacroRole
  focalPoint?: FocalPoint
}

export interface PotalotImageSet {
  /** Frøkort til frøbank, frødetalje, frø-relaterede previews. */
  seedCard?: ImageAsset
  /** Plantekort til Mine planter, Kalender, aktive planter, vækst. */
  plantCard?: ImageAsset
  /** Artshero til artsguide og artskort på guide-landing. */
  speciesHero?: ImageAsset
  /** Sortshero til sortsguide, sortskort, sortsoversigter. */
  varietyHero?: ImageAsset
  /** Makrofotos — atmosfæriske lag, fact-blokke, Vidste du, Potalot-tip. */
  macro: MacroImage[]
}

export type PotalotImageRole =
  | 'seed-card'
  | 'plant-card'
  | 'species-hero'
  | 'variety-hero'
  | 'macro'

export type PotalotImageSource =
  | 'user-upload'        // brugerens explicit upload (valideret)
  | 'guide-images'       // hentet fra POTALOT_IMAGE_SETS_BY_ID
  | 'asset-convention'   // /images/<role>/<slug>.{jpg,png}
  | 'fallback'           // placeholder — INTET matched

export interface PotalotImageOutput {
  src: string
  alt: string
  type: PotalotImageRole
  source: PotalotImageSource
}

/** Crop-profil for makrofotos (visuel variation når samme billede genbruges). */
export type CropProfileName =
  | 'soft-left'
  | 'soft-right'
  | 'center-zoom'
  | 'top-band'
  | 'detail-close'

export interface CropProfile {
  objectPosition: string
  scale: number
  rotation: string
}

export interface PotalotMacroOutput extends PotalotImageOutput {
  type: 'macro'
  role: MacroRole
  objectPosition: string
  cropProfile: CropProfileName
  scale: number
  rotation: string
}

export interface PotalotImageInput {
  /** Guide-id der matcher POTALOT_IMAGE_SETS_BY_ID og IMPORTED_GUIDES. */
  guideId?: string | null
  /** Slug til arten (artsguide-id eller parentGuideId på sorter). */
  speciesSlug?: string | null
  /** Slug til sorten (= guideId for sortsguider). */
  varietySlug?: string | null
  /** Hvilken rolle billedet spiller. */
  role: PotalotImageRole
  /**
   * Brugerens upload — typisk fra DB (item.primaryImageId,
   * plant.primaryImageId). Valideres:
   *   - Eksternt URL (https://...) → returneres uden validering
   *   - Lokal /images/... → valideres mod IMAGE_MANIFEST; brudte
   *     paths springes over og falder til convention/fallback
   *   - null/undefined → springes over
   */
  preferredSrc?: string | null
}

export interface PotalotMacroInput {
  guideId?: string | null
  speciesSlug?: string | null
  varietySlug?: string | null
  /** Unique slot identifier — fx 'fact', 'note', 'tip', 'hero-bg'. */
  slot: string
  /** Foretrukne roller (prioritets-rækkefølge). */
  preferredRoles?: MacroRole[]
  /** Allerede brugte src'er — undgås. */
  avoidSrcs?: ReadonlySet<string>
  /** Bestemt crop-profil. Hvis null vælges deterministisk fra slot. */
  cropProfile?: CropProfileName
}
