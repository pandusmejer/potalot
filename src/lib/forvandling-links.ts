/**
 * Forvandlinger — gemte eksterne links + erfaring (typing/placeholder).
 *
 * ⚠️ IKKE OPERATIONELT ENDNU. Dette er KUN typing + kvalitets-sortering.
 * At gemme et link kræver en migration (ny tabel `forvandling_links`) og en
 * server action — pakkes som eget backend-sprint (jf. diktafon-mønsteret;
 * ALDRIG ad-hoc migration mod live DB). UI'et viser "Gem et link" som
 * design-intention indtil da.
 *
 * Princip (copyright-sikkert): brugeren gemmer IKKE opskriften — kun linket,
 * kilden, hvilke afgrøder de brugte, og deres egen note/erfaring. Ingen
 * scraping, ingen import af fulde opskrifter.
 */

export type ForvandlingResultStatus = 'saved' | 'planned' | 'tried' | 'would_make_again'

export interface ForvandlingBrugtAfgroede {
  cropId?: string
  varietyId?: string
  label: string
}

export interface SavedForvandlingLink {
  id: string
  userId: string
  forvandlingId: string
  title: string
  url: string
  sourceName?: string
  userNote?: string
  usedCrops: ForvandlingBrugtAfgroede[]
  savedAt: string
  triedAt?: string
  resultStatus?: ForvandlingResultStatus
  isSharedAnonymously?: boolean
}

/**
 * Kvalitetssignal — et gemt link er svagt, et prøvet stærkere, "ville lave
 * igen" stærkest. Bruges senere til at sortere kollektive/anonyme links.
 * Højere = stærkere.
 */
export function linkKvalitet(link: Pick<SavedForvandlingLink, 'resultStatus'>): number {
  switch (link.resultStatus) {
    case 'would_make_again': return 4
    case 'tried': return 3
    case 'planned': return 2
    case 'saved': return 1
    default: return 0
  }
}
