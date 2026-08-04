'use server'

/**
 * Havebog server-aggregeringer — read-only mod eksisterende DB-tabeller
 * (plant_logs, plants_v2, inventory).
 *
 * Returnerer null hvis ingen logget-ind bruger → page.tsx falder tilbage
 * på lokal demo-data fra src/data/havebog-demo.ts.
 *
 * INGEN schema-ændringer. INGEN write-operationer. INGEN ændringer i
 * Kalender/Planter/Frøbank actions.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { havevisdomPulje, forventningsLinje, laantErfaring } from '@/lib/havevisdom'
import { inspirationsSaetninger } from '@/lib/inspiration'
import { byggDagensHistorie, type Opdagelse } from '@/lib/havebog-dagens-historie'
import { beregnSaeson, vaelgSaesonKilde, saesonEtiket, type SaesonInfo, type SaesonStartKilde } from '@/lib/havebog-saeson'
import { parseGerminationDays, quickFactsForNavn } from '@/lib/afledninger'
import type {
  HeroStats,
  OnThisDayEntry,
  RecentNote,
  HistoryYear,
  DenneSaesonFacts,
  ArchivedPlant,
  LogType,
  Tidslinje,
  HeroNarrative,
  NaturFakta,
  IDinHaveTal,
  Vendepunkt,
  Minde,
  MindeKind,
  DagensOpslag,
  InspirerForslag,
  SpisekammerData,
  Dyrkerstatus,
  Kompetenceomraade,
  Bedrift,
} from '@/data/havebog-demo'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { byggProevNaesteAar } from '@/lib/havebog-proev-naeste-aar'
import { resolvePlantCard, resolveSeedCard } from '@/lib/images/resolve-potalot-image'
import { byggSpisekammer } from '@/lib/havebog-spisekammer'
import { byggKompetencer } from '@/lib/havebog-kompetencer'
import { byggDyrkerstatus } from '@/lib/havebog-dyrkerstatus'
import { byggFoersteGange, foersteGangePreview } from '@/lib/havebog-foerste-gange'

export interface HavebogData {
  heroStats: HeroStats
  tidslinje: Tidslinje
  heroNarrative: HeroNarrative
  /** V9 (personlig hilsen): første ord af profiles.display_name */
  fornavn: string | null
  iDinHave: IDinHaveTal
  /** Ildstedet (V16): dagens side — hovedhistorie + støtte-takter */
  dagensOpslag: DagensOpslag
  /** Prøv næste år (Fase C): ét fremadrettet forslag. Null = skjul rummet. */
  inspirerForslag: InspirerForslag | null
  /** Spisekammer (Fase E): sæsonens høst pr. afgrøde. Null = skjul rummet. */
  spisekammer: SpisekammerData | null
  /** Kapitel 3: sæsonens vendepunkter — begivenheder, ikke måneder */
  vendepunkter: Vendepunkt[]
  /** Kapitel 4: kuraterede højdepunkter — sæsonens førster */
  minder: Minde[]
  naturenLigeNu: NaturFakta
  onThisDay: OnThisDayEntry[]
  recentNotes: RecentNote[]
  history: HistoryYear[]
  denneSaeson: DenneSaesonFacts
  archivedPlants: ArchivedPlant[]
  /** Dyrkerstatus (V13): afledte identiteter, prioriteret. Tom = skjul rummet. */
  dyrkerstatus: Dyrkerstatus[]
  bedrifter: Bedrift[]
  /** Kompetencer (V13): afledt af log-handlinger pr. art. Gated: vis ved >= 2 færdigheder. */
  dyrkerkompetencer: Kompetenceomraade[]
}

/**
 * Sæson-fakta-pool. ÉT tal + ÉN editorial sætning per måned.
 *
 * V3.5 (juni 2026 — Annas magasin-typografi-feedback):
 *
 * Tidligere udgaver var 3 lige-store observation-linjer.
 * Anna's reference-opslag rammer det Havebogen mangler: hierarki
 * skabes med STØRRELSE, ikke med farve eller bokse. Et tal læses
 * på under et sekund. "Samme information. 10 gange stærkere."
 *
 * Tallet behøver ikke være temperatur — det kan være +90 min dagslys,
 * 3 planter klar, 127 dage siden såning. Hvad der gør sæsonen
 * konkret denne måned.
 *
 * Roterer pr. måned. Real-data action vælger den måneds-baserede
 * variant.
 */
const NATUREN_LIGE_NU_BY_MONTH: NaturFakta[] = [
  // Januar
  {
    value: '0°',
    statement: 'Sæsonen begynder i frøkataloget.',
  },
  // Februar
  {
    value: '+90 min',
    statement: 'Lyset er ved at vende. Tid til at så chili og peberfrugt.',
  },
  // Marts
  {
    value: '5°',
    statement: 'Krokus og humlebier vender tilbage til de varme pletter.',
  },
  // April
  {
    value: '8°',
    statement: 'Tid til direkte såning af salat, kålrabi og gulerod.',
  },
  // Maj
  {
    value: '12°',
    statement: 'Jorden er klar til hærdning og første udplantning.',
  },
  // Juni (matcher Anna's reference-eksempel)
  {
    value: '14°',
    statement: 'Jordtemperaturen er nu høj nok til tomater og chili.',
  },
  // Juli
  {
    value: '18°',
    statement: 'Tomaterne modner i drivhuset. Vandbehovet topper.',
  },
  // August
  {
    value: '16°',
    statement: 'Hovedhøsten samler sig i kurvene. Aftnerne bliver kortere.',
  },
  // September
  {
    value: '14°',
    statement: 'Frø modner og samles til næste sæson.',
  },
  // Oktober
  {
    value: '10°',
    statement: 'Tid til at grave dahlia-knolde op og dække bede.',
  },
  // November
  {
    value: '4°',
    statement: 'Tid til at sætte hvidløg og forårsløg i den kølige jord.',
  },
  // December
  {
    value: '0°',
    statement: 'Sæsonens noter samles og evalueres.',
  },
]

