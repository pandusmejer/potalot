/**
 * Gartnerens personlige kontekst og dagsloft — de rene regler (MVP 1.0, fase 4).
 *
 * Ingen imports, intet netværk, ingen database: alt her kan testes uden
 * Supabase (scripts/test-gartner-kontekst.ts). Routen (/api/ai/gartner) ejer
 * I/O; reglerne for HVAD der må sendes, og HVORNÅR et spørgsmål må stilles,
 * bor her.
 *
 * Låste regler (Anna 6/11 2026):
 *  1. Samtykket er gemt på profilen (standard FRA) og læses af SERVEREN ved
 *     hvert kald. Klienten sender aldrig et samtykke — og et sådant ville
 *     blive ignoreret. Alt andet end præcis `true` = intet samtykke.
 *  2. Med samtykke må Gartneren få: frø (art, sort, antal), planter (art, sort,
 *     status, sådato), stednavn og vejret nu. ALDRIG koordinater, adresse,
 *     e-mail, noter, fotos, leverandør eller andres data.
 *  3. Generelle spørgsmål virker altid uden samtykke.
 *  4. Dagsloftet (standard 30) er driftsstyring, uafhængigt af samtykke, og
 *     må aldrig fejle åbent: kan tælleren ikke læses, afvises spørgsmålet.
 */

// ─────────────────────────────────────────────────────────────────
// Samtykke
// ─────────────────────────────────────────────────────────────────

/**
 * Samtykket fra en profilrække. FAIL CLOSED: rækken mangler, kolonnen findes
 * ikke (migration ikke kørt), forespørgslen fejlede, værdien er null/"true"/1
 * → intet samtykke. Kun det rene boolske `true` tæller.
 */
export function harSamtykke(raekke: unknown): boolean {
  if (typeof raekke !== 'object' || raekke === null) return false
  return (raekke as Record<string, unknown>).ai_personlig_kontekst === true
}

// ─────────────────────────────────────────────────────────────────
// Dagsloft
// ─────────────────────────────────────────────────────────────────

export const STANDARD_DAGLIGT_LOFT = 30

/**
 * Loftet fra konfigurationen (GARTNER_DAGLIGT_LOFT). Mangler den, eller er
 * den ikke et helt tal ≥ 1, bruges 30: en konfigurationsfejl må hverken
 * åbne eller lukke tjenesten.
 */
export function dagligtLoft(vaerdi: string | undefined | null): number {
  if (typeof vaerdi !== 'string') return STANDARD_DAGLIGT_LOFT
  const t = vaerdi.trim()
  if (!/^\d+$/.test(t)) return STANDARD_DAGLIGT_LOFT
  const n = Number(t)
  return Number.isSafeInteger(n) && n >= 1 ? n : STANDARD_DAGLIGT_LOFT
}

export type KvoteUdfald =
  | { ok: true; brugt: number }
  | { ok: false; status: 429 | 503; fejl: 'dagsloft_naaet' | 'gartner_utilgaengelig'; besked: string }

export function kvoteBeskedLoftNaaet(loft: number): string {
  return `Du har stillet ${loft} spørgsmål i dag. Prøv igen i morgen.`
}
export const KVOTE_BESKED_UTILGAENGELIG = 'Gartneren er ikke tilgængelig lige nu. Prøv igen om lidt.'

/**
 * Oversæt svaret fra reserver_gartner_spoergsmaal(p_graense) til en afgørelse.
 * Funktionen returnerer rækker `{ tilladt, brugt }`.
 *
 *  - Databasefejl, manglende funktion/tabel, ukendt svarform → 503 (afvis)
 *  - tilladt === false                                        → 429
 *  - tilladt === true                                         → ok
 * ALT andet end et entydigt `tilladt: true` afviser — aldrig fejl åbent.
 */
