/**
 * Bruger-niveau — appens fælles "ærlighedsstige" for hvor etableret
 * brugerens have er. Forfremmet fra kalenderens degradations-stige
 * (dagens-fokus.ts), så alle sektioner deler ÉN definition:
 *
 *   0 = ingen data           (nye brugere — adaptive onboarding-målgruppen)
 *   1 = frøbank har indhold  (frø, men intet i jorden)
 *   2 = aktive planter
 *   3 = flere sæsoners historik (afgøres senere på arkiv-data)
 *
 * Regel (Anna 3/8): al kontekstuel onboarding-hjælp er niveau-afhængig OG
 * permanent afvisbar — når brugeren ikke længere tilhører målgruppen
 * (typisk niveau ≥ 2), vises hjælpen ikke, uanset dismiss-state.
 */

export type BrugerNiveau = 0 | 1 | 2 | 3

export function brugerNiveau(plantCount: number, inventoryCount: number): BrugerNiveau {
  if (plantCount > 0) return 2
  if (inventoryCount > 0) return 1
  return 0
}
