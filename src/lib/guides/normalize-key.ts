/**
 * Delt normaliseringsnøgle for guide-matchning.
 *
 * Både LÆSE-laget (resolvePlantGuideHref, "Se guide"-link) og KOBLINGS-laget
 * (ensureGuideForInventoryItem/ensureGuideForPlant + master-syncen) skal matche
 * plante-/sortsnavne EENS, ellers kobler appen forkert eller genererer et
 * overflødigt AI-udkast for en plante, der allerede har en master-guide.
 *
 * Reglerne (Docs/product/guides-master-sync-spec.md §5):
 *   trim → lowercase → fold/fjern apostroffer → collapse whitespace
 *
 * Apostroffer FJERNES helt (ikke bare foldes til ét tegn), så alle tre
 * skrivemåder af samme sort kollapser til samme nøgle:
 *   "Gardener's Delight"  (U+2019, krøllet)
 *   "Gardener's Delight"  (U+0027, lige)
 *   "Gardeners Delight"   (ingen apostrof)
 *      → alle "gardeners delight"
 * Det er nødvendigt for at opfylde acceptkravet i spec §6, test 5, hvor en
 * bruger der skriver sorten uden apostrof stadig skal kobles til masteren.
 */
export function normalizeGuideKey(s: string): string {
  return s
    .normalize('NFC')
    // krøllede/modifier-apostroffer + lige apostrof → fjernes helt
    .replace(/[‘’ʼ'`´]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}
