/**
 * Dagens historie-motoren (Fase B, 7. juli 2026) — Havebogens rygrad.
 *
 * Ren kandidat-vælger: den vælger dagens hovedhistorie som en redaktør
 * med dømmekraft. En FRISK personlig milepæl fra brugerens egen have
 * slår altid generel guideviden. Prioritet (Annas spec):
 *
 *   1 frisk første høst · 2 frisk knop/blomst · 3 frisk spiring ·
 *   4 udplantning · 5 markant guideafvigelse · 6 gentagelse (på denne
 *   dag) · 7 vejr/plantevindue · 8 rolig sæsonlinje (fallback).
 *
 * Personlig hændelse > generel viden. Recency vægter: dagens/de seneste
 * dages hændelser løftes; ældre falder. reason-felterne er interne og må
 * ALDRIG vises i UI. Ingen fabrikerede tal — kun brugerens egne logs +
 * guide-/sæson-viden (ærligheds-reglen).
 *
 * NB: der findes INGEN 'knop'/'blomstring'-log-type endnu (PlantLogType),
 * så #2 kan ikke detekteres ærligt fra ægte logs — det slot aktiveres
 * først når en blomstrings-type/-felt lander. Alle andre niveauer har kilde.
 *
 * Isoleret fra server-actionen, så logikken kan testes rent
 * (scripts/test-dagens-historie.ts). Actionen kalder blot ind.
 */

import { havevisdomPulje, forventningsLinje, laantErfaring } from '@/lib/havevisdom'
import type { OnThisDayEntry, NaturFakta, DagensOpslag, Takt } from '@/data/havebog-demo'

/** Minimal log-form motoren bruger (strukturelt kompatibel med DB-rækken). */
export interface HistorieLog {
  plant_id: string
  date: string // YYYY-MM-DD, logs leveres nyeste-først
  type: string
}

/** Minimal plante-form motoren bruger. */
export interface HistoriePlant {
  name: string
  variety: string | null
}

/** Opdagelse (spiretid vs. guide/sæson): kort overskrift + "aha"-underrubrik. */
export interface Opdagelse {
  overskrift: string
  underrubrik: string
}

export interface DagensHistorieInput {
  logs: HistorieLog[]
  /** Slå plante op på id — undgår Map-varians mellem action og lib. */
  plant: (id: string) => HistoriePlant | undefined
  /** Aktuel sæsons start (ISO) — "denne sæson"-vinduet [seasonStart, nu]. */
  seasonStart: string | null
  today: Date
  /** Spiretid-opdagelse (fra byggOpdagelse) — overskrift + underrubrik, eller null. */
  opdagelse: Opdagelse | null
  onThisDay: OnThisDayEntry[]
  ligeNuFakta: NaturFakta | null
  inspirationer: string[]
  klarTilUdplantning: number
  erNy: boolean
  maaned1: number
  dagNr: number
}

interface HistorieKandidat {
  score: number
  kicker: string
  tekst: string
  /** Undertekst — kun relevant på lead'en (fx "aha"-laget). */
  underrubrik?: string
  /** grov gruppe, så en støtte-takt ikke gentager lead'ens pointe */
  gruppe: string
  /** intern begrundelse — ALDRIG i UI */
  reason: string
}

const MONTH_NAMES_DA_LOWER = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

/** Hele dage mellem to datoer (ignorer klokkeslæt). */
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((b - a) / 86400000)
}