/**
 * Milestone-værdige log-typer — handlinger med tydeligt dato-anker.
 * "Sætte ud" / "så" / "høste" markerer skred i sæsonen; "note" og
 * "observation" gør ikke (de er løse). Listen er bevidst kort så
 * milestone-sætningen aldrig fortæller om en triviel handling.
 *
 * Format-strenge bruger {plant}-placeholder — beregneren udfylder
 * planten + variety i samme stil som "agurkerne" eller
 * "tomatplanterne", afhængigt af bestemt form.
 */
const MILESTONE_LABEL: Record<string, string> = {
  sowing: 'såede {plant}',
  plant_out: 'satte {plant} ud',
  harvest: 'høstede første {plant}',
  repot: 'priklede {plant} om',
  pruning: 'knibede sideskud på {plant}',
}

/**
 * Bestemt form (plural-flertal) af de almindeligste planter, så
 * milestone-sætningen lyder naturligt: "satte agurkerne ud", ikke
 * "satte Agurk Marketmore ud". Falder tilbage til simpel pluralis-
 * konstruktion hvis navnet ikke er i ordbogen.
 */
const BESTEMT_FLERTAL: Record<string, string> = {
  agurk: 'agurkerne',
  tomat: 'tomatplanterne',
  chili: 'chiliplanterne',
  peberfrugt: 'peberfrugterne',
  salat: 'salaten',
  dild: 'dillen',
  basilikum: 'basilikummen',
  dahlia: 'dahliaerne',
  sukkeraert: 'ærterne',
  stangboenne: 'stangbønnerne',
}

function bestemtFlertal(plantName: string): string {
  const key = plantName.toLowerCase().replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa').split(/[\s-]/)[0]
  return BESTEMT_FLERTAL[key] ?? `${plantName.toLowerCase()}en`
}

const WEEKDAY_NAMES_DA = [
  'Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag',
]

const MONTH_NAMES_DA_LOWER = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

/**
 * Format en dato som "Søndag d. 7. juni" — editorial standardform.
 * Året udelades fordi tidslinjen altid handler om i dag.
 */
function formatDateText(d: Date): string {
  const weekday = WEEKDAY_NAMES_DA[d.getDay()]
  const day = d.getDate()
  const month = MONTH_NAMES_DA_LOWER[d.getMonth()]
  return `${weekday} d. ${day}. ${month}`
}

/**
 * Beregn antal hele dage mellem to datoer (ignorer klokkeslæt).
 */
function daysBetween(from: Date, to: Date): number {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((toMidnight - fromMidnight) / 86400000)
}

