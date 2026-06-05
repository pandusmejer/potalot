/**
 * Legacy fallback-mapping fra guide-slug til en enkelt makro-path.
 *
 * **Brug IKKE som primær vej.** Den primære vej for at vælge makros
 * er `src/data/guide-images.ts` + `selectGuideImage()` — som understøtter
 * roller, focal points, crop-profiles og avoid-duplicates.
 *
 * Denne fil bevares **kun** så længe guides ikke er fuldt dækket af
 * `GUIDE_IMAGES_BY_ID` i guide-images.ts. Når alle guides har entries
 * dér, kan denne fil slettes.
 *
 * Hvis du tilføjer en ny guide, så lav en entry i guide-images.ts —
 * ikke en linje her.
 */

export function pickAtmosfaeriskMakroFallback(slug: string): string | null {
  const MAP: Record<string, string> = {
    // Species
    tomat: '/images/makro/tomat/kondens.jpg',
    agurk: '/images/makro/agurk/blad.jpg',
    chili: '/images/makro/chili/blad-dug.jpg',
    peberfrugt: '/images/makro/peberfrugt-california-wonder/indre.jpg',

    // Varieties (kun guides UDEN entries i guide-images.ts)
    'agurk-marketmore': '/images/makro/agurk/frugt-med-blomst.jpg',
    'chili-habanero-orange': '/images/makro/chili-habanero-orange/skin.jpg',
    'peberfrugt-california-wonder':
      '/images/makro/peberfrugt-california-wonder/indre.jpg',
  }
  return MAP[slug] ?? null
}
