/**
 * Opgaver i MVP'en (MVP 1.0, fase 3) — rene regler uden UI.
 *
 * INGEN nyt opgavesystem. Visningen samler de FIRE kilder, kalenderen allerede
 * har, og lader hver beholde sit eget udførtsystem:
 *
 *   1. calendar_tasks        — brugerens egne, planteopgaver fra guide-regler
 *                              og generelle gøremål der er tilføjet. Har
 *                              status (open/completed/skipped) og dato.
 *   2. dagens-fokus (afledt) — beregnet af plantestatus (høst, udplant …).
 *                              Er ikke rækker; udført gemmes pr. dag i
 *                              plant_task_completions (kun "i dag").
 *   3. general_garden_tasks  — globale skabeloner pr. måned. De er FORSLAG,
 *                              ikke opgaver, før brugeren selv tilføjer dem
 *                              (så bliver de en calendar_tasks-række). Hver
 *                              skabelon kommer igen hvert år.
 *   4. user_garden_tasks     — brugerens egne månedsgøremål (ingen status).
 *
 * Der oprettes ALDRIG opgaver for frøposer: frøbankens forhold til opgaver er
 * den afledte invitation ("Så X, vinduet er åbent"), som kun er et forslag.
 *
 * Tre faner:
 *   Nu        — forsinkede + de næste 7 dage, dine planter, og forslag.
 *   Kommende  — åbne opgaver længere ude + næste måneds forslag.
 *   Udført    — udførte calendar_tasks + dagens afledte afkrydsninger.
 *
 * Alt afledes ved visning. Intet gemmes, og der indføres ingen nye felter.
 */

import type {
  CalendarTask, GeneralGardenTask, TaskPriority, TaskType, UserGardenTask,
} from '@/lib/types'
import type { DagensFokus, FokusHandling, FokusTaskType } from '@/lib/kalender/dagens-fokus'
import { erForsinketOpgave } from '@/lib/datetime'

/** "Nu" rækker så langt som til og med i dag + 7 dage. */
export const NU_DAGE = 7

/**
 * En afledt handling skjules, når en ÅBEN calendar_tasks-række for samme
 * plante og samme aktivitet ligger inden for så mange dage. Så vises den
 * samme aktivitet aldrig både som opgave og som afledt råd.
 */
export const DEDUP_DAGE = 30

// ─────────────────────────────────────────────────────────────
// Datoer (YYYY-MM-DD som strenge — samme konvention som resten af appen)
// ─────────────────────────────────────────────────────────────

