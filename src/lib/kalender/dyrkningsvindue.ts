/**
 * Dyrkningsvinduet som datosemantik — hvornår må en maskinafledt opgave ligge?
 *
 * ── Produktreglen (Anna 2/9) ─────────────────────────────────────────────
 *   Det dokumenterede dyrkningsvindue bestemmer, hvornår en maskinafledt
 *   opgave må ligge. `relativeOffsetDays` placerer den kun INDEN I vinduet
 *   og kan aldrig flytte den ud af det.
 *
 * Fuld audit: Docs/product/kalenderregel-semantik-audit.md §8-§9.
 *
 * ── Hvorfor filen findes ─────────────────────────────────────────────────
 * Generatoren daterede efter DB-guidens egen `recommendedMonths`, mens
 * relevansmotoren senere bedømte den samme opgave mod repoets canonical
 * vinduer. To korpora, to vinduer — opgaven kunne fødes uden for det
 * vindue, den bagefter blev målt på. Filen her er det ene opslag, begge
 * sider deler: `VINDUE_FOR_OPGAVETYPE` og resolverne er de SAMME som
 * reminder-relevans bruger, importeret, ikke kopieret.
 *
 * ── Månedslister er MEDLEMSKAB, ikke interval ────────────────────────────
 * Samme fortolkning som reminder-relevans.ts: `[4,5,6,9,10]` er fem
 * gyldige måneder, ikke april-oktober med et hul. Og `[11,12,1,2]` er fire
 * gyldige måneder, ikke et interval der "vender" ved nytår. Al aritmetik
 * herunder spørger derfor kun `months.includes(m)` og regner aldrig fra-til.
 *
 * ── Al dato-aritmetik er UTC ─────────────────────────────────────────────
 * Den gamle beregning brugte `new Date(iso + 'T00:00:00')` (LOKAL midnat)
 * og læste resultatet med `toISOString()` (UTC). På en server i UTC er de
 * ens; på en maskine i dansk sommertid bliver lokal midnat til 22:00 UTC
 * dagen før, og datoen skrider én dag. Her regnes udelukkende i UTC, så
 * resultatet er det samme på Netlify og på Annas Mac.
 */

import {
  resolveFroebankVinduer,
  resolveHoestMaaneder,
} from '@/lib/froebank-autofill'
import { VINDUE_FOR_OPGAVETYPE } from '@/lib/kalender/reminder-relevans'

// ── Dato-primitiver (rene, UTC, YYYY-MM-DD ind og ud) ────────────────────

export interface DatoDele { aar: number; maaned: number; dag: number }

export function delDato(iso: string): DatoDele {
  const [aar, maaned, dag] = iso.slice(0, 10).split('-').map(Number)
  return { aar, maaned, dag }
}

export function samlDato(aar: number, maaned: number, dag: number): string {
  return `${String(aar).padStart(4, '0')}-${String(maaned).padStart(2, '0')}-${String(dag).padStart(2, '0')}`
}

const DAG_MS = 86_400_000

function tilMs(iso: string): number {
  const { aar, maaned, dag } = delDato(iso)
  return Date.UTC(aar, maaned - 1, dag)
}

/** Antal dage mellem to ISO-datoer (b - a). */
export function dagesAfstand(a: string, b: string): number {
  return Math.round((tilMs(b) - tilMs(a)) / DAG_MS)
}

/** ISO-dato N dage efter `iso`. N må være negativ. */
export function plusDage(iso: string, dage: number): string {
  const d = new Date(tilMs(iso) + dage * DAG_MS)
  return d.toISOString().slice(0, 10)
}

/**
 * Dagens dato set fra Europe/Copenhagen.
 *
 * Samme tidszone som `kalenderMaanedKbh` og som SQL'ens `v_today`. En naiv
 * `new Date().toISOString()` er UTC og skifter dato to timer for sent på
 * dansk sommertid — nok til at "vinduet lukkede i går" bliver forkert
 * præcis på den dag, det gælder.
 */
export function idagKbh(nu: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(nu)
}

/** Sidste kalenderdag i måneden — februar i skudår inklusive. */
export function sidsteDagIMaaned(aar: number, maaned: number): number {
  return new Date(Date.UTC(aar, maaned, 0)).getUTCDate()
}

// ── Canonical vindue ─────────────────────────────────────────────────────

export type VindueKilde =
  /** Kun canonical dokumenterer handlingen — reglen tier eller er identisk. */
  | 'canonical'
  /** Reglen indsnævrede canonical: det effektive vindue er fællesmængden. */
  | 'canonical_indsnaevret'
  /** Reglen modsiger canonical (tom fællesmængde) — canonical vandt. */
  | 'canonical_konflikt'
  /** Reglens egen `recommendedMonths` (legacy, kun når canonical tier). */
  | 'regel'
  /** Hverken canonical eller regel dokumenterer et vindue. */
  | 'intet'

