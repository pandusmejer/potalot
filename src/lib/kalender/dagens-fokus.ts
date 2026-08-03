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
 *   ✅ inkrement 2: lag 1 (tidskritisk — frost × frostfølsomme udplantede).
 *   ✅ inkrement 3: degradations-stigen trin 0/1 + almanak-PLADSHOLDER
 *      (neutral tekst pr. måned; rigtig Potalot-stemme skrives separat senere).
 *   ✅ inkrement 4 (her): fuld tie-breaking (deadline → flest planter → guide-
 *      prioritet) + lag 5 (vedligehold, i separat `rytme`-bucket).
 *   ⏳ senere: trin 3 (historik — kræver arkivdata).
 *
 * INGEN UI her. Output testes i Node mod demo-data
 * (scripts/test-dagens-fokus.ts).
 */

import type { Guide, GuideCalendarRule, InventoryItem, Plant, TaskPriority } from '@/lib/types'
import type { GardenAlert } from '@/actions/weather'
import { forventetSpiring, quickFactsForNavn } from '@/lib/afledninger'
import { brugerNiveau, type BrugerNiveau } from '@/lib/bruger-niveau'

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
  // Lag 5 — vedligehold (fra GuideCalendarRule.taskType)
  | 'watering'
  | 'fertilizing'
  | 'pruning'
  | 'pest_check'
  | 'weeding'
  | 'maintenance'

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
  /** Antal planter handlingen berører (tie-break #2; 1 for plante-handlinger). */
  beroerer: number
  /**
   * Måneden hvor handlingens vindue LUKKER (tie-break #1: hårdest deadline
   * først). Undefined = intet kendt vindue → sorteres efter dem med deadline.
   */
  deadlineMaaned?: number
  /** Guide-prioritets-rang (tie-break #3): critical=3 … low=0. 0 hvis ukendt. */
  guidePrioritet: number
}

/**
 * Ærlighedsniveau (kalender-v2 §degradations-stigen). Inkrement 1 RAPPORTERER
 * niveauet; selve almanak-/frøbank-teksterne (trin 0/1-indhold) kommer i
 * inkrement 3.
 *   0 = ingen data (almanak)   1 = frøbank har indhold
 *   2 = aktive planter         3 = flere sæsoners historik (senere)
 *
 * Definitionen bor nu i det delte src/lib/bruger-niveau.ts (adaptive
 * onboarding bruger samme stige) — typen genudstilles her for bagudkompat.
 */
export type DegradationsTrin = BrugerNiveau

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
  /**
   * Lag 5 — vedligehold ("rytme", ikke "dagens fokus"). Holdes BEVIDST uden
   * for fokus/flere, jf. kalender-v2: lag 5 samles i ugens rytme frem for
   * dagens fokus, og bryder ALDRIG stilhed (vanding gør ikke en dag "travl").
   */
  rytme: FokusHandling[]
  /**
   * Generisk-men-korrekt sæsonviden (degradations trin 0, og trin 1 uden
   * aktuelle handlinger) — så en ny bruger uden personlige data aldrig møder
   * en tom side, men heller ikke fake-personalisering.
   *
   * ⚠️ PLADSHOLDER pr. juni 2026: indeholder en neutral markør-tekst, IKKE
   * den endelige almanak. Rigtig copy skrives separat i Potalot-stemme
   * (Anna). Undefined ved trin ≥ 2 (personligt indhold + stilhed styrer der).
   */
  almanak?: string
}