export function plusDage(iso: string, dage: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + dage)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dag}`
}

/** Måneden efter `month` (1-12), og året den falder i. */
export function efterfoelgendeMaaned(month: number, year: number): { month: number; year: number } {
  return month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year }
}

const PRIORITET_RANG: Record<TaskPriority, number> = { critical: 3, high: 2, medium: 1, low: 0 }

// ─────────────────────────────────────────────────────────────
// Afledt handling ↔ calendar_tasks-type (til dublet-kontrol)
// ─────────────────────────────────────────────────────────────

/**
 * Den calendar_tasks-type en afledt handling svarer til — eller null, når
 * der ikke findes en tilsvarende opgavetype ('daek' og 'tjek-spiring' er rene
 * afledte råd). 'plant-ud' er frøbankens udplantnings-invitation.
 */
export function afledtTilOpgavetype(t: FokusTaskType): TaskType | null {
  switch (t) {
    case 'udplant':
    case 'plant-ud': return 'plant_out'
    case 'hoest': return 'harvest'
    case 'prikl': return 'repot'
    case 'saa': return 'sowing'
    case 'forspir': return 'pre_sow'
    case 'watering': return 'watering'
    case 'fertilizing': return 'fertilizing'
    case 'pruning': return 'pruning'
    case 'pest_check': return 'pest_check'
    case 'weeding': return 'weeding'
    case 'maintenance': return 'maintenance'
    default: return null
  }
}

function normTitel(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Fjern ægte dubletter blandt åbne opgaver: samme id, eller samme plante +
 * type + dato + titel. Den ÆLDSTE række bevares. Udførte opgaver røres ikke —
 * historikken må ikke skrumpe.
 */
export function fjernDubletter(tasks: CalendarTask[]): CalendarTask[] {
  const sorteret = [...tasks].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
  const set = new Set<string>()
  const ider = new Set<string>()
  const bevaret = new Set<string>()
  for (const t of sorteret) {
    if (ider.has(t.id)) continue
    ider.add(t.id)
    if (t.status === 'open') {
      const noegle = `${t.linkedPlantId ?? '-'}|${t.taskType}|${t.date}|${normTitel(t.title)}`
      if (set.has(noegle)) continue
      set.add(noegle)
    }
    bevaret.add(t.id)
  }
  // Oprindelig rækkefølge bevares; samme id returneres kun én gang.
  const set2 = new Set<string>()
  return tasks.filter((t) => {
    if (!bevaret.has(t.id) || set2.has(t.id)) return false
    set2.add(t.id)
    return true
  })
}

// ─────────────────────────────────────────────────────────────
// Oversigten
// ─────────────────────────────────────────────────────────────

/** En række i "Dine opgaver": enten en opgave eller et afledt plante-råd. */
export type DineRaekke =
  | { type: 'opgave'; task: CalendarTask; forsinket: boolean }
  | { type: 'afledt'; handling: FokusHandling }

/** Et forslag — ingen afkrydsning, ingen pligt. */
export type Forslag =
  | { type: 'eget'; task: UserGardenTask }
  | { type: 'generel'; task: GeneralGardenTask }
  | { type: 'froebank'; handling: FokusHandling }

export interface OpgaveOversigt {
  nu: {
    dine: DineRaekke[]
    /** Lag 5 (vanding m.m.) — holdes samlet og skjult som standard. */
    vedligehold: FokusHandling[]
    forslag: Forslag[]
  }
  kommende: {
    opgaver: CalendarTask[]
    /** Næste måneds generelle gøremål som forslag. */
    forslag: Forslag[]
  }
  udfoert: {
    opgaver: CalendarTask[]
    /** Alle afledte handlinger — visningen skiller dem ad med sin egen isDone. */
    afledte: FokusHandling[]
  }
}

export interface OpgaveInput {
  tasks: CalendarTask[]
  dagensFokus: DagensFokus
  generalTasks: GeneralGardenTask[]
  userTasks: UserGardenTask[]
  /** Dagens dato, YYYY-MM-DD. */
  today: string
  /** Aktuel måned (1-12) og år. */
  month: number
  year: number
}

/** De generelle gøremål for ÉN måned, som brugeren endnu kan få som forslag. */
function generelleForslag(
  generalTasks: GeneralGardenTask[],
  tasks: CalendarTask[],
  userTasks: UserGardenTask[],
  month: number,
  year: number,
): Forslag[] {
  // Allerede tilføjet (uanset status) samme år → ikke et forslag mere.
  const tilfoejet = new Set(
    tasks
      .filter((t) => t.source === 'general' && t.sourceId && t.date.startsWith(String(year)))
      .map((t) => t.sourceId as string),
  )
  // Brugeren har selv et gøremål med samme titel → ikke endnu et.
  const egneTitler = new Set(userTasks.filter((u) => u.month === month).map((u) => normTitel(u.title)))
  const aabneTitler = new Set(tasks.filter((t) => t.status === 'open').map((t) => normTitel(t.title)))

  return generalTasks
    .filter((g) => g.isActive && !g.isHiddenByMe && g.month === month)
    .filter((g) => !tilfoejet.has(g.id))
    .filter((g) => !egneTitler.has(normTitel(g.title)) && !aabneTitler.has(normTitel(g.title)))
    .sort((a, b) =>
      PRIORITET_RANG[b.priority] - PRIORITET_RANG[a.priority] || a.title.localeCompare(b.title, 'da'),
    )
    .map((task) => ({ type: 'generel' as const, task }))
}

export function bygOpgaveOversigt(input: OpgaveInput): OpgaveOversigt {
  const { generalTasks, userTasks, today, month, year, dagensFokus } = input
  const tasks = fjernDubletter(input.tasks)

  const graenseNu = plusDage(today, NU_DAGE)
  const graenseDedup = plusDage(today, DEDUP_DAGE)

  const aabne = tasks.filter((t) => t.status === 'open')
  const nuOpgaver = aabne.filter((t) => t.date <= graenseNu)
  const senereOpgaver = aabne.filter((t) => t.date > graenseNu)

  // Afledte råd: skjul dem, en åben opgave allerede dækker (samme plante,
  // samme aktivitet, inden for DEDUP_DAGE). Opgaven vinder — den har dato og
  // en varig udført-status.
  const daekket = new Set(
    aabne
      .filter((t) => t.linkedPlantId && t.date <= graenseDedup)
      .map((t) => `${t.linkedPlantId}|${t.taskType}`),
  )
  const ikkeDaekket = (h: FokusHandling): boolean => {
    if (!h.plantId) return true
    const type = afledtTilOpgavetype(h.taskType)
    return !(type && daekket.has(`${h.plantId}|${type}`))
  }

  const fokusAlle = [...dagensFokus.fokus, ...dagensFokus.flere]
  const plantRaad = fokusAlle.filter((h) => h.plantId !== null && !h.udfoert && ikkeDaekket(h))
  const froebankInvitationer = fokusAlle.filter((h) => h.plantId === null)
  const vedligehold = dagensFokus.rytme.filter((h) => !h.udfoert && ikkeDaekket(h))

  // Dine opgaver: forsinkede først, så efter dato; afledte råd gælder "nu".
  const dine: DineRaekke[] = [
    ...nuOpgaver.map((task): DineRaekke => ({
      type: 'opgave', task, forsinket: erForsinketOpgave(task.date, task.createdAt),
    })),
    ...plantRaad.map((handling): DineRaekke => ({ type: 'afledt', handling })),
  ]
  const sortDato = (r: DineRaekke) => (r.type === 'opgave' ? (r.task.date < today ? today : r.task.date) : today)
  const rang = (r: DineRaekke) => (r.type === 'opgave' ? PRIORITET_RANG[r.task.priority] : 1)
  dine.sort((a, b) => {
    const fa = a.type === 'opgave' && a.forsinket ? 0 : 1
    const fb = b.type === 'opgave' && b.forsinket ? 0 : 1
    if (fa !== fb) return fa - fb
    const dato = sortDato(a).localeCompare(sortDato(b))
    if (dato !== 0) return dato
    if (a.type !== b.type) return a.type === 'opgave' ? -1 : 1
    return rang(b) - rang(a)
  })

  const eneForslag: Forslag[] = userTasks
    .filter((u) => u.month === month)
    .sort((a, b) => a.title.localeCompare(b.title, 'da'))
    .map((task) => ({ type: 'eget' as const, task }))

  const nu = efterfoelgendeMaaned(month, year)

  return {
    nu: {
      dine,
      vedligehold,
      forslag: [
        ...eneForslag,
        ...generelleForslag(generalTasks, tasks, userTasks, month, year),
        ...froebankInvitationer.map((handling): Forslag => ({ type: 'froebank', handling })),
      ],
    },
    kommende: {
      opgaver: [...senereOpgaver].sort((a, b) => a.date.localeCompare(b.date)),
      forslag: generelleForslag(generalTasks, tasks, userTasks, nu.month, nu.year),
    },
    udfoert: {
      opgaver: tasks
        .filter((t) => t.status === 'completed')
        .sort((a, b) => (b.completedAt ?? b.updatedAt ?? '').localeCompare(a.completedAt ?? a.updatedAt ?? ''))
        .slice(0, 30),
      afledte: [...fokusAlle.filter((h) => h.plantId !== null), ...dagensFokus.rytme],
    },
  }
}

/** Opgavens type i brugerens ord — så man kan se, hvad man ser på. */
export function opgaveTypeLabel(t: Pick<CalendarTask, 'source' | 'linkedPlantId'>): string {
  if (t.linkedPlantId) return 'Planteopgave'
  if (t.source === 'general') return 'Generel haveopgave'
  if (t.source === 'manual') return 'Din opgave'
  return 'Haveopgave'
}
