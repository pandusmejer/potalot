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
  /** Repoets guidebibliotek — samme opslag som reminder-relevans. */
  | 'canonical'
  /** Reglens egen `recommendedMonths` (legacy, kun når canonical tier). */
  | 'regel'
  /** Hverken canonical eller regel dokumenterer et vindue. */
  | 'intet'

export interface Vindue {
  maaneder: number[]
  kilde: VindueKilde
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
 * Vinduet i låst rækkefølge: canonical → reglens `recommendedMonths` → intet.
 *
 * Fallbacket til reglens eget vindue er bevidst legacy: 9 af 21 private
 * AI-guides handler om arter, repobiblioteket slet ikke kender, og dér er
 * reglens egen månedsliste det eneste dokument, der findes. Det er bedre
 * end ingenting — men det taber, så snart biblioteket har et svar.
 */
export function resolveVindue(
  opgavetype: string,
  plantName: string,
  variety: string | null,
  recommendedMonths: number[] | undefined | null,
): Vindue {
  const canonical = resolveCanoniskVindue(opgavetype, plantName, variety)
  if (canonical) return { maaneder: canonical, kilde: 'canonical' }
  if (recommendedMonths && recommendedMonths.length > 0) {
    return { maaneder: [...recommendedMonths].sort((a, b) => a - b), kilde: 'regel' }
  }
  return { maaneder: [], kilde: 'intet' }
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