export interface Vindue {
  /** Det EFFEKTIVE vindue — det, datoen faktisk skal ligge i. */
  maaneder: number[]
  kilde: VindueKilde
  /** Den ydre faglige grænse, når biblioteket kendte handlingen. */
  canonical: number[] | null
  /** Reglens egen liste, når den havde én. */
  regel: number[] | null
}

/**
 * Artens/sortens canonical vindue for en CANONISK opgavetype.
 *
 * `null` betyder "guiderne tier" — aldrig "ingen aktivitet". De ni typer
 * uden vindue-mapping (pleje, ikke timing) giver også `null`; de har intet
 * dokumenteret vindue at holdes op mod, præcis som i relevansmotoren.
 *
 * Opslaget SKAL ske på den normaliserede type og på plantens navn/sort —
 * altså nøjagtig de værdier, der senere lander i `calendar_tasks` og
 * `plants_v2`. Ellers er vi tilbage ved to korpora.
 */
export function resolveCanoniskVindue(
  opgavetype: string,
  plantName: string,
  variety: string | null,
): number[] | null {
  const handling = VINDUE_FOR_OPGAVETYPE[opgavetype]
  if (!handling) return null

  const maaneder = handling === 'harvest'
    ? resolveHoestMaaneder(plantName, variety)
    : resolveFroebankVinduer(plantName, variety)
        .find(v => v.action === handling)?.months ?? null

  return maaneder && maaneder.length > 0 ? maaneder : null
}

/**
 * Det effektive vindue — canonical som ydre grænse, reglen som præcisering.
 *
 * ── Produktreglen (Anna 2/9, revideret) ──────────────────────────────────
 *   Canonical dyrkningsvindue er den ydre faglige grænse. En regels
 *   `recommendedMonths` må INDSNÆVRE det, men aldrig udvide det.
 *
 * Rækkefølgen:
 *
 *   1. Begge findes → fællesmængden. Er den ikke tom, er den det effektive
 *      vindue. Er den tom, vinder canonical, og konflikten markeres.
 *   2. Kun canonical → canonical.
 *   3. Kun reglen → reglen (legacy fallback).
 *   4. Ingen af dem → intet vindue; kalderen bevarer gammel adfærd.
 *
 * ── Hvorfor fællesmængde og ikke "canonical vinder altid" ────────────────
 * De to lister svarer på forskellige spørgsmål. Canonical siger, hvornår
 * arten KAN høstes; reglen siger, hvornår netop DENNE handling hører
 * hjemme. "Grav dahlia-knolde op før frost" med `[10,11]` inden for
 * canonical `[7,8,9,10]` er ikke en modsigelse — det er en præcisering, og
 * at lade canonical vinde ville datere sæsonafslutningen til 1. juli.
 *
 * ── Hvorfor fællesmængde og ikke "delmængde" ─────────────────────────────
 * En delmængde-test ville falde igennem ved delvist overlap ([10,11] mod
 * [7,8,9,10] er ikke en delmængde) og efterlade os uden regel for det
 * hyppigste tilfælde. Fællesmængden håndterer identisk, delmængde og
 * delvist overlap med én operation — og efterlader præcis ÉN entydig
 * fejlklasse: nul overlap.
 *
 * ── Hvorfor tom fællesmængde ikke bare vælger den ene ────────────────────
 * Nul overlap er ikke en præcisering, det er to kilder, der er uenige om
 * fagligheden (Tomat Lucky Tiger: reglen siger [10], biblioteket siger
 * høsten slutter i september). Canonical vinder — den ydre grænse er den
 * dokumenterede — men `kilde` bærer `canonical_konflikt` med ud, så
 * uenigheden kan tælles og rettes i dataene i stedet for at forsvinde.
 *
 * Fællesmængde er ren MEDLEMSKAB, som alt andet her: diskontinuerte lister
 * og vinduer over årsskiftet falder ud af sig selv, fordi vi aldrig regner
 * fra-til.
 */
export function resolveVindue(
  opgavetype: string,
  plantName: string,
  variety: string | null,
  recommendedMonths: number[] | undefined | null,
): Vindue {
  const canonical = resolveCanoniskVindue(opgavetype, plantName, variety)
  const regel = recommendedMonths && recommendedMonths.length > 0
    ? [...new Set(recommendedMonths)].sort((a, b) => a - b)
    : null

  if (canonical && regel) {
    const snit = canonical.filter(m => regel.includes(m))
    if (snit.length > 0) {
      return {
        maaneder: snit,
        // Identiske lister er ikke en indsnævring — kilden skal kunne
        // skelne "reglen tilføjede information" fra "reglen gentog den".
        kilde: snit.length === canonical.length ? 'canonical' : 'canonical_indsnaevret',
        canonical, regel,
      }
    }
    return { maaneder: canonical, kilde: 'canonical_konflikt', canonical, regel }
  }

  if (canonical) return { maaneder: canonical, kilde: 'canonical', canonical, regel: null }

  // Legacy fallback: 9 af 21 private AI-guides handler om arter, repoets
  // bibliotek slet ikke kender, og dér er reglens egen månedsliste det
  // eneste dokument, der findes. Bedre end ingenting — men den taber sin
  // rolle som autoritet, så snart biblioteket har et svar.
  if (regel) return { maaneder: regel, kilde: 'regel', canonical: null, regel }

  return { maaneder: [], kilde: 'intet', canonical: null, regel: null }
}