/** "2026-05-18" → "18. maj" — bogens datostemme, uden år. */
function formatDagMaaned(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}. ${MONTH_NAMES_DA_LOWER[d.getMonth()]}`
}

/** Recency-vægt: friske hændelser løftes, ældre falder (Annas regel). */
function recencyFaktor(dage: number): number {
  if (dage <= 1) return 1
  if (dage <= 3) return 0.94
  if (dage <= 7) return 0.82
  if (dage <= 14) return 0.62
  if (dage <= 30) return 0.46
  return 0.3
}

// Naturlig flertalsform til høst-sætninger ("De første jordbær kom i dag").
const HOEST_FLERTAL: Record<string, string> = {
  jordbaer: 'jordbær', tomat: 'tomater', agurk: 'agurker', chili: 'chili',
  peberfrugt: 'peberfrugter', salat: 'salathoveder', sukkeraert: 'ærter',
  aert: 'ærter', stangboenne: 'bønner', kartoffel: 'kartofler',
  gulerod: 'gulerødder', squash: 'squash', radise: 'radiser', roedbede: 'rødbeder',
}
function hoestFlertal(plantName: string): string | null {
  const key = plantName.toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .split(/[\s-]/)[0]
  return HOEST_FLERTAL[key] ?? null
}

/**
 * For hver plante: dens FØRSTE log af typen i sæsonen. Returnér den
 * friskeste (nyeste dato) blandt disse "førster" + hvor mange dage siden.
 * Så en fersk første-høst af ét afgrøde surfacer, selv om et andet blev
 * høstet før. Vinduet er [seasonStart, nu] — aktivitet, ikke kalenderår.
 */
function friskesteFoerste(
  logs: HistorieLog[], type: string, seasonStart: string, today: Date,
): { log: HistorieLog; dage: number } | null {
  const foersteByPlant = new Map<string, HistorieLog>()
  for (const l of logs) { // logs er nyeste-først → sidste write pr. plante = tidligste
    if (l.type !== type || l.date < seasonStart) continue
    foersteByPlant.set(l.plant_id, l)
  }
  let best: HistorieLog | null = null
  for (const l of foersteByPlant.values()) if (!best || l.date > best.date) best = l
  if (!best) return null
  return { log: best, dage: daysBetween(new Date(best.date), today) }
}

/**
 * Vælg dagens hovedhistorie + støtte-takter. Ren funktion; samme input
 * → samme output. Se fil-headeren for prioriteringen.
 */
export function byggDagensHistorie(input: DagensHistorieInput): DagensOpslag {
  const {
    logs, plant, seasonStart, today, opdagelse, onThisDay,
    ligeNuFakta, inspirationer, klarTilUdplantning, erNy, maaned1, dagNr,
  } = input

  const navnAf = (l: HistorieLog): string => {
    const p = plant(l.plant_id)
    if (!p) return 'planterne'
    return p.variety ? `${p.name} ${p.variety}` : p.name
  }
  const dagOrd = (dage: number, dato: string): string =>
    dage === 0 ? 'i dag' : dage === 1 ? 'i går' : formatDagMaaned(dato)
  // Frisk "første af typen i sæsonen" — kun når der ER en sæson.
  const foerste = (type: string) =>
    seasonStart ? friskesteFoerste(logs, type, seasonStart, today) : null

  const kand: HistorieKandidat[] = []

  // 1 · Frisk første høst — sæsonens pay-off, stærkest.
  const hoest = foerste('harvest')
  if (hoest) {
    const p = plant(hoest.log.plant_id)
    const flertal = p ? hoestFlertal(p.name) : null
    const tekst = hoest.dage === 0
      ? flertal ? `De første ${flertal} kom i dag.` : `Årets første ${navnAf(hoest.log)} er høstet i dag.`
      : hoest.dage <= 3
        ? flertal ? `De første ${flertal} er høstet.` : `Årets første ${navnAf(hoest.log)} er høstet.`
        : flertal ? `De første ${flertal} blev høstet ${formatDagMaaned(hoest.log.date)}.`
          : `Årets første ${navnAf(hoest.log)} blev høstet ${formatDagMaaned(hoest.log.date)}.`
    kand.push({ score: 100 * recencyFaktor(hoest.dage), kicker: 'Fra din have', tekst, gruppe: 'hoest', reason: `frisk første høst, ${hoest.dage} dage` })
  }

  // 3 · Frisk spiring — bruger den rigere guide-/år-opdagelse hvis den
  //     findes (dækker samtidig #5 guideafvigelse om samme fase).
  const spiring = foerste('germination')
  if (spiring) {
    const tekst = opdagelse?.overskrift ?? `${navnAf(spiring.log)} er spiret.`
    kand.push({ score: (opdagelse ? 84 : 82) * recencyFaktor(spiring.dage), kicker: 'Fra din have', tekst, underrubrik: opdagelse?.underrubrik, gruppe: 'spiring', reason: opdagelse ? 'frisk spiring m. opdagelse' : 'frisk spiring' })
  } else if (opdagelse) {
    // 5 · Guideafvigelse uden fersk spiring-event (fx sæson-over-sæson).
    kand.push({ score: 60, kicker: 'Fra din have', tekst: opdagelse.overskrift, underrubrik: opdagelse.underrubrik, gruppe: 'spiring', reason: 'guideafvigelse uden fersk event' })
  }

  // 4 · Frisk udplantning / flyttet ud.
  const udplant = foerste('planting_out')
  if (udplant) {
    kand.push({ score: 72 * recencyFaktor(udplant.dage), kicker: 'Fra din have', tekst: `${navnAf(udplant.log)} flyttede ud ${dagOrd(udplant.dage, udplant.log.date)}.`, gruppe: 'udplantning', reason: `udplantning ${udplant.dage} dage` })
  }

  // Tydelig ændring/CTA — planter klar til at komme ud.
  if (klarTilUdplantning > 0) {
    kand.push({ score: 50, kicker: 'Klar nu', tekst: klarTilUdplantning === 1 ? 'En af dine planter er klar til at komme udenfor.' : 'Flere af dine planter er klar til at komme udenfor.', gruppe: 'status', reason: 'klar til udplantning' })
  }

  // 6 · Gentagelse — på denne dag tidligere år.
  const otd = onThisDay[0]
  if (otd) {
    const navn = otd.variety ? `${otd.plantName} ${otd.variety}` : otd.plantName
    const aar = otd.yearsAgo === 1 ? 'Sidste år' : `For ${otd.yearsAgo} år siden`
    kand.push({ score: 42, kicker: 'På denne dag', tekst: otd.text ? `${aar} på denne dag: ${otd.text}` : `${aar} på denne dag skrev du om ${navn}.`, gruppe: 'gentagelse', reason: 'på denne dag' })
  }

  // Ny bruger uden egne hændelser — lånt erfaring holder liv i siden.
  if (erNy) {
    kand.push({ score: 36, kicker: 'Fra fællesskabet', tekst: laantErfaring(maaned1).ligeNu, gruppe: 'laant', reason: 'ny bruger — lånt erfaring' })
  }

  // 7 · Vejr / plantevindue — månedens naturfakta som stemning.
  if (ligeNuFakta) {
    kand.push({ score: 26, kicker: 'Lige nu i haven', tekst: ligeNuFakta.statement, gruppe: 'vejr', reason: 'månedens naturfakta' })
  }

  // Inspiration om egne sorter (roterer pr. dag).
  const visdom = havevisdomPulje(maaned1)
  const inspTekst = inspirationer.length > 0
    ? inspirationer[dagNr % inspirationer.length]
    : visdom[dagNr % visdom.length]
  kand.push({ score: 20, kicker: 'Fra haven', tekst: inspTekst, gruppe: 'inspiration', reason: 'inspiration/havevisdom' })

  // 8 · Blik fremad — lukker altid med forventning (V16), aldrig lead.
  const fremad: HistorieKandidat = { score: 16, kicker: 'På denne tid af året', tekst: forventningsLinje(maaned1, dagNr), gruppe: 'fremad', reason: 'blik fremad' }
  kand.push(fremad)

  // Lead = højeste score. Beats = resten, faldende score, unik gruppe,
  // uden lead'ens gruppe. Luk altid med "fremad" (medmindre det er lead).
  const sorteret = [...kand].sort((a, b) => b.score - a.score)
  const lead = sorteret[0]
  const beats: Takt[] = []
  const brugteGrupper = new Set([lead.gruppe])
  for (const k of sorteret.slice(1)) {
    if (brugteGrupper.has(k.gruppe) || k.gruppe === 'fremad') continue
    brugteGrupper.add(k.gruppe)
    beats.push({ kicker: k.kicker, tekst: k.tekst })
    // Maks 2 her + den afsluttende "fremad" = 3 støtte-takter, samme
    // rytme som det shippede Ildsted (lead + 3).
    if (beats.length >= 2) break
  }
  if (lead.gruppe !== 'fremad') beats.push({ kicker: fremad.kicker, tekst: fremad.tekst })

  return {
    lead: { kicker: 'Dagens historie', tekst: lead.tekst, underrubrik: lead.underrubrik },
    beats,
  }
}
