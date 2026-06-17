/**
 * Dagens fokus — Kalenderens mentor-hjerne (BRAIN, inkrement 1).
 *
 * Ren afledningsfunktion uden DB-kald. Svarer på Kalenderens ene
 * spørgsmål: "Hvad er det vigtigste jeg gør i haven i dag?" — ved at
 * KOGE alt systemet allerede ved ned til 1-3 fokus-handlinger.
 *
 * Produktlogik: Docs/product/kalender-v2.md (mentor-model, prioriterings-
 * lagene 1-5, stilhed-er-en-feature, degradations-stigen).
 * Grænseregel: Docs/design-system/sektion-roller.md — Kalender formulerer
 * ALT som handling i BYDEFORM ("Udplant", "Høst", "Prikl"), aldrig tilstand
 * (det er Planters sætning).
 *
 * Den genbruger de atomare afledninger i lib/afledninger.ts (forventetSpiring
 * m.fl.) — den opfinder dem ikke. Hjernen er KOMPOSITIONEN: lagene,
 * prioriteringen, stilheden, completions-bevidstheden.
 *
 * ── Inkrement-status ──────────────────────────────────────────────
 *   ✅ inkrement 1: lag 2 (status-afledt) + lag 3 (verifikation)
 *      + lag 4 (frøbank × måned) + max-3 + stilhed + completions.
 *   ✅ inkrement 2 (her): lag 1 (tidskritisk — frost × frostfølsomme udplantede).
 *   ⏳ inkrement 3: degradations-stigen trin 0/1 (almanak + frøbank-only tekst).
 *   ⏳ inkrement 4: fuld tie-breaking (deadline → flest planter → guide-
 *      prioritet) + lag 5 (vedligehold).
 *   ⏳ senere: trin 3 (historik — kræver arkivdata).
 *
 * INGEN UI her. Output testes i Node mod demo-data
 * (scripts/test-dagens-fokus.ts).
 */

import type { InventoryItem, Plant } from '@/lib/types'
import type { GardenAlert } from '@/actions/weather'
import { forventetSpiring, quickFactsForNavn } from '@/lib/afledninger'
import { dageSiden } from '@/lib/datetime'

/** Prioriteringslag fra kalender-v2.md §Prioriteringsmodellen. */
export type FokusLag = 1 | 2 | 3 | 4 | 5

/** Stabil opgavetype — indgår i task_key, så afkrydsning persisterer på tværs af reloads. */
export type FokusTaskType =
  | 'daek'
  | 'udplant'
  | 'hoest'
  | 'prikl'
  | 'tjek-spiring'
  | 'saa'
  | 'forspir'
  | 'plant-ud'

export interface FokusHandling {
  /** Stabilt id til React-keys (ikke til persistens — brug taskKey til det). */
  id: string
  /**
   * Deterministisk completion-nøgle: `${plantId}:${taskType}:${dato}`.
   * Matcher formatet i actions/plant-tasks.ts, så UI'et kan markere udført
   * og afkrydsningen overlever reload. Frøbank-invitationer (uden plante)
   * får en `inv:`-nøgle og kan IKKE persisteres endnu (note nedenfor).
   */
  taskKey: string
  lag: FokusLag
  taskType: FokusTaskType
  /** Bydeform — sætningen brugeren læser. "Udplant Chili Habanero i løbet af ugen." */
  titel: string
  /** Begrundelsen (mentor-regel #3). Én sætning. */
  hvorfor: string
  /** Plante handlingen hører til — null for frøbank-invitationer (lag 4). */
  plantId: string | null
  /** Allerede markeret udført i dag (fra completions). */
  udfoert: boolean
  /** Hvor brugeren sendes hen. */
  href: string
  /** Antal planter handlingen berører (tie-break-input; 1 for plante-handlinger). */
  beroerer: number
}

/**
 * Ærlighedsniveau (kalender-v2 §degradations-stigen). Inkrement 1 RAPPORTERER
 * niveauet; selve almanak-/frøbank-teksterne (trin 0/1-indhold) kommer i
 * inkrement 3.
 *   0 = ingen data (almanak)   1 = frøbank har indhold
 *   2 = aktive planter         3 = flere sæsoners historik (senere)
 */