export function afgoerKvote(
  svar: { data: unknown; error: unknown } | null | undefined,
  loft: number,
): KvoteUdfald {
  const utilgaengelig: KvoteUdfald = {
    ok: false, status: 503, fejl: 'gartner_utilgaengelig', besked: KVOTE_BESKED_UTILGAENGELIG,
  }
  if (!svar || svar.error) return utilgaengelig
  const raekke = Array.isArray(svar.data) ? svar.data[0] : svar.data
  if (typeof raekke !== 'object' || raekke === null) return utilgaengelig
  const { tilladt, brugt } = raekke as { tilladt?: unknown; brugt?: unknown }
  if (tilladt === true) {
    return { ok: true, brugt: typeof brugt === 'number' ? brugt : 0 }
  }
  if (tilladt === false) {
    return { ok: false, status: 429, fejl: 'dagsloft_naaet', besked: kvoteBeskedLoftNaaet(loft) }
  }
  return utilgaengelig
}

// ─────────────────────────────────────────────────────────────────
// Personlig kontekst
// ─────────────────────────────────────────────────────────────────

/** Hvad der må sendes, pr. område. Bruges også i headeren og i UI-teksten. */
export type KontekstOmraade = 'frobank' | 'planter' | 'sted' | 'vejr'

export interface FroeLinje {
  navn: string
  sort?: string | null
  /** Antal frø/stk., hvis kendt. null/undefined = ukendt (ikke 0). */
  antal?: number | null
}

export interface PlanteLinje {
  navn: string
  sort?: string | null
  /** Læsbar status ("Spiret", "Udplantet" …). */
  status?: string | null
  /** ÅÅÅÅ-MM-DD */
  saaedato?: string | null
}

export interface VejrLinje {
  tempC: number
  /** Fx "Let regn" */
  beskrivelse: string
}

export interface PersonligKontekstInput {
  samtykke: boolean
  froe?: FroeLinje[]
  planter?: PlanteLinje[]
  /** Fx "8220 Brabrand" — aldrig koordinater. */
  stednavn?: string | null
  vejr?: VejrLinje | null
}

export interface PersonligKontekst {
  /** Tom streng når intet må sendes. */
  tekst: string
  brugt: KontekstOmraade[]
}

/** Loft pr. liste — holder konteksten kort (dataminimering og tokens). */
export const MAKS_FROE_LINJER = 40
export const MAKS_PLANTE_LINJER = 40
const MAKS_TEKST = 60

/** Ren tekst, én linje, afkortet — så en notelignende værdi aldrig kan sive med. */
function ren(t: string | null | undefined): string {
  return (t ?? '').replace(/\s+/g, ' ').trim().slice(0, MAKS_TEKST)
}

function navnOgSort(navn: string, sort?: string | null): string {
  const n = ren(navn)
  const s = ren(sort)
  return s ? `${n} '${s}'` : n
}

/**
 * Byg den personlige kontekst. UDEN samtykke returneres altid tom kontekst —
 * uanset hvad der er sendt ind. Det er den eneste vej til personlige data, så
 * samtykket kan ikke omgås ved at kalde en delfunktion.
 */
