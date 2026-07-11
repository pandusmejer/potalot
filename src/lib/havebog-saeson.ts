/**
 * Sæson-motoren (8. juli 2026) — Havebogens vigtigste tidsmodel.
 *
 * En sæson følger AKTIVITET, ikke kalenderåret. Annas regel:
 *
 *   En sæson løber fra årets første registrerede såning til NÆSTE års
 *   første registrerede såning. Tælleren nulstilles ALDRIG ved nytår —
 *   kun når der registreres en såning i et senere år end sæsonens start.
 *
 * Eksempel:
 *   1. mar 2026  første såning       → sæson 1, DAG 001
 *   1. nov 2026  sidste høst          → stadig sæson 1
 *   1. jan 2027  (intet sået endnu)   → stadig sæson 1, DAG ~307
 *   1. mar 2027  ny første såning     → sæson 2, DAG 001 (sæson 1 arkiveres)
 *
 * En sæson = et dyrkningsår. Springer man et helt år over uden at så,
 * bliver det ikke en sæson (nummeret tæller cyklusser, ikke årstal).
 *
 * Ren funktion — testet i scripts/test-havebog-saeson.ts. Ingen DB-
 * ændringer; alt udledes af eksisterende sånings-datoer.
 */

export interface SaesonInfo {
  /** ISO-dato for den AKTUELLE sæsons første såning. Null hvis intet er sået. */
  start: string | null
  /** 1-baseret sæsonnummer (1 = første sæson). 0 hvis intet er sået. */
  nummer: number
  /** Forrige sæsons startdato — til sæson-mod-sæson-sammenligninger. Null hvis kun én sæson. */
  forrigeStart: string | null
}

function aar(iso: string): number {
  return parseInt(iso.slice(0, 4), 10)
}

/**
 * Beregn den aktuelle sæson ud fra alle sånings-datoer (alle år).
 * Datoerne behøver ikke være sorteret.
 */
export function beregnSaeson(sowingDates: string[]): SaesonInfo {
  const sorted = sowingDates.filter(Boolean).sort() // ISO-strenge sorterer kronologisk
  if (sorted.length === 0) {
    return { start: null, nummer: 0, forrigeStart: null }
  }

  let start = sorted[0]
  let startAar = aar(start)
  let nummer = 1
  let forrigeStart: string | null = null

  for (let i = 1; i < sorted.length; i++) {
    const y = aar(sorted[i])
    // Ny sæson: den FØRSTE såning i et senere år end den nuværende sæsons start.
    if (y > startAar) {
      forrigeStart = start
      start = sorted[i]
      startAar = y
      nummer++
    }
  }

  return { start, nummer, forrigeStart }
}

const ORDINAL = [
  'første', 'anden', 'tredje', 'fjerde', 'femte',
  'sjette', 'syvende', 'ottende', 'niende', 'tiende',
]

/** "af din tredje sæson" — ordinal-etiket til dagtælleren. */
export function saesonEtiket(nummer: number): string | null {
  if (nummer < 1) return null
  const ord = ORDINAL[Math.min(nummer, ORDINAL.length) - 1]
  return `af din ${ord} sæson`
}