export type DegradationsTrin = 0 | 1 | 2 | 3

export interface DagensFokus {
  trin: DegradationsTrin
  /** Dagens 1-3 vigtigste. Pressende (ikke-udførte) prioriteres ind i slottene før udførte. */
  fokus: FokusHandling[]
  /** Resten — bag "Se alle". */
  flere: FokusHandling[]
  /**
   * true = intet i lag 1-4 venter (alt pressende er gjort eller fraværende).
   * "Stilhed er en feature" — så siger Kalenderen "alt ser godt ud i dag" i
   * stedet for at opfinde opgaver. (Tekstvalget hører til UI-laget.)
   */
  stilhed: boolean
}

export interface DagensFokusInput {
  plants: Plant[]
  inventory: InventoryItem[]
  /** Aktive have-varsler (frost/tørke/...). Driver lag 1 (tidskritisk). */
  alerts?: GardenAlert[]
  /** task_keys brugeren allerede har markeret udført i dag (fra getTaskCompletionsForDate). */
  completions?: Iterable<string>
  /** Dagens dato — eksplicit, så funktionen er deterministisk/testbar. */
  today: Date
  /** Aktuel måned (1-12). Udledes af today hvis udeladt. */
  month?: number
}

const MAANED_NAVN = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

/** YYYY-MM-DD i lokal tid (samme format som actions/plant-tasks.ts' todayISO). */
function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Visningsnavn: "Chili Habanero" (art + sort) eller bare arten. */
function visningsNavn(name: string, variety?: string | null): string {
  return variety ? `${name} ${variety}` : name
}

/** Dedup-nøgle på art|sort (lower/trimmed) — bruges til at undgå "så X" når X allerede gror. */
function sortKey(name: string, variety?: string | null): string {
  return `${name.toLowerCase().trim()}|${(variety ?? '').toLowerCase().trim()}`
}

/**
 * Lag 1 — tidskritisk ("kan ikke vente"). Biologien venter ikke.
 * Frostvarsel × frostfølsomme UDPLANTEDE planter: planten står ude og er
 * sårbar, og frosten kommer uanset hvad brugeren ellers havde planlagt.
 *
 * Ærlighed: kun planter hvis guide POSITIVT siger frostSensitive flagges.
 * Mangler guiden data, tier vi (huller giver stilhed — vi opfinder ikke hast).
 * Returnerer null hvis planten ikke er udplantet eller ikke kendt frostfølsom.
 *
 * ⚠️ SOVENDE PR. JUNI 2026: `frostSensitive` er endnu IKKE udfyldt i nogen
 * guide (0 forekomster i guides-imported). Lag 1 er derfor korrekt bygget,
 * men fyrer aldrig før guide-data bærer flaget — så aktiveres det automatisk
 * uden ændringer her. Jf. afledningsmotoren.md (data i guide, ikke hardcodet
 * art-liste i motoren).
 */
function lag1Frost(p: Plant, frostTitel: string, dato: string): FokusHandling | null {
  if (p.status !== 'udplantet') return null
  const qf = quickFactsForNavn(p.name, p.variety)
  if (qf?.frostSensitive !== true) return null
  const navn = visningsNavn(p.name, p.variety)
  return mkPlante(
    p, 1, 'daek', `Dæk ${navn} mod nattefrost`,
    `${frostTitel} — ${navn} er frostfølsom og står udplantet.`,
    dato, `/mine-planter/${p.id}`,
  )
}

/**
 * Lag 2 — status-afledt handling ("planten kalder"). Grænsereglens
 * lakmustest: status der kan omskrives til et verbum i bydeform hører her.
 *   klar_til_udplantning → Udplant
 *   hoestklar            → Høst
 *   spirer               → Prikl
 * (udplantet → Tilse er VEDLIGEHOLD = lag 5, kommer i inkrement 4.)
 */
