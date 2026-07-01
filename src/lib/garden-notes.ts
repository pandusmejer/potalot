/**
 * "Små ting fra haven" — pulje af konkrete sansenoter.
 *
 * Server-safe modul. JSX-komponenten der RENDERER en note bor i
 * `src/components/havekalender/have-stemning.tsx` ('use client'),
 * men selve teksterne + valg-logikken lever her så de kan bruges
 * fra både server- og client-components.
 *
 * Designprincip:
 *   • Konkret-kropslig, IKKE poetisk-løsrevet.
 *   • Forankrende, ikke motiverende.
 *   • Tidspunkt-, vejr- og sæson-bevidst.
 *
 * Konceptuel kilde: Docs/HAVEN_SOM_SANCTUARY.md.
 */

import type { GardenAlert } from '@/actions/weather'

export interface Note {
  text: string
  /** Hvis sat: kun i de angivne måneder (1-12) */
  months?: number[]
  /** Hvis sat: kun på de tider af dagen */
  timeOfDay?: Array<'morning' | 'afternoon' | 'evening'>
  /** Hvis sat: kun ved bestemt vejrkontekst */
  weather?: 'rain' | 'sun' | 'frost'
}

export const GARDEN_NOTES: Note[] = [
  // ── Konkret kropsligt — virker hele året ──────────────────
  { text: 'Gå en langsom runde.' },
  { text: 'Rør ved jorden før du vander.' },
  { text: 'Mærk om jorden holder på fugten.' },
  { text: 'Brug hænderne i stedet for redskaber.' },
  { text: 'Vand langsommere end normalt.' },
  { text: 'Gå uden telefon.' },
  { text: 'Lyt til haven i to minutter.' },
  { text: 'Kig under bladene.' },
  { text: 'Lad noget gro lidt vildt.' },
  { text: 'Stå stille et øjeblik efter vanding.' },

  // ── Tids- og vejr-specifikt ───────────────────────────────
  { text: 'Lyt til regnen i drivhuset.', weather: 'rain' },
  { text: 'Læg mærke til hvordan jorden dufter efter regn.', weather: 'rain' },
  { text: 'Stil dig i solen et øjeblik.', weather: 'sun' },
  { text: 'Gå en sidste runde før solen går ned.', timeOfDay: ['evening'] },
  { text: 'Se hvad der har ændret sig siden i går.', timeOfDay: ['morning'] },
  { text: 'Se hvad bierne vælger i dag.', timeOfDay: ['afternoon'] },

  // ── Sæson-specifikt ───────────────────────────────────────
  { text: 'Se hvad der er kommet op siden sidste uge.', months: [3, 4, 5] },
  { text: 'Duft til tomatplanten når solen rammer bladene.', months: [6, 7, 8] },
  { text: 'Gnid et mynteblad mellem fingrene.', months: [5, 6, 7, 8] },
  { text: 'Høst kun det du skal bruge i dag.', months: [7, 8, 9, 10] },
  { text: 'Høst noget mens det stadig er lunt.', months: [8, 9] },
  { text: 'Kig efter nyt liv i skyggen.', months: [4, 5, 6] },
  { text: 'Se hvad der blomstrer uden hjælp.', months: [5, 6, 7, 8] },
  { text: 'Læg mærke til vinden i bedene.', months: [3, 4, 10, 11] },
]

export interface PickNoteOptions {
  /** Vejrvarsler — bruges til at filtrere vejr-specifikke noter ind/ud. */
  alerts?: GardenAlert[]
  /** Dato (1-31) — defaultes til i dag. Bruges til at variere noten pr. dag. */
  dayOfMonth?: number
  /** Liste af tekster der skal SPRINGES OVER. Brug fx for at sikre at
   *  to forskellige sider ikke ender med samme/lignende note. */
  exclude?: string[]
  /** Heltal-offset til seed'en — så fx en sekundær side får et andet
   *  udvalg end primær. */
  offset?: number
}

/**
 * Vælg en kontekst-relevant note baseret på måned, tid og vejr.
 * Deterministisk pr. dag så samme bruger ikke ser noten flade om
 * mellem renders.
 */
export function pickGardenNote(
  month: number,
  optionsOrAlerts?: PickNoteOptions | GardenAlert[],
  legacyDayOfMonth?: number,
): string {
  // Bagudkompatibel signatur: tidligere kald var `pickGardenNote(month, alerts, day)`.
  const opts: PickNoteOptions = Array.isArray(optionsOrAlerts)
    ? { alerts: optionsOrAlerts, dayOfMonth: legacyDayOfMonth }
    : (optionsOrAlerts ?? {})

  const alerts = opts.alerts ?? []
  const dayOfMonth = opts.dayOfMonth ?? new Date().getDate()
  const exclude = new Set(opts.exclude ?? [])
  const offset = opts.offset ?? 0

  const hour = new Date().getHours()
  const tod: 'morning' | 'afternoon' | 'evening' =
    hour < 11 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  const hasRain = alerts.some(a => a.kind === 'skybrud' || a.icon === 'CloudRain')
  const hasFrost = alerts.some(a => a.kind === 'frost')

  const eligible = GARDEN_NOTES.filter(n => {
    if (exclude.has(n.text)) return false
    if (n.months && !n.months.includes(month)) return false
    if (n.timeOfDay && !n.timeOfDay.includes(tod)) return false
    if (n.weather === 'rain' && !hasRain) return false
    if (n.weather === 'frost' && !hasFrost) return false
    return true
  })

  const pool = eligible.length > 0 ? eligible : GARDEN_NOTES.filter(n => !exclude.has(n.text))
  if (pool.length === 0) return GARDEN_NOTES[0].text
  const seed = month * 31 + dayOfMonth + offset
  return pool[Math.abs(seed) % pool.length].text
}