/** "2026-05-18" → "18. maj" — bogens datostemme, uden år. */
function formatDagMaaned(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}. ${MONTH_NAMES_DA[d.getMonth()].toLowerCase()}`
}

/**
 * Kapitel 4-byggeren: kuraterede minder — årets FØRSTE af hver
 * milepæls-type. Potalot vælger; brugeren skal ikke kuratere selv.
 * Max 4, sorteret med det nyeste øverst (det friskeste minde først).
 */
function byggMinder(
  logs: PlantLogRow[],
  plantById: Map<string, PlantRow>,
  seasonStart: string | null,
): Minde[] {
  if (!seasonStart) return []
  const MILEPAELE: Array<{ type: string; titel: string; kind: MindeKind }> = [
    { type: 'harvest', titel: 'Første høst', kind: 'hoest' },
    { type: 'germination', titel: 'Første spire', kind: 'spire' },
    { type: 'planting_out', titel: 'Første udplantning', kind: 'udplantning' },
    { type: 'sowing', titel: 'Sæsonens første såning', kind: 'saaning' },
  ]

  const out: Array<Minde & { _date: string }> = []
  for (const m of MILEPAELE) {
    // logs er sorteret nyeste-først — sæsonens FØRSTE af typen er den
    // sidste i listen inden for sæson-vinduet [seasonStart, nu].
    const aaretsLogs = logs.filter(
      l => l.type === m.type && l.date >= seasonStart,
    )
    const foerste = aaretsLogs[aaretsLogs.length - 1]
    if (!foerste) continue
    const plant = plantById.get(foerste.plant_id)
    if (!plant) continue
    const navn = plant.variety ? `${plant.name} ${plant.variety}` : plant.name
    out.push({
      titel: m.titel,
      detalje: navn,
      dato: formatDagMaaned(foerste.date),
      kind: m.kind,
      // Thumbnail: logbilledet hvis der er ét, ellers plantens primærfoto.
      imageUrl: foerste.image_urls?.[0] ?? plant.primary_image_url ?? null,
      // Kort meta-chip fra notens første sætning (holdes stram).
      meta: kortMeta(foerste.note),
      _date: foerste.date,
    })
  }
  return out
    .sort((a, b) => b._date.localeCompare(a._date))
    .slice(0, 4)
    .map(({ _date, ...m }) => m)
}

/** Trim en note til en kort chip (første sætning, maks ~24 tegn). */
function kortMeta(note: string | null): string | undefined {
  if (!note) return undefined
  const foerste = note.split(/[.—–\n]/)[0].trim()
  if (!foerste) return undefined
  return foerste.length > 26 ? undefined : foerste
}

/**
 * Kapitel 3-byggeren: én krønike-linje pr. måned, afledt af månedens
 * V8 afløste måneds-krøniken: mennesker husker ikke deres have som
 * marts/april/maj — de husker begivenheder. Historien organiseres
 * derfor omkring VENDEPUNKTER: årets første af hver fase, fortalt
 * kronologisk som sæsonens buer. Samme data, anden fortælling.
 *
 * Templaterne er bevidst simple — strukturen er det låste; AI kan
 * skrive smukkere linjer senere uden at røre formen.
 */
function byggVendepunkter(
  logs: PlantLogRow[],
  plantById: Map<string, PlantRow>,
  seasonStart: string | null,
): Vendepunkt[] {
  if (!seasonStart) return []
  const FASER: Array<{ type: string; titel: string; linje: (navn: string, dato: string) => string }> = [
    { type: 'sowing',       titel: 'Sæsonen begyndte', linje: (n, d) => `${n} blev sået ${d}.` },
    { type: 'germination',  titel: 'Væksten tog fart', linje: (n, d) => `${n} spirede ${d}.` },
    { type: 'planting_out', titel: 'Ud i det fri',     linje: (n, d) => `${n} flyttede ud ${d}.` },
    { type: 'harvest',      titel: 'Første høst',      linje: (n, d) => `${n} blev høstet ${d}.` },
  ]

  const out: Array<Vendepunkt & { _date: string }> = []
  for (const fase of FASER) {
    // logs er sorteret nyeste-først — sæsonens FØRSTE af typen er den
    // sidste i listen inden for sæson-vinduet.
    const aaretsLogs = logs.filter(
      l => l.type === fase.type && l.date >= seasonStart,
    )
    const foerste = aaretsLogs[aaretsLogs.length - 1]
    if (!foerste) continue
    const plant = plantById.get(foerste.plant_id)
    if (!plant) continue
    const navn = plant.variety ? `${plant.name} ${plant.variety}` : plant.name
    out.push({
      titel: fase.titel,
      detalje: fase.linje(navn, formatDagMaaned(foerste.date)),
      _date: foerste.date,
    })
  }
  // Kronologisk — sæsonens bue fortælles forfra
  return out
    .sort((a, b) => a._date.localeCompare(b._date))
    .map(v => ({ titel: v.titel, detalje: v.detalje }))
}

/**
 * V8: Forfatteren, ikke sekretæren — find en OPDAGELSE.
 *
 * En opdagelse er noget brugeren ikke selv har set: en målt
 * spiretid holdt op mod noget. Mod sidste års spiretid hvis den
 * findes (mest personligt), ellers mod guidens interval (ærligt
 * tilgængeligt allerede på dag 98 — dag 98-reglen).
 *
 * Ingen markant afvigelse → null → Kapitel 1 falder tilbage på
 * status-linjerne. En opdagelse skal være værd at fortælle;
 * "midt i intervallet" er det ikke.
 */
function byggOpdagelse(
  logs: PlantLogRow[],
  plantById: Map<string, PlantRow>,
  seasonStart: string | null,
  prevSeasonStart: string | null,
): Opdagelse | null {
  if (!seasonStart) return null

  // Spiretid: dage fra plantens seneste såning FØR spiringen til spiringen.
  // (Robust på tværs af årsskifter — vi kigger ikke på kalenderår.)
  type Spire = { art: string; variety: string | null; dage: number; dato: string }
  const alle: Spire[] = []
  // Sånings-datoer pr. plante, ældste-først (logs er nyeste-først).
  const sowByPlant = new Map<string, string[]>()
  for (const l of logs) {
    if (l.type !== 'sowing') continue
    const arr = sowByPlant.get(l.plant_id) ?? []
    arr.unshift(l.date) // nyeste-først input → unshift giver ældste-først
    sowByPlant.set(l.plant_id, arr)
  }
  for (const l of logs) {
    if (l.type !== 'germination') continue
    const saaninger = sowByPlant.get(l.plant_id)
    if (!saaninger) continue
    // seneste såning på eller før spiringen
    const sow = [...saaninger].reverse().find(d => d <= l.date)
    if (!sow) continue
    const dage = Math.round((new Date(l.date).getTime() - new Date(sow).getTime()) / 86400000)
    if (dage <= 0 || dage > 90) continue
    const plant = plantById.get(l.plant_id)
    if (!plant) continue
    alle.push({ art: plant.name, variety: plant.variety, dage, dato: l.date })
  }

  // Denne sæson vs. forrige sæson (aktivitet, ikke kalenderår).
  const iAar = alle.filter(s => s.dato >= seasonStart)
  if (iAar.length === 0) return null
  const sidsteAar = prevSeasonStart
    ? alle.filter(s => s.dato >= prevSeasonStart && s.dato < seasonStart)
    : []

  // 1) Sæson-over-sæson pr. art — den mest personlige opdagelse.
  //    Kort overskrift (hændelsen) + underrubrik ("aha"-laget).
  for (const nu of iAar) {
    const foer = sidsteAar.find(s => s.art === nu.art)
    if (foer && Math.abs(nu.dage - foer.dage) >= 3) {
      const navn = capitalize(bestemtFlertal(nu.art))
      const hurtigere = nu.dage < foer.dage
      return {
        overskrift: `${navn} spirede på ${nu.dage} dage`,
        underrubrik: `Sidste sæson tog det ${foer.dage}. I år var de ${hurtigere ? 'hurtigere' : 'langsommere'} end sidst.`,
      }
    }
  }

  // 2) Mod guidens interval — tilgængelig allerede i første sæson.
  let bedste: { opdagelse: Opdagelse; afvigelse: number } | null = null
  for (const nu of iAar) {
    const germ = parseGerminationDays(quickFactsForNavn(nu.art, nu.variety)?.germinationDays)
    if (!germ) continue
    const navn = nu.variety ? `${nu.art} ${nu.variety}` : capitalize(bestemtFlertal(nu.art))
    let opdagelse: Opdagelse | null = null
    let afvigelse = 0
    if (nu.dage < germ.min) {
      afvigelse = germ.min - nu.dage
      opdagelse = {
        overskrift: `${navn} spirede på ${nu.dage} dage`,
        underrubrik: `Guiden regner normalt med ${germ.min}–${germ.max}. I år var de hurtigere end forventet.`,
      }
    } else if (nu.dage > germ.max) {
      afvigelse = nu.dage - germ.max
      opdagelse = {
        overskrift: `${navn} brugte ${nu.dage} dage på at spire`,
        underrubrik: `Guiden regner normalt med ${germ.min}–${germ.max}. I år tog det længere end forventet.`,
      }
    }
    if (opdagelse && (!bedste || afvigelse > bedste.afvigelse)) {
      bedste = { opdagelse, afvigelse }
    }
  }
  return bedste?.opdagelse ?? null
}

const MAANED_FULD_LOWER = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Bygger HeroNarrative ud fra brugerens tilstand.
 *
 * State-detektion:
 *   - Ny bruger: heroStats.notes === 0
 *     → "Din første sæson" + invitation
 *   - Lidt data: notes > 0, men kun nuværende år i historik
 *     → "{Måned} i haven" + milestones fra denne uge
 *   - År 1+: har historik fra tidligere år
 *     → "Velkommen tilbage til {måned}" + på-denne-tid-sidste-år
 *
 * Hver linje i personalText er en hel sætning med punktum — så de
 * kan rendres som adskilte typografiske beats uden at læse som
 * fragmenter.
 */
function buildHeroNarrative(
  heroStats: HeroStats,
  tidslinje: Tidslinje,
  history: HistoryYear[],
  onThisDay: OnThisDayEntry[],
  today: Date,
  /** Aktivitets-sæson (fra beregnSaeson) — driver dag-tæller + sæsonnummer. */
  saeson: SaesonInfo,
  /** Hvilken logtype daterede sæson-start (sowing/germination/planting_out). */
  seasonStartSource: SaesonStartKilde | null,
): HeroNarrative {
  const month = MAANED_FULD_LOWER[today.getMonth()]
  const currentYear = today.getFullYear()
  // Har brugeren en fortid? Enten en tidligere sæson-cyklus, eller
  // historik fra et tidligere kalenderår (driver "Velkommen tilbage"
  // + på-denne-dag-fortællingen).
  const hasYearOnePlusHistory =
    saeson.nummer > 1 || history.some(h => h.year < currentYear)

  // Sæsondag — dagbogs-stemmen ("Dag 66 af din første sæson"). Dag 1 =
  // sæsonens første såning (aktivitet, IKKE kalenderår). Tæller videre
  // over nytår og nulstilles først ved næste sæsons første såning
  // (se lib/havebog-saeson.ts). Tæller kun når der ER sået noget.
  const saesonDag = saeson.start
    ? daysBetween(new Date(saeson.start), today) + 1
    : null
  // Øvre sanity-cap (~11 år) fanger korrupte datoer, men tillader en
  // sæson at løbe forbi 365 dage (Annas eksempel: DAG 366 før ny såning).
  const harSaesonDag = saesonDag !== null && saesonDag >= 1 && saesonDag <= 4000

  const etiket = harSaesonDag ? saesonEtiket(saeson.nummer) : null
  const taeller = {
    saesonDag: harSaesonDag ? saesonDag : null,
    saesonEtiket: etiket,
    seasonStartSource: harSaesonDag ? seasonStartSource : null,
  }

  // ── År 1+: brugeren har tidligere sæsoner ────────────────
  if (hasYearOnePlusHistory) {
    const personalText: string[] = []
    if (onThisDay[0]) {
      const ent = onThisDay[0]
      const yearText = ent.yearsAgo === 1 ? 'sidste år' : `${ent.yearsAgo} år siden`
      const subject = ent.variety ? `${ent.plantName} ${ent.variety}` : ent.plantName
      personalText.push(`På denne tid ${yearText} ${ent.text ? 'noterede du om ' + subject + '.' : 'havde du ' + subject + ' i haven.'}`)
    }
    if (tidslinje.weekNoteCount > 0) {
      personalText.push(
        `Du har skrevet ${tidslinje.weekNoteCount} ${tidslinje.weekNoteCount === 1 ? 'note' : 'noter'} denne uge.`,
      )
    }
    if (personalText.length === 0) {
      personalText.push(`Du dyrker ${heroStats.varieties} ${heroStats.varieties === 1 ? 'sort' : 'sorter'} i år.`)
    }
    return {
      seasonLine: `Velkommen tilbage til ${month}`,
      personalText,
      showStats: heroStats.notes > 0,
      userState: 'year2plus',
      ...taeller,
    }
  }

  // ── Ny bruger: ingen noter overhovedet ────────────────────
  if (heroStats.notes === 0) {
    const sortsLine = heroStats.varieties > 0
      ? `Du dyrker ${heroStats.varieties} ${heroStats.varieties === 1 ? 'sort' : 'sorter'} i år.`
      : 'Sæsonen venter på din første sort.'
    return {
      seasonLine: 'Din første sæson',
      personalText: [
        sortsLine,
        'Om lidt begynder de første minder at samle sig her.',
      ],
      // Stats er bare 0-tal for ny bruger — skjul dem så heroen
      // ikke siger "tom" tre gange i træk.
      showStats: false,
      userState: 'new',
      ...taeller,
    }
  }

  // ── Lidt data: nuværende år, har skrevet noter ───────────
  const beats: string[] = []
  if (tidslinje.milestoneText) {
    // tidslinje.milestoneText er "12 dage siden du satte agurkerne ud"
    // → som hel sætning behøver det bare punktum.
    beats.push(`${tidslinje.milestoneText}.`)
  }
  if (tidslinje.weekNoteCount > 0) {
    beats.push(
      `Du har skrevet ${tidslinje.weekNoteCount} ${tidslinje.weekNoteCount === 1 ? 'note' : 'noter'} denne uge.`,
    )
  }
  if (beats.length === 0) {
    beats.push(`Du dyrker ${heroStats.varieties} ${heroStats.varieties === 1 ? 'sort' : 'sorter'} i år.`)
  }
  // Dagbogs-stemmen (V3.10): "Dag 98 af din første sæson" erstatter
  // "Juni i haven" når der ER en sæson at tælle. Det er den ene
  // sætning der gør Havebogen til en dagbog frem for en app —
  // kaptajnens logbog, ikke et banner. Fallback til måneds-linjen
  // når intet er sået endnu.
  return {
    seasonLine: harSaesonDag
      ? `Dag ${saesonDag} af din første sæson`
      : `${capitalize(month)} i haven`,
    personalText: beats,
    showStats: true,
    userState: 'active',
    ...taeller,
  }
}

interface PlantLogRow {
  id: string
  plant_id: string
  date: string
  type: string
  title: string | null
  note: string | null
  image_urls: string[] | null
}

interface PlantRow {
  id: string
  name: string
  variety: string | null
  status: string
  is_archived: boolean
  archived_year: number | null
  archived_at: string | null
  primary_image_url: string | null
  location: string | null
}

const MONTH_NAMES_DA = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December',
]

export async function getHavebogData(): Promise<HavebogData | null> {
  const me = await getCurrentUser()
  if (!me) return null

  const supabase = await createClient()

  // Robust mod manglende tabeller / fejl: hver query har sin egen
  // fallback. Hvis noget går galt, returnerer vi null → demo-data
  // overtager i page.tsx (bedre end at blokere siden).
  try {
    const [logsRes, plantsRes, inventoryRes, profilRes] = await Promise.all([
      supabase
        .from('plant_logs_v2')
        .select('id, plant_id, date, type, title, note, image_urls')
        .eq('user_id', me.id)
        .order('date', { ascending: false })
        // Bounded: historikken vokser med kontoens alder; 1000 nyeste er
        // rigeligt til alle forside-afledninger uden at hente alt for evigt.
        .limit(1000),
      supabase
        .from('plants_v2')
        .select('id, name, variety, status, is_archived, archived_year, archived_at, primary_image_url, location')
        .eq('user_id', me.id),
      supabase
        // V12: hent navn+sort (ikke kun count) — inspirations-motoren
        // skal kunne sige noget om brugerens egne sorter. V13: + subcategory_id
        // til Dyrkerstatus (blomster/krydderurter). Ingen migration — felterne
        // findes (00016/00017).
        .from('inventory_items')
        .select('name, variety, subcategory_id')
        .eq('user_id', me.id),
      supabase
        .from('profiles')
        .select('display_name')
        .eq('id', me.id)
        .maybeSingle(),
    ])

    const logs = (logsRes.data ?? []) as PlantLogRow[]
    const plants = (plantsRes.data ?? []) as PlantRow[]
    const inventoryItems = (inventoryRes.data ?? []) as Array<{ name: string; variety: string | null; subcategory_id: string | null }>
    const inventoryCount = inventoryItems.length
    // V9 (personlig hilsen): fornavn = første ord af display_name
    const fornavn =
      profilRes.data?.display_name?.trim().split(/\s+/)[0] || null

    const plantById = new Map(plants.map(p => [p.id, p]))
    const plantName = (id: string): string => plantById.get(id)?.name ?? '—'
    const plantVariety = (id: string): string | undefined =>
      plantById.get(id)?.variety ?? undefined

    const today = new Date()
    const currentYear = today.getFullYear()

    // ── Aktivitets-sæson ─────────────────────────────────────
    // Sæsonen følger AKTIVITET, ikke kalenderåret: den løber fra årets
    // første såning til næste års første såning (se lib/havebog-saeson.ts).
    // seasonStart bruges som "denne sæson"-vindue [seasonStart, nu] i
    // alle deriveringer nedenfor — så intet nulstilles 1. januar.
    // Sæson-start efter prioritet (Anna 13/7): sowing → germination →
    // planting_out. Så en dyrker der starter fra købte spirer/stiklinger eller
    // først logger spiring/udplantning stadig får dagtælleren. Aldrig harvest.
    const { datoer: saesonDatoer, kilde: seasonStartSource } = vaelgSaesonKilde({
      sowing: logs.filter(l => l.type === 'sowing').map(l => l.date),
      germination: logs.filter(l => l.type === 'germination').map(l => l.date),
      planting_out: logs.filter(l => l.type === 'planting_out').map(l => l.date),
    })
    const saeson = beregnSaeson(saesonDatoer)
    const seasonStart = saeson.start

    // ── Hero stats ───────────────────────────────────────────
    const harvestsThisYear = logs.filter(
      l => l.type === 'harvest' && seasonStart !== null && l.date >= seasonStart,
    ).length
    const heroStats: HeroStats = {
      notes: logs.length,
      varieties: inventoryCount,
      harvests: harvestsThisYear,
    }

    // ── Tidslinje (editorial "du er her"-linje under hero) ───
    // dateText: i dag, lokaliseret
    // milestoneText: nyeste milestone-værdige log (sowing/plant_out/
    //   harvest/repot/pruning) → "12 dage siden du satte agurkerne ud"
    // weekNoteCount: alle logs de seneste 7 dage (alle typer tæller)
    //
    // Alle felter kan stå alene; HavebogHero render'er kun de dele
    // der har værdi.
    const dateText = formatDateText(today)

    const milestoneLog = logs.find(l => l.type in MILESTONE_LABEL)
    let milestoneText: string | null = null
    if (milestoneLog) {
      const daysAgo = daysBetween(new Date(milestoneLog.date), today)
      // Kun vis milestones inden for det sidste år — ældre er ikke
      // længere "lige nu"-relevant og dræber tonen.
      if (daysAgo >= 0 && daysAgo <= 365) {
        const plant = bestemtFlertal(plantName(milestoneLog.plant_id))
        const verb = MILESTONE_LABEL[milestoneLog.type].replace('{plant}', plant)
        const dayWord = daysAgo === 0
          ? 'I dag'
          : daysAgo === 1
            ? 'I går'
            : `${daysAgo} dage siden`
        milestoneText = daysAgo <= 1
          ? `${dayWord} ${verb}`
          : `${dayWord} du ${verb}`
      }
    }

    const weekAgo = new Date(today.getTime() - 7 * 86400000)
    const weekNoteCount = logs.filter(l => new Date(l.date) >= weekAgo).length

    const tidslinje: Tidslinje = { dateText, milestoneText, weekNoteCount }

    // ── På denne dag ─────────────────────────────────────────
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()
    const onThisDay: OnThisDayEntry[] = logs
      .filter(l => {
        const d = new Date(l.date)
        return (
          d.getMonth() + 1 === todayMonth &&
          d.getDate() === todayDay &&
          d.getFullYear() < currentYear
        )
      })
      .slice(0, 3)
      .map(l => ({
        yearsAgo: currentYear - new Date(l.date).getFullYear(),
        plantName: plantName(l.plant_id),
        variety: plantVariety(l.plant_id),
        text: l.note ?? l.title ?? '',
        imageUrl: l.image_urls?.[0] ?? null,
        // Destination: plantens timeline. Uden plante-kilde → ingen href
        // (modulet skjules af kuratoren, jf. produktreglen).
        href: l.plant_id ? `/mine-planter/${l.plant_id}` : null,
        sourceType: 'plant' as const,
        sourceId: l.plant_id ?? null,
      }))

    // ── Seneste noter (5) ────────────────────────────────────
    const recentNotes: RecentNote[] = logs.slice(0, 5).map(l => ({
      type: (l.type as LogType) ?? 'note',
      plantName: plantName(l.plant_id),
      variety: plantVariety(l.plant_id),
      text: l.note ?? l.title ?? '',
      date: l.date,
    }))

    // ── Historik (år → måneder) med metadata ─────────────────
    const byYearMonth = new Map<
      number,
      Map<number, { logs: PlantLogRow[]; varieties: Set<string> }>
    >()
    for (const l of logs) {
      const d = new Date(l.date)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      if (!byYearMonth.has(y)) byYearMonth.set(y, new Map())
      const monthsMap = byYearMonth.get(y)!
      if (!monthsMap.has(m)) monthsMap.set(m, { logs: [], varieties: new Set() })
      const bucket = monthsMap.get(m)!
      bucket.logs.push(l)
      const p = plantById.get(l.plant_id)
      if (p) bucket.varieties.add(`${p.name}|${p.variety ?? ''}`)
    }
    const history: HistoryYear[] = [...byYearMonth.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, monthsMap]) => ({
        year,
        months: [...monthsMap.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([monthIdx, bucket]) => {
            const imageUrls = bucket.logs
              .flatMap(l => l.image_urls ?? [])
              .filter(Boolean)
            return {
              monthIdx,
              monthName: MONTH_NAMES_DA[monthIdx - 1],
              noteCount: bucket.logs.length,
              imageCount: imageUrls.length,
              varietyCount: bucket.varieties.size,
              imageUrls: imageUrls.slice(0, 12),
            }
          }),
      }))

    // ── Denne sæson (3 faktuelle kort) ───────────────────────
    const senesteHoest = logs.find(l => l.type === 'harvest')
    const senesteNote = logs.find(
      l => l.type === 'note' || l.type === 'observation' || l.type === 'reminder',
    )
    const senesteBillede = logs.find(l => (l.image_urls?.length ?? 0) > 0)
    const denneSaeson: DenneSaesonFacts = {
      senesteHoest: senesteHoest
        ? {
            plantName: plantName(senesteHoest.plant_id),
            variety: plantVariety(senesteHoest.plant_id),
            date: senesteHoest.date,
            text: senesteHoest.note ?? senesteHoest.title ?? undefined,
          }
        : null,
      senesteNote: senesteNote
        ? {
            plantName: plantName(senesteNote.plant_id),
            variety: plantVariety(senesteNote.plant_id),
            date: senesteNote.date,
            text: senesteNote.note ?? senesteNote.title ?? '',
            type: (senesteNote.type as LogType) ?? 'note',
          }
        : null,
      senesteBillede:
        senesteBillede && senesteBillede.image_urls && senesteBillede.image_urls[0]
          ? {
              plantName: plantName(senesteBillede.plant_id),
              variety: plantVariety(senesteBillede.plant_id),
              date: senesteBillede.date,
              imageUrl: senesteBillede.image_urls[0],
            }
          : null,
    }

    // ── Arkiverede planter ───────────────────────────────────
    const archivedPlants: ArchivedPlant[] = plants
      .filter(p => p.is_archived)
      .sort((a, b) => (b.archived_at ?? '').localeCompare(a.archived_at ?? ''))
      .map(p => ({
        id: p.id,
        name: p.name,
        variety: p.variety,
        primaryImageId: p.primary_image_url,
        archivedYear:
          p.archived_year ??
          (p.archived_at ? new Date(p.archived_at).getFullYear() : currentYear),
      }))

    const heroNarrative = buildHeroNarrative(
      heroStats, tidslinje, history, onThisDay, today, saeson, seasonStartSource,
    )

    // "I DIN HAVE" — åbningstallene (V4-mockup). Stilhed ved huller:
    //   aktiveSorter      = frøbankens sorter (findes altid som tal)
    //   klarTilUdplantning= status-count på ikke-arkiverede planter
    //   arterRigere       = distinkte arter i år vs. sidste år (logs);
    //                       kun vist når begge år har data og
    //                       differencen er positiv
    const klarTilUdplantning = plants.filter(
      p => !p.is_archived && p.status === 'klar_til_udplantning',
    ).length

    const arterPrAar = (yr: number) => {
      const arter = new Set<string>()
      for (const l of logs) {
        if (!l.date.startsWith(String(yr))) continue
        const p = plantById.get(l.plant_id)
        if (p) arter.add(p.name)
      }
      return arter.size
    }
    const arterIAar = arterPrAar(currentYear)
    const arterSidsteAar = arterPrAar(currentYear - 1)
    const arterRigere =
      arterSidsteAar > 0 && arterIAar > arterSidsteAar
        ? arterIAar - arterSidsteAar
        : null

    const iDinHave: IDinHaveTal = {
      aktiveSorter: heroStats.varieties,
      klarTilUdplantning: klarTilUdplantning > 0 ? klarTilUdplantning : null,
      arterRigere,
    }

    // ── ILDSTEDET (V15): "Havens stemme i dag" ────────────────
    // Havebogens centrum. Ikke en sektion blandt mange — det ene
    // sted der samler alt. De eksisterende motorer væves til ÉN
    // flydende stemme (brevet), takt for takt: nutid → din have →
    // inspiration → blik fremad. Ingen nye data, ingen features.
    //
    // Daglig variation kommer fra rotationen på inspiration + det
    // fremadrettede led (dagNr). Opdagelsen er aktuel; nutids-
    // ankeret skifter pr. måned. Ærligheds-reglen gælder hver takt.
    const maaned1 = today.getMonth() + 1
    const dagNr = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
    )
    const opdagelse = byggOpdagelse(logs, plantById, seasonStart, saeson.forrigeStart)
    const dyrkedeSorter = [
      ...inventoryItems,
      ...plants.filter(p => !p.is_archived).map(p => ({ name: p.name, variety: p.variety })),
    ]
    const inspirationer = inspirationsSaetninger(dyrkedeSorter)
    const erNy = heroNarrative.userState === 'new'

    const ligeNuFakta = NATUREN_LIGE_NU_BY_MONTH[today.getMonth()]

    // V16 + Fase B: én DAGSSIDE med redaktion — én hovedhistorie +
    // støtte-takter. Lead vælges af Dagens historie-motoren efter Annas
    // prioritering (frisk personlig milepæl > guideviden). Se
    // byggDagensHistorie for vægtning og recency-regler.
    const dagensOpslag = byggDagensHistorie({
      logs,
      plant: (id: string) => plantById.get(id),
      seasonStart,
      today,
      opdagelse,
      onThisDay,
      ligeNuFakta,
      inspirationer,
      klarTilUdplantning,
      erNy,
      maaned1,
      dagNr,
    })

    // ── Prøv næste år (Fase C) ────────────────────────────────
    // Fremadblik: sammenlign brugerens sorter/arter + høst med guide-
    // kataloget → ét konkret forslag til næste sæson. Kun ægte data;
    // null skjuler rummet for indloggede. Se lib/havebog-proev-naeste-aar.
    const proevKatalog = IMPORTED_GUIDES
      .filter(g => g.guideLevel === 'variety' && g.variety)
      .map(g => ({
        art: g.plantName,
        variety: g.variety as string,
        tags: g.tags ?? [],
        harvestMonths: g.quickFacts?.harvestMonths ?? [],
        difficulty: g.difficulty ?? null,
        billede: g.primaryImageId ?? null,
        id: g.id ?? null,
      }))
    const proevDyrkede = [
      ...inventoryItems.map(i => ({ art: i.name, variety: i.variety })),
      ...plants.filter(p => !p.is_archived).map(p => ({ art: p.name, variety: p.variety })),
    ]
    // A: forankr frøavl/køkken i brugerens egne sorter med ÆGTE foto —
    // upload/kurateret frøkort/plantekort for den præcise sort (aldrig
    // cross-sort; source==='fallback' = placeholder → tæller som intet foto).
    const egneSorter = [
      ...plants
        .filter(p => !p.is_archived)
        .map(p => {
          const img = resolvePlantCard({ name: p.name, variety: p.variety, preferredSrc: p.primary_image_url })
          return { art: p.name, billede: img.source !== 'fallback' ? img.src : null }
        }),
      ...inventoryItems.map(i => {
        const img = resolveSeedCard({ name: i.name, variety: i.variety })
        return { art: i.name, billede: img.source !== 'fallback' ? img.src : null }
      }),
    ]
    const hoestPrArt: Record<string, number> = {}
    const hoestEntries: { art: string; date: string }[] = []
    for (const l of logs) {
      if (l.type !== 'harvest') continue
      if (seasonStart !== null && l.date < seasonStart) continue
      const p = plantById.get(l.plant_id)
      if (!p) continue
      hoestPrArt[p.name] = (hoestPrArt[p.name] ?? 0) + 1
      hoestEntries.push({ art: p.name, date: l.date })
    }
    // ── Spisekammer (Fase E) — sæsonens høst grupperet pr. afgrøde ──
    const spisekammer = byggSpisekammer(hoestEntries)
    // Href-kilder til frøavl-leadet (læringshandling → guide, ikke frøbank).
    // artGuide = species/arts-guides (id = artKey, fx "tomat"). froeavlGuide =
    // dedikerede frøavls-guides — findes ikke endnu (→ backlog), så tom map.
    const artKeyOf = (s: string) => s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').trim().split(/[\s-]/)[0]
    const artGuide: Record<string, string> = {}
    for (const g of IMPORTED_GUIDES) {
      if (g.guideLevel === 'species' && g.id) artGuide[artKeyOf(g.plantName)] = g.id
    }
    const froeavlGuide: Record<string, string> = {}
    const proev = byggProevNaesteAar({ dyrkede: proevDyrkede, katalog: proevKatalog, hoestPrArt, egneSorter, artGuide, froeavlGuide })
    const inspirerForslag: InspirerForslag | null = proev
      ? {
          kicker: proev.kicker,
          navn: proev.navn,
          begrundelse: proev.begrundelse,
          billede: proev.billede ?? undefined,
          sekundaer: proev.sekundaer,
          kandidater: proev.kandidater, // lead-egnede (foto) — klienten roterer
        }
      : null

    // ── Kapitel 3: Sæsonens vendepunkter (V8) ─────────────────
    // Begivenheder, ikke måneder: årets første af hver fase,
    // fortalt kronologisk. Linjerne kan senere skrives af AI;
    // strukturen er låst nu.
    const vendepunkter = byggVendepunkter(logs, plantById, seasonStart)

    // ── Kapitel 4: Minder — kuraterede førster (V7) ───────────
    // Potalot VÆLGER: årets første af hver milepæls-type, max 4.
    // Ikke alle logs, ikke et galleri — kun højdepunkterne.
    const minder = byggMinder(logs, plantById, seasonStart)

    // I haven lige nu — ÉN fakta per aktuel måned
    const naturenLigeNu = NATUREN_LIGE_NU_BY_MONTH[today.getMonth()]

    // Dyrkerstatus + Kompetencer (V13): rene derivere af eksisterende data.
    const dyrkerkompetencer = byggKompetencer(logs, plantById)
    const dyrkerstatus = byggDyrkerstatus({
      logs,
      plantById,
      seasonStart,
      plants,
      inventory: inventoryItems,
    })

    // Første gange (V1) — beviselige milepæle af logs/plantefelter. Havebog-
    // preview: nyeste først, max 4. Deriveren selv returnerer kronologisk.
    const bedrifter = foersteGangePreview(byggFoersteGange(logs, plantById), 4)

    return {
      heroStats,
      tidslinje,
      heroNarrative,
      fornavn,
      iDinHave,
      dagensOpslag,
      inspirerForslag,
      spisekammer,
      vendepunkter,
      minder,
      naturenLigeNu,
      onThisDay,
      recentNotes,
      history,
      denneSaeson,
      archivedPlants,
      dyrkerstatus,
      dyrkerkompetencer,
      bedrifter,
    }
  } catch {
    return null
  }
}