// ── Placering inde i vinduet ─────────────────────────────────────────────

export type ClampRetning = 'i_vindue' | 'frem' | 'tilbage'

export interface ClampResultat {
  dato: string
  retning: ClampRetning
}

/**
 * Flyt en ønsket dato ind i vinduet — og kun så langt som nødvendigt.
 *
 * ── Annas kant-regel (2/9) ───────────────────────────────────────────────
 * Kender vi kun MÅNEDER, må vi ikke opfinde en "bedre" dag. Ligger den
 * ønskede dato før vinduet, bruges FØRSTE dag i nærmeste gyldige måned;
 * ligger den efter, bruges SIDSTE dag. Offsettets dag-i-måneden bevares
 * ikke, og `tidsvindue.ts`-konventionen (primo/medio/ultimo) bruges ikke —
 * den beskriver tekstlige vinduer, og her har vi kun månedsmedlemskab.
 *
 *   ønsket 13/4, vindue [5,6]     → 1/5
 *   ønsket 2/7,  vindue [8,9,10]  → 1/8
 *   ønsket 20/11, vindue [8,9,10] → 31/10
 *
 * ── Hvorfor tre år kandiderer ────────────────────────────────────────────
 * Vinduet gentager sig hvert år. Nærmeste gyldige kalenderdato til 10/3 i
 * vinduet [11,12,1,2] er 28/2 SAMME år — ikke 1/11 otte måneder senere.
 * Derfor bygges kandidater i år-1, år og år+1, og den nærmeste vinder.
 * Diskontinuerte lister falder ud af sig selv: hver måned er sin egen
 * kandidat, og der findes intet "interval" at ræsonnere forkert om.
 *
 * ── Hvorfor `tidligst` ───────────────────────────────────────────────────
 * En opgave afledt af en såning kan ikke ligge FØR såningen. Uden den
 * spærre ville en januar-såning med vindue [11,12] blive clampet til 31/12
 * året før — matematisk nærmest, fagligt meningsløst.
 *
 * ── Uafgjort → frem ──────────────────────────────────────────────────────
 * Er kanten lige langt væk i begge retninger, vælges den kommende. En
 * handling må hellere vente end blive dateret ind i noget, der er passeret.
 */
export function clampTilVindue(
  oensket: string,
  maaneder: number[],
  tidligst?: string,
): ClampResultat {
  if (maaneder.length === 0) return { dato: oensket, retning: 'i_vindue' }

  const { aar, maaned } = delDato(oensket)
  if (maaneder.includes(maaned)) return { dato: oensket, retning: 'i_vindue' }

  const kandidater: { dato: string; retning: ClampRetning; afstand: number }[] = []
  for (const kandidatAar of [aar - 1, aar, aar + 1]) {
    for (const m of maaneder) {
      const foer = kandidatAar < aar || (kandidatAar === aar && m < maaned)
      const dag = foer ? sidsteDagIMaaned(kandidatAar, m) : 1
      const dato = samlDato(kandidatAar, m, dag)
      kandidater.push({
        dato,
        retning: foer ? 'tilbage' : 'frem',
        afstand: Math.abs(dagesAfstand(oensket, dato)),
      })
    }
  }

  const tilladte = tidligst
    ? kandidater.filter(k => k.dato >= tidligst)
    : kandidater
  const felt = tilladte.length > 0 ? tilladte : kandidater

  felt.sort((a, b) =>
    a.afstand !== b.afstand
      ? a.afstand - b.afstand
      // Uafgjort: den kommende kant vinder over den passerede.
      : (a.retning === 'frem' ? -1 : 1) - (b.retning === 'frem' ? -1 : 1),
  )
  return { dato: felt[0].dato, retning: felt[0].retning }
}

/**
 * Vinduets åbning set fra en så-dato: første dag i første gyldige måned
 * fra og med såningsmåneden — ellers vinduets første måned året efter.
 *
 * Det er præcis den semantik måneds-grenen altid har haft. Den er bevaret
 * uændret, fordi en regel uden offset ikke har nogen anden information om,
 * hvor inde i vinduet handlingen hører hjemme.
 */
export function foersteDatoIVindue(maaneder: number[], fraDato: string): string | null {
  if (maaneder.length === 0) return null
  const { aar, maaned } = delDato(fraDato)
  const sorteret = [...maaneder].sort((a, b) => a - b)
  const traef = sorteret.find(m => m >= maaned)
  return traef !== undefined
    ? samlDato(aar, traef, 1)
    : samlDato(aar + 1, sorteret[0], 1)
}
