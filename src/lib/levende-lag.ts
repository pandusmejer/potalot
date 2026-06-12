/**
 * Det levende lag (V10) — Havebogens kuratering.
 *
 * Havebogen består af to lag:
 *
 *   DET FASTE LAG — vises hver gang (Havebogens "forside"):
 *     hero (hilsen + dagtæller) + dagens indsigt
 *
 *   DET LEVENDE LAG — skifter løbende; kun 1-2 moduler ad gangen,
 *     kurateret efter sæson. Magasiner viser ikke alle rubrikker
 *     på alle sider — de kuraterer. Uden dette lag ender Havebogen
 *     som "siden der gør alt", og så er vi tilbage ved dashboardet.
 *
 *   BAGSIDEN — "Historien fortsætter" (arkiv + refleksion) lukker
 *     altid bogen. En bog har altid sin bagside; den roterer ikke.
 *
 * Tilgængelige moduler i dag: paaDenneDag, vendepunkter, minder.
 * Kommende moduler registreres her når de bygges (rækkefølge =
 * Annas prioritering): talTilDinHave, inspirerMig, bedrifter,
 * koekken, dyrkerniveau.
 *
 * Kurateringslogikken er sæsonens følelse, ikke en algoritme:
 *   vinter   → at huske (på denne dag, minder)
 *   forår    → at komme i gang (vendepunkter, på denne dag)
 *   sommer   → sæsonen lever (vendepunkter, minder)
 *   efterår  → at samle op (minder, vendepunkter)
 *
 * Moduler med tomme data tier selv stille (komponenterne returnerer
 * null) — kuratering og stilhed komponerer.
 */

export type LevendeModul = 'paaDenneDag' | 'vendepunkter' | 'minder'

export function vaelgLevendeLag(month: number): LevendeModul[] {
  // month: 1-12
  if (month === 12 || month <= 2) return ['paaDenneDag', 'minder']
  if (month <= 5) return ['vendepunkter', 'paaDenneDag']
  if (month <= 8) return ['vendepunkter', 'minder']
  return ['minder', 'vendepunkter']
}