export interface DagensFokusInput {
  plants: Plant[]
  inventory: InventoryItem[]
  /** Aktive have-varsler (frost/tørke/...). Driver lag 1 (tidskritisk). */
  alerts?: GardenAlert[]
  /** Dyrkningsguides — bærer calendarRules (lag 5) + prioritet (tie-break #3). */
  guides?: Guide[]
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

/**
 * Niveau-bevidst almanak-linje (adaptive onboarding, Anna 3/8). Erstatter den
 * gamle ⟦almanak⟧-pladsholder med ærlig gevinst-copy: forklar hvad kalenderen
 * KAN, når brugeren fortæller mere — aldrig krav om registrering. Månedsspecifik
 * sæson-prosa (Potalot-stemmen) er stadig et separat redaktionelt spor og kan
 * overtage trin 0-linjen, når den skrives.
 */
function adaptivAlmanak(trin: DegradationsTrin, plantCount: number): string {
  if (trin === 0) {
    return 'Kalenderen bliver mere personlig, når du fortæller os, hvad du dyrker. Indtil da viser vi sæsonens generelle opgaver.'
  }
  if (trin === 1) {
    return 'Dine frø er klar i Frøbanken. Når du sår dem, følger kalenderen dem hele vejen fra spiring til høst.'
  }
  return `Vi viser nu råd for ${plantCount === 1 ? 'din plante' : `dine ${plantCount} planter`}. Tilføj flere, når du er klar.`
}

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
 * Variant-puljer for de hvorfor-linjer der IKKE varierer pr. plante (de
 * generiske lag-2-status-linjer uden plantenavn). Når to handlinger af samme
 * type står i samme sektion, ville de ellers læse ordret ens — og så ser
 * brugeren mekanikken bag motoren. index 0 = standardlinjen, så en
 * ENKELT forekomst er uændret; først ved gentagelse vælges en variant.
 *
 * Puljen bruges KUN til typer hvor linjen er plante-uafhængig. Frost (lag 1),
 * frøbank (lag 4) og rytme (lag 5) bærer allerede plantenavn/måned og læser
 * derfor aldrig ordret ens — de står bevidst ikke her.
 */
const HVORFOR_VARIANTER: Partial<Record<FokusTaskType, string[]>> = {
  // Korte, én-linjede forklaringer (Anna 18/6 — komprimering).
  prikl: [
    'Spirerne står tæt — giv dem plads, før de strækker sig.',
    'Hver sin potte nu, så rødderne får ro.',
    'Prikl om, før de små konkurrerer om lys.',
  ],
  hoest: [
    'Det modne taber smag og sprødhed — tag lidt ad gangen nu.',
    'Høst mens det er på sit bedste — overmodent taber kvalitet.',
    'Pluk løbende, så planten sætter nyt.',
  ],
  udplant: [
    'Rødderne fylder potten — plant ud, før væksten går i stå.',
    'Hærdet og klar — ud nu giver den længst vækstsæson.',
    'Vent for længe, og den bliver rodfast i potten.',
  ],
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
    `${navn} er frostfølsom og står udplantet — ${frostTitel.toLowerCase()} kan ødelægge bladene uden dække.`,
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
function lag2StatusHandling(p: Plant, dato: string, guide: Guide | null): FokusHandling | null {
  const navn = visningsNavn(p.name, p.variety)
  const href = `/mine-planter/${p.id}`
  const qf = quickFactsForNavn(p.name, p.variety)
  // Titel-sprog (Annas QA 18/6): ikke-kritiske handlinger lyder rådgivende/
  // haveagtige frem for kommando-/databaseagtige. Kritiske (lag 1) forbliver
  // direkte. taskType (og dermed task_key) er uændret — kun den viste titel.
  switch (p.status) {
    case 'klar_til_udplantning':
      // Bydeform — grænsereglen (Kalender = handling) vejer tungere end blødhed.
      // Mening/blødhed ligger i hvorfor-linjen; titlen handler.
      return mkPlante(p, 2, 'udplant', `Plant ${navn} ud`,
        HVORFOR_VARIANTER.udplant![0], dato, href,
        { deadlineMaaned: vinduesLukning(qf?.plantingOutMonths), guidePrioritet: rulePrioritet(guide, ['plant_out']) })
    case 'hoestklar':
      return mkPlante(p, 2, 'hoest', `Pluk ${navn} nu`,
        HVORFOR_VARIANTER.hoest![0], dato, href,
        { deadlineMaaned: vinduesLukning(qf?.harvestMonths), guidePrioritet: rulePrioritet(guide, ['harvest']) })
    case 'spirer':
      return mkPlante(p, 2, 'prikl', `Giv ${navn} mere plads`,
        HVORFOR_VARIANTER.prikl![0], dato, href,
        { guidePrioritet: rulePrioritet(guide, ['repot']) })
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
      ? 'De første spirer bør titte frem nu — et hurtigt kig fortæller, om såningen lykkedes.'
      : 'Spiretiden er passeret — kommer der intet op, er der stadig tid til at så om.',
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
  item: InventoryItem, month: number, dato: string, aktiveSorter: Set<string>, guide: Guide | null,
): FokusHandling | null {
  if (aktiveSorter.has(sortKey(item.name, item.variety))) return null
  const navn = visningsNavn(item.name, item.variety)
  const maaned = MAANED_NAVN[month - 1]
  const href = '/froebank'

  if (item.sowingMonths?.includes(month)) {
    const forspir = item.preCultivation === true
    return mkFroebank(item, forspir ? 'forspir' : 'saa',
      `${forspir ? 'Forspir' : 'Så'} ${navn}`,
      forspir
        ? `Du har ${navn} i frøbanken, og ${maaned} er forspiringsvinduet — forkultivér nu, så planterne når at blive klar.`
        : `Du har ${navn} i frøbanken, og ${maaned} er såvinduet — sår du nu, når den at give i år.`,
      dato, href,
      { deadlineMaaned: vinduesLukning(item.sowingMonths), guidePrioritet: rulePrioritet(guide, ['sowing', 'pre_sow']) })
  }
  if (item.plantingOutMonths?.includes(month)) {
    return mkFroebank(item, 'plant-ud',
      `Plant ${navn} ud`,
      `Du har ${navn} i frøbanken, og udplantningsvinduet er åbent i ${maaned} — jo før ud, jo længere vækstsæson.`,
      dato, href,
      { deadlineMaaned: vinduesLukning(item.plantingOutMonths), guidePrioritet: rulePrioritet(guide, ['plant_out']) })
  }
  return null
}

// ── Konstruktører (holder taskKey-formatet ét sted) ─────────────────

interface MkOpts {
  deadlineMaaned?: number
  guidePrioritet?: number
  beroerer?: number
}

function mkPlante(
  p: Plant, lag: FokusLag, taskType: FokusTaskType,
  titel: string, hvorfor: string, dato: string, href: string, opts: MkOpts = {},
): FokusHandling {
  const taskKey = `${p.id}:${taskType}:${dato}`
  return {
    id: taskKey, taskKey, lag, taskType, titel, hvorfor,
    plantId: p.id, udfoert: false, href, beroerer: opts.beroerer ?? 1,
    deadlineMaaned: opts.deadlineMaaned, guidePrioritet: opts.guidePrioritet ?? 0,
  }
}

function mkFroebank(
  item: InventoryItem, taskType: FokusTaskType,
  titel: string, hvorfor: string, dato: string, href: string, opts: MkOpts = {},
): FokusHandling {
  // Frøbank-invitationer er ikke plante-bundne. De får en `inv:`-nøgle, men
  // KAN IKKE persisteres endnu — actions/plant-tasks.ts kræver et plantId.
  // (plant_task_completions.plant_id ER nullable, så en separat invitations-
  // completion er mulig senere; uden for inkrement 1.)
  const taskKey = `inv:${item.id}:${taskType}:${dato}`
  return {
    id: taskKey, taskKey, lag: 4, taskType, titel, hvorfor,
    plantId: null, udfoert: false, href, beroerer: opts.beroerer ?? 1,
    deadlineMaaned: opts.deadlineMaaned, guidePrioritet: opts.guidePrioritet ?? 0,
  }
}

// ── Guide-opslag + tie-break-input ──────────────────────────────────

const PRIORITET_RANG: Record<TaskPriority, number> = {
  critical: 3, high: 2, medium: 1, low: 0,
}

/** Måneden et vindue LUKKER (sidste måned i listen), eller undefined. */
function vinduesLukning(months?: number[] | null): number | undefined {
  return months && months.length ? Math.max(...months) : undefined
}

/** Højeste guide-prioritets-rang blandt regler hvis taskType matcher (tie-break #3). */
function rulePrioritet(guide: Guide | null, taskTypes: GuideCalendarRule['taskType'][]): number {
  if (!guide?.calendarRules?.length) return 0
  const sæt = new Set<string>(taskTypes)
  let rang = 0
  for (const r of guide.calendarRules) {
    if (sæt.has(r.taskType)) rang = Math.max(rang, PRIORITET_RANG[r.priority] ?? 0)
  }
  return rang
}

/** Vedligeholds-taskTypes = lag 5's "rytme" (ikke så/udplant/høst — de er lag 2/4). */
const VEDLIGEHOLD_TYPES = new Set<GuideCalendarRule['taskType']>([
  'watering', 'fertilizing', 'pruning', 'pest_check', 'weeding', 'maintenance',
])

/**
 * Statuser hvor vedligehold (lag 5) giver mening: planten er ETABLERET og i
 * vækst. Ekskluderer planlagt/saaet/spirer (for tidligt — "bind tomater op"
 * på en spire er forkert) og afsluttet (sæsonen er slut).
 */
const ETABLEREDE_STATUS = new Set<Plant['status']>([
  'klar_til_udplantning', 'udplantet', 'i_vaekst', 'hoestklar',
])

/**
 * Lag 5 — vedligehold ("rytme"). Fra plantens guide-calendarRules hvor
 * recommendedMonths rammer denne måned og taskType er en vedligeholds-type.
 * Returnerer 0..n handlinger pr. plante. Bydeform arves fra regel-titlen
 * (guide-forfatteren skriver imperativt; ikke motorens job at omskrive).
 */
function lag5Vedligehold(p: Plant, guide: Guide | null, month: number, dato: string): FokusHandling[] {
  if (!ETABLEREDE_STATUS.has(p.status)) return []
  if (!guide?.calendarRules?.length) return []
  const navn = visningsNavn(p.name, p.variety)
  const maaned = MAANED_NAVN[month - 1]
  const ud: FokusHandling[] = []
  for (const r of guide.calendarRules) {
    if (!VEDLIGEHOLD_TYPES.has(r.taskType)) continue
    if (!r.recommendedMonths?.includes(month)) continue
    ud.push(mkPlante(
      p, 5, r.taskType as FokusTaskType, r.title,
      `Plejen, der holder ${navn} sund og produktiv i ${maaned}.`, dato, `/mine-planter/${p.id}`,
      { deadlineMaaned: vinduesLukning(r.recommendedMonths), guidePrioritet: PRIORITET_RANG[r.priority] ?? 0 },
    ))
  }
  return ud
}

/**
 * Ærligt degradations-trin ud fra hvilke data brugeren faktisk har.
 * Delegerer til den delte stige i src/lib/bruger-niveau.ts.
 */
function bestemTrin(aktivePlanter: Plant[], inventory: InventoryItem[]): DegradationsTrin {
  return brugerNiveau(aktivePlanter.length, inventory.length)
}

/**
 * VIGTIGHED — hvor presserende handlingen reelt er I HAVEN I DAG (konsekvens +
 * timing-vindue). Det er DETTE, ikke guide-YAML'ens statiske `priority`, der
 * bestemmer rækkefølgen. Produktprincip (Anna 18/6):
 *
 *   Dagens fokus skal vælge det, brugeren reelt bør gøre FØRST — ikke det,
 *   admin-guiden tilfældigvis har markeret som `high`. Guide-prioritet er et
 *   INPUT, ikke en diktator. Haven har mere ret end en YAML-fil.
 *
 * Basis pr. type = konsekvensen af IKKE at gøre det i dag:
 *   daek (frost)  100  tidskritisk — biologien venter ikke (lag 1, top-tier)
 *   hoest          90  kvalitetskritisk — modent taber smag/holdbarhed hurtigt
 *   udplant        75  vigtigt, men kan ofte vente en dag eller to
 *   prikl          65  spirer strækker sig, hvis de venter for længe
 *   tjek-spiring   50  blid verifikation
 *   lag 4 (frøbank)40  muligheder, ikke pligt
 *   lag 5          20  rytme/vedligehold (separat bucket)
 *
 * Modifikatorer (timing-vindue + guide-nudge):
 *   vindue lukker i denne måned   +20   (snævert vindue → hast, fx udplantning)
 *   vindue lukker næste måned      +10
 *   guide-prioritet                +0..+6  (lille nudge: high=+6, ikke diktat)
 */
const VIGTIGHED_BASIS: Record<FokusTaskType, number> = {
  daek: 100, hoest: 90, udplant: 75, prikl: 65, 'tjek-spiring': 50,
  saa: 40, forspir: 40, 'plant-ud': 40,
  watering: 20, fertilizing: 20, pruning: 20, pest_check: 20, weeding: 20, maintenance: 20,
}

function vigtighed(h: FokusHandling, month: number): number {
  let v = VIGTIGHED_BASIS[h.taskType] ?? 30
  if (h.deadlineMaaned !== undefined) {
    const tilLukning = h.deadlineMaaned - month
    if (tilLukning <= 0) v += 20        // vinduet lukker nu/forbi → hast
    else if (tilLukning === 1) v += 10  // lukker næste måned
  }
  v += Math.min(Math.max(h.guidePrioritet, 0), 3) * 2 // guide som lille nudge
  return v
}

/**
 * Rækkefølge i dagens fokus. Frost/tidskritisk (lag 1) er ALTID øverst og kan
 * ikke overhales (kalender-v2: "kan ikke vente"). Derefter ren vigtighed →
 * flest planter → titel (determinisme).
 */
function sammenlignVigtighed(a: FokusHandling, b: FokusHandling, month: number): number {
  const ta = a.lag === 1 ? 0 : 1
  const tb = b.lag === 1 ? 0 : 1
  if (ta !== tb) return ta - tb
  const va = vigtighed(a, month)
  const vb = vigtighed(b, month)
  if (va !== vb) return vb - va
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

  // Guide-opslag (lag 5 + prioritets-tie-break). guideId først, derefter
  // arts-fallback på guidens plantName (ærligt: rytme/prioritet er ofte
  // arts-egenskaber). Intet match → null → lag 5 tier for den plante.
  const guides = input.guides ?? []
  const guideById = new Map(guides.map(g => [g.id, g]))
  const guideByArt = new Map(
    guides.filter(g => g.guideLevel === 'species').map(g => [g.plantName.toLowerCase().trim(), g]),
  )
  const guideForPlante = (p: { guideId?: string | null; name: string }): Guide | null => {
    const sort = (p.guideId ? guideById.get(p.guideId) : undefined) ?? null
    const art = guideByArt.get(p.name.toLowerCase().trim()) ?? null
    // calendarRules + prioritet bor typisk på ARTS-guiden, mens planten peger
    // på en sortsguide uden regler. Foretræk derfor den guide der FAKTISK
    // bærer regler; ellers sortsguiden; ellers arten.
    if (sort?.calendarRules?.length) return sort
    if (art?.calendarRules?.length) return art
    return sort ?? art
  }

  // ── Saml handlinger: lag 1-4 (akut) adskilt fra lag 5 (rytme) ─────
  const akut: FokusHandling[] = []
  const rytme: FokusHandling[] = []

  // Lag 1 — tidskritisk: kun hvis der er et aktivt frostvarsel.
  // (Vejr-handlingen i weather.ts udsender ét frost-varsel ad gangen.)
  const frost = (input.alerts ?? []).find(a => a.kind === 'frost')
  if (frost) {
    for (const p of aktivePlanter) {
      const h1 = lag1Frost(p, frost.title, dato)
      if (h1) akut.push(h1)
    }
  }

  // Lag 2 + 3 + 5 (pr. aktiv plante)
  for (const p of aktivePlanter) {
    const guide = guideForPlante(p)
    const h2 = lag2StatusHandling(p, dato, guide)
    if (h2) akut.push(h2)
    const h3 = lag3Verifikation(p, dato)
    if (h3) akut.push(h3)
    rytme.push(...lag5Vedligehold(p, guide, month, dato))
  }

  // Lag 4 (pr. frøpose, krydset med måneden)
  for (const item of inventory) {
    const h4 = lag4FroebankVindue(item, month, dato, aktiveSorter, guideForPlante(item))
    if (h4) akut.push(h4)
  }

  // Markér udførte (completions)
  for (const h of akut) h.udfoert = done.has(h.taskKey)
  for (const h of rytme) h.udfoert = done.has(h.taskKey)

  // Variér hvorfor-linjen KUN ved faktisk gentagelse (≥2 af samme pulje-type i
  // samme sektion), så to ens handlinger ikke læser ordret identisk. Stabilt
  // pr. plante-id (ikke displayposition), så teksten ikke skifter når en anden
  // opgave krydses af. Enkeltforekomst beholder puljens linje 0.
  const sammeType = new Map<string, FokusHandling[]>()
  for (const h of akut) {
    if (!HVORFOR_VARIANTER[h.taskType]) continue
    const liste = sammeType.get(h.taskType) ?? []
    liste.push(h)
    sammeType.set(h.taskType, liste)
  }
  for (const [type, liste] of sammeType) {
    if (liste.length < 2) continue
    const pool = HVORFOR_VARIANTER[type as FokusTaskType]!
    liste
      .slice()
      .sort((a, b) => (a.plantId ?? '').localeCompare(b.plantId ?? ''))
      .forEach((h, i) => { h.hvorfor = pool[i % pool.length] })
  }

  // ── Sortér akut efter vigtighed (konsekvens + timing), ikke guide-YAML ──
  akut.sort((a, b) => sammenlignVigtighed(a, b, month))

  // ── Fokus vs. flere: pressende (ikke-udførte) får slottene først ──
  // Inden for hver gruppe bevares lag/tie-break-rækkefølgen (stabil sort).
  const pressende = akut.filter(h => !h.udfoert)
  const udfoerte = akut.filter(h => h.udfoert)
  const ordnet = [...pressende, ...udfoerte]

  // NOTE: kalender-v2 siger lag 1 "kan ikke foldes væk", men max-3 kan i teorien
  // skubbe et 4.+ frost-varsel ned i `flere`. I praksis rammer frost sjældent
  // >3 sarte planter; den rene løsning er aggregering ("Dæk dine sarte planter")
  // — en præsentations-forfining for UI-laget, ikke en regel i kerne-motoren.
  const fokus = ordnet.slice(0, 3)
  const flere = ordnet.slice(3)

  // Rytme (lag 5): pressende først, så udførte; derefter vigtighed/titel.
  rytme.sort((a, b) =>
    (Number(a.udfoert) - Number(b.udfoert)) || sammenlignVigtighed(a, b, month))

  // ── Stilhed: KUN lag 1-4 tæller. Vedligehold (lag 5) bryder aldrig stilhed.
  const stilhed = pressende.length === 0

  const trin = bestemTrin(aktivePlanter, inventory)

  // ── Degradations-stigen: almanak-fallback for nye brugere ────────
  // Trin 0 (ingen data) får ALTID almanakken — den er hele indholdet.
  // Trin 1 (frøbank, ingen planter) får den KUN når der ikke er aktuelle
  // handlinger denne måned, så siden ikke står tom. Trin 2 med FÅ planter
  // (1-3) får en rolig "vi følger dine N planter"-linje på stille dage —
  // etablerede brugere (>3 planter) får ingen onboarding-tekst (hjælp må
  // aldrig gentage sig selv).
  const almanak =
    trin === 0 || (trin === 1 && akut.length === 0)
      ? adaptivAlmanak(trin, aktivePlanter.length)
      : trin === 2 && aktivePlanter.length <= 3 && stilhed
        ? adaptivAlmanak(trin, aktivePlanter.length)
        : undefined

  return { trin, fokus, flere, rytme, stilhed, almanak }
}
