/**
 * Resultatet af guide-opslaget for én importeret frøpose.
 *
 * Bor i et rent modul, fordi server actions ('use server') kun må
 * eksportere async funktioner — også en `export interface` bliver optalt
 * som runtime-eksport og vælter buildet.
 */
export interface ImportGuideMatch {
  /**
   * Id'et der må GEMMES i `inventory_items.guide_id`. Null når posen har
   * en sort, men kun artsguiden findes — 1:1-reglen i vidensmodellen.
   */
  guideId: string | null
  /**
   * Artsguiden, hvis den findes. Må bruges til autofill og visning, men
   * gemmes ALDRIG som guide_id for en pose med sort.
   */
  artsGuideId: string | null
}