function lag2StatusHandling(p: Plant, dato: string): FokusHandling | null {
  const navn = visningsNavn(p.name, p.variety)
  const href = `/mine-planter/${p.id}`
  switch (p.status) {
    case 'klar_til_udplantning':
      return mkPlante(p, 2, 'udplant', `Udplant ${navn} i løbet af ugen`,
        'Planten er klar til at komme i jorden.', dato, href)
    case 'hoestklar':
      return mkPlante(p, 2, 'hoest', `Høst ${navn}`,
        'Planten er markeret høstklar.', dato, href)
    case 'spirer':
      return mkPlante(p, 2, 'prikl', `Prikl ${navn}`,
        'Spirerne er oppe — prikl om i egne potter når andet bladpar viser sig.', dato, href)
    default:
      return null
  }
}

/**
 * Lag 3 — verifikations-prompt ("systemet spørger"). Kun når en sået plante
 * har nået/passeret sit spiringsvindue (forventetSpiring → attention).
 * Blid: dukker op, presser ikke.
 */
function lag3Verifikation(p: Plant, dato: string): FokusHandling | null {
  if (p.status !== 'saaet' || !p.sowDate) return null
  const spiring = forventetSpiring(p)
  if (spiring?.kind !== 'attention') return null
  const navn = visningsNavn(p.name, p.variety)
  const href = `/mine-planter/${p.id}`
  // 'Er den spiret?' = inde i vinduet (K3: "hvor mange kom op?")
  // 'Tjek spiring'   = over forventet tid (anomali)
  const indeIVinduet = spiring.text === 'Er den spiret?'
  return mkPlante(
    p, 3, 'tjek-spiring',
    indeIVinduet ? `Tjek spiringen på ${navn}` : `Tjek ${navn} i såbakken`,
    indeIVinduet
      ? 'Spiringsvinduet er nået — kig i bakken og noter hvor mange der kom op.'
      : `Sået for ${dageSiden(p.sowDate)} dage siden — over forventet spiretid.`,
    dato, href,
  )
}

/**
 * Lag 4 — sæsonvindue × ejerskab ("mulighed, ikke pligt"). Krydser frøbanken
 * med måneden: brugeren EJER frøet, vinduet er ÅBENT. Invitation, ikke ordre.
 * Springer sorter over der allerede gror (så vi ikke siger "så tomat" mens
 * tomaten står i vindueskarmen).
 */
function lag4FroebankVindue(
  item: InventoryItem, month: number, dato: string, aktiveSorter: Set<string>,
): FokusHandling | null {
  if (aktiveSorter.has(sortKey(item.name, item.variety))) return null
  const navn = visningsNavn(item.name, item.variety)
  const maaned = MAANED_NAVN[month - 1]
  const href = '/froebank'

  if (item.sowingMonths?.includes(month)) {
    const forspir = item.preCultivation === true
    return mkFroebank(item, forspir ? 'forspir' : 'saa',
      `${forspir ? 'Forspir' : 'Så'} ${navn}`,
      `Du har ${navn} i frøbanken — ${maaned} er ${forspir ? 'forspirings' : 'så'}måned.`,
      dato, href)
  }
  if (item.plantingOutMonths?.includes(month)) {
    return mkFroebank(item, 'plant-ud',
      `Plant ${navn} ud`,
      `Du har ${navn} i frøbanken — ${maaned} er udplantningsmåned.`,
      dato, href)
  }
  return null
}

// ── Konstruktører (holder taskKey-formatet ét sted) ─────────────────

function mkPlante(
  p: Plant, lag: FokusLag, taskType: FokusTaskType,
  titel: string, hvorfor: string, dato: string, href: string,
): FokusHandling {
  const taskKey = `${p.id}:${taskType}:${dato}`
  return {
    id: taskKey, taskKey, lag, taskType, titel, hvorfor,
    plantId: p.id, udfoert: false, href, beroerer: 1,
  }
}

function mkFroebank(
  item: InventoryItem, taskType: FokusTaskType,
  titel: string, hvorfor: string, dato: string, href: string,
): FokusHandling {
  // Frøbank-invitationer er ikke plante-bundne. De får en `inv:`-nøgle, men
  // KAN IKKE persisteres endnu — actions/plant-tasks.ts kræver et plantId.
  // (plant_task_completions.plant_id ER nullable, så en separat invitations-
  // completion er mulig senere; uden for inkrement 1.)
  const taskKey = `inv:${item.id}:${taskType}:${dato}`
  return {
    id: taskKey, taskKey, lag: 4, taskType, titel, hvorfor,
    plantId: null, udfoert: false, href, beroerer: 1,
  }
}

