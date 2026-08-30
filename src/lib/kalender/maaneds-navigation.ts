/**
 * Kalenderens månedsskift — måned OG år.
 *
 * ── Hvorfor det er sit eget lag ──────────────────────────────────────────
 * Året var længe kun kosmetik i heroens "SOMMER · 2026". Efter KAL-0114 er
 * det INPUT TIL EN SKRIVNING: `opgaveDatoForGoeremaal` dater en ny opgave i
 * den viste måned og det viste år. Går året forkert ved et skifte, skrives
 * opgaven i det forkerte år — og kalenderlogik har en næsten religiøs evne
 * til at glemme, at år findes (Anna).
 *
 * Reglen: kun de to nabo-skift over nytår flytter året.
 *   december → januar  = +1 år
 *   januar   → december = −1 år
 * Alt andet lader året stå. Alle kalenderens kontroller (heroens pile,
 * planner-stepperen, "Kig mod næste måned") går gennem denne ene funktion,
 * så de ikke kan være uenige om hvilket år brugeren kigger på.
 */

export interface MaanedsVisning {
  /** 1-12 */
  month: number
  year: number
}

export function skiftTilMaaned(
  nuvaerende: MaanedsVisning,
  naeste: number,
): MaanedsVisning {
  if (nuvaerende.month === 12 && naeste === 1) return { month: 1, year: nuvaerende.year + 1 }
  if (nuvaerende.month === 1 && naeste === 12) return { month: 12, year: nuvaerende.year - 1 }
  return { month: naeste, year: nuvaerende.year }
}

/** Måneden ét skridt frem — bruges af "Kig mod næste måned" og heroens pil. */
export function naesteMaaned(month: number): number {
  return month >= 12 ? 1 : month + 1
}

/** Måneden ét skridt tilbage. */
export function forrigeMaaned(month: number): number {
  return month <= 1 ? 12 : month - 1
}