export function bygPersonligKontekst(input: PersonligKontekstInput): PersonligKontekst {
  if (input.samtykke !== true) return { tekst: '', brugt: [] }

  const dele: string[] = []
  const brugt: KontekstOmraade[] = []

  // Frø: samme art+sort slås sammen; antal lægges sammen når alle er kendt.
  const froe = (input.froe ?? []).filter(f => ren(f.navn))
  if (froe.length > 0) {
    const grupper = new Map<string, { navn: string; antal: number; ukendt: boolean; poser: number }>()
    for (const f of froe) {
      const noegle = navnOgSort(f.navn, f.sort)
      const g = grupper.get(noegle) ?? { navn: noegle, antal: 0, ukendt: false, poser: 0 }
      g.poser += 1
      if (typeof f.antal === 'number' && Number.isFinite(f.antal) && f.antal >= 0) g.antal += f.antal
      else g.ukendt = true
      grupper.set(noegle, g)
    }
    const linjer = [...grupper.values()]
      .sort((a, b) => a.navn.localeCompare(b.navn, 'da'))
      .slice(0, MAKS_FROE_LINJER)
      .map(g => {
        const poser = g.poser > 1 ? `${g.poser} poser` : '1 pose'
        const antal = g.ukendt ? 'antal ukendt' : `${g.antal} frø`
        return `- ${g.navn}: ${poser}, ${antal}`
      })
    dele.push(`Brugerens frøbank (kun det brugeren selv har lagt ind):\n${linjer.join('\n')}`)
    brugt.push('frobank')
  }

  const planter = (input.planter ?? []).filter(p => ren(p.navn))
  if (planter.length > 0) {
    const linjer = planter.slice(0, MAKS_PLANTE_LINJER).map(p => {
      const dele2 = [navnOgSort(p.navn, p.sort)]
      if (ren(p.status)) dele2.push(`status: ${ren(p.status)}`)
      if (p.saaedato && /^\d{4}-\d{2}-\d{2}$/.test(p.saaedato)) dele2.push(`sået ${p.saaedato}`)
      return `- ${dele2.join(' · ')}`
    })
    dele.push(`Brugerens planter lige nu:\n${linjer.join('\n')}`)
    brugt.push('planter')
  }

  const sted = ren(input.stednavn)
  if (sted) {
    dele.push(`Havens sted: ${sted}.`)
    brugt.push('sted')
  }

  const v = input.vejr
  if (v && Number.isFinite(v.tempC) && ren(v.beskrivelse)) {
    dele.push(
      `Vejret lige nu ved haven: ${Math.round(v.tempC)} °C, ${ren(v.beskrivelse)}. ` +
      'Det er AKTUELT vejr, ikke en sæsonvurdering: generelle dyrkningsperioder i Potalots fakta gælder for Danmark som helhed, ' +
      'og må ikke fremstilles som regionale eller tilpasset stedet.',
    )
    brugt.push('vejr')
  }

  return { tekst: dele.join('\n\n'), brugt }
}

// ─────────────────────────────────────────────────────────────────
// Gennemsigtighed: header + brugertekst
// ─────────────────────────────────────────────────────────────────

/** Værdier i X-Gartner-Kontekst: området, aldrig indholdet. */
export type KontekstMaerke = KontekstOmraade | 'plante' | 'guide'

export const KONTEKST_HEADER = 'X-Gartner-Kontekst'

const KONTEKST_LABEL: Record<KontekstMaerke, string> = {
  frobank: 'dine frø',
  planter: 'dine planter',
  sted: 'havens sted',
  vejr: 'vejret lige nu',
  plante: 'den valgte plante',
  guide: 'guiden du står på',
}
const GYLDIGE = new Set<string>(Object.keys(KONTEKST_LABEL))

export function kontekstHeader(maerker: KontekstMaerke[]): string {
  return maerker.length > 0 ? maerker.join(',') : 'ingen'
}

/** "Brugte: dine frø, vejret lige nu" — eller null, hvis intet personligt blev brugt. */
export function kontekstBrugtTekst(header: string | null | undefined): string | null {
  if (!header || header === 'ingen') return null
  const labels = header.split(',').map(s => s.trim()).filter(s => GYLDIGE.has(s))
    .map(s => KONTEKST_LABEL[s as KontekstMaerke])
  return labels.length > 0 ? `Gartneren brugte: ${labels.join(', ')}.` : null
}

// ─────────────────────────────────────────────────────────────────
// Samtykke-tekst (godkendt tekst, B-spec §5)
// ─────────────────────────────────────────────────────────────────

export const SAMTYKKE_TITEL = 'Brug mine frø, planter og lokation til personlige råd'
export const SAMTYKKE_TEKST =
  'Slået fra som standard. Slår du det til, kan Gartneren bruge det, der er relevant for dit spørgsmål: ' +
  'dine frø (art, sort, antal), dine planter (art, sort, status, sådato), dit stednavn og vejret nu. ' +
  'Gartneren får aldrig koordinater, adresse, e-mail, dine noter, fotos eller leverandør. ' +
  'Dit spørgsmål og den valgte kontekst sendes til vores AI-leverandør (Anthropic). ' +
  'Du kan slå det fra igen når som helst.'