/**
 * Ærligt degradations-trin ud fra hvilke data brugeren faktisk har.
 * (Trin 3 — historik — afgøres senere på arkiv-data.)
 */
function bestemTrin(aktivePlanter: Plant[], inventory: InventoryItem[]): DegradationsTrin {
  if (aktivePlanter.length > 0) return 2
  if (inventory.length > 0) return 1
  return 0
}

/**
 * Foreløbig tie-breaking inden for ét lag (inkrement 1).
 * Fuld model (deadline der lukker → flest planter → guide-prioritet) kommer i
 * inkrement 4; her sorterer vi på berørte planter, derefter titel for
 * determinisme — så testoutput er stabilt.
 */
function tieBreak(a: FokusHandling, b: FokusHandling): number {
  if (a.beroerer !== b.beroerer) return b.beroerer - a.beroerer
  return a.titel.localeCompare(b.titel, 'da')
}

/**
 * Byg dagens fokus. Ren funktion — kald med allerede-hentet data.
 */
export function byggDagensFokus(input: DagensFokusInput): DagensFokus {
  const { plants, inventory, today } = input
  const month = input.month ?? today.getMonth() + 1
  const dato = isoDate(today)
  const done = new Set(input.completions ?? [])

  const aktivePlanter = plants.filter(p => !p.isArchived)
  const aktiveSorter = new Set(aktivePlanter.map(p => sortKey(p.name, p.variety)))

  // ── Saml handlinger lag for lag ──────────────────────────────────
  const handlinger: FokusHandling[] = []

  // Lag 1 — tidskritisk: kun hvis der er et aktivt frostvarsel.
  // (Vejr-handlingen i weather.ts udsender ét frost-varsel ad gangen.)
  const frost = (input.alerts ?? []).find(a => a.kind === 'frost')
  if (frost) {
    for (const p of aktivePlanter) {
      const h1 = lag1Frost(p, frost.title, dato)
      if (h1) handlinger.push(h1)
    }
  }

  // Lag 2 + lag 3 (pr. aktiv plante)
  for (const p of aktivePlanter) {
    const h2 = lag2StatusHandling(p, dato)
    if (h2) handlinger.push(h2)
    const h3 = lag3Verifikation(p, dato)
    if (h3) handlinger.push(h3)
  }

  // Lag 4 (pr. frøpose, krydset med måneden)
  for (const item of inventory) {
    const h4 = lag4FroebankVindue(item, month, dato, aktiveSorter)
    if (h4) handlinger.push(h4)
  }

  // Markér udførte (completions)
  for (const h of handlinger) h.udfoert = done.has(h.taskKey)

  // ── Sortér: lag-orden, så tie-break inden for laget ──────────────
  handlinger.sort((a, b) => (a.lag - b.lag) || tieBreak(a, b))

  // ── Fokus vs. flere: pressende (ikke-udførte) får slottene først ──
  // Inden for hver gruppe bevares lag/tie-break-rækkefølgen (stabil sort).
  const pressende = handlinger.filter(h => !h.udfoert)
  const udfoerte = handlinger.filter(h => h.udfoert)
  const ordnet = [...pressende, ...udfoerte]

  // NOTE (inkrement 4): kalender-v2 siger lag 1 "kan ikke foldes væk", men
  // max-3 kan i teorien skubbe et 4.+ frost-varsel ned i `flere`. I praksis
  // rammer frost sjældent >3 sarte planter; den rene løsning er aggregering
  // ("Dæk dine sarte planter mod nattefrost") — en præsentations-/tie-break-
  // forfining der hører til inkrement 4, ikke en regel i kerne-motoren.
  const fokus = ordnet.slice(0, 3)
  const flere = ordnet.slice(3)

  // ── Stilhed: intet pressende i lag 1-4 ───────────────────────────
  const stilhed = pressende.length === 0

  return {
    trin: bestemTrin(aktivePlanter, inventory),
    fokus,
    flere,
    stilhed,
  }
}
