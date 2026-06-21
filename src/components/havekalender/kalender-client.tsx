'use client'

import { useState } from 'react'
import { Aarshjul } from '@/components/havekalender/aarshjul'
import { TodoTabs } from '@/components/havekalender/todo-tabs'
// DetKanDuNu er erstattet af det nye 4-lags Inspiration-card. Importen
// bevares som kommentar i tilfælde af genaktivering.
// import { DetKanDuNu } from '@/components/havekalender/det-kan-du-nu'
import { Inspiration } from '@/components/havekalender/inspiration'
import { MaanedsHero } from '@/components/havekalender/maaneds-hero'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import { UserTaskDialog } from '@/components/havekalender/user-task-dialog'
import { GeneralTaskCard } from '@/components/havekalender/general-task-card'
import { DenneUge } from '@/components/havekalender/denne-uge'
import { GardenAlerts } from '@/components/havekalender/garden-alerts'
import { DinDyrkning } from '@/components/havekalender/din-dyrkning'
import { WeatherPills } from '@/components/havekalender/weather-pills'
import { DenneUgeIHaven } from '@/components/havekalender/denne-uge-i-haven'
import { HaveStemning } from '@/components/havekalender/have-stemning'
import { TimingHorisont } from '@/components/havekalender/timing-horisont'
import {
  DetKanDuGoereEditorialPlanner,
  mapTaskToPlannerItem,
} from '@/components/havekalender/det-kan-du-goere-editorial-planner'
import { NaesteMaaned } from '@/components/havekalender/naeste-maaned'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ListChecks, Calendar, EyeOff, Eye, Info, Compass, ArrowRight, ChevronDown,
  Sprout, BookOpen, Users, Lightbulb, Plus,
} from 'lucide-react'
import { aktuelMaaned } from '@/lib/datetime'
import { MONTHS_DA, PLANT_STATUS_META } from '@/lib/constants'
import { challengesForMonth } from '@/lib/seasonal-challenges'
import { computeWeekSuggestions } from '@/lib/denne-uge'
import { cn } from '@/lib/utils'
import { hideGeneralTask } from '@/actions/aarshjul'
import { createTask } from '@/actions/havekalender'
import type { GardenAlert } from '@/actions/weather'
import type {
  CalendarTask, GeneralGardenTask, Guide, InventoryItem, Plant, UserGardenTask,
} from '@/lib/types'

interface Props {
  tasks: CalendarTask[]
  plants: Plant[]
  inventory: InventoryItem[]
  generalTasks: GeneralGardenTask[]
  userTasks: UserGardenTask[]
  guides: Guide[]
  alerts: GardenAlert[]
  /** Daglig sensorisk note — beregnet server-side, roterer pr. dag. */
  gardenNote: string
  isLoggedIn: boolean
}

/** Lille versal-eyebrow der gør sidens narrativ eksplicit. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </p>
  )
}

/* ------------------------------------------------------------------
 * Skræddersyede timing-ikoner — botaniske, organiske streg-motiver
 * der matcher resten af designet (ingen emojis/standard-ikoner).
 * ------------------------------------------------------------------ */
const svgBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Gør nu — sol der står op over horisonten (øjeblikket er nu). */
function IconSol({ className }: { className?: string }) {
  return (
    <svg {...svgBase} className={className} aria-hidden>
      <path d="M3.5 18h17" />
      <path d="M7.5 18a4.5 4.5 0 0 1 9 0" />
      <path d="M12 7v2M6.3 10.4l1.4 1.4M17.7 10.4l-1.4 1.4" />
    </svg>
  )
}

/** God timing — lille to-bladet spire (vækst-vinduet er åbent). */
function IconSpire({ className }: { className?: string }) {
  return (
    <svg {...svgBase} className={className} aria-hidden>
      <path d="M12 21v-9" />
      <path d="M12 12.5C12 9 9.6 6.4 6 6.4c0 3.6 2.4 6.1 6 6.1Z" />
      <path d="M12 12.5c0-3.5 2.4-6.1 6-6.1 0 3.6-2.4 6.1-6 6.1Z" />
    </svg>
  )
}

/** Hvis du har tid — dampende krus (en rolig kaffepause, ingen hast). */
function IconKop({ className }: { className?: string }) {
  return (
    <svg {...svgBase} className={className} aria-hidden>
      <path d="M5.5 11h10.5v3.5a4 4 0 0 1-4 4H9.5a4 4 0 0 1-4-4Z" />
      <path d="M16 11.8h1.6a2.1 2.1 0 0 1 0 4.2H16" />
      <path d="M9 8.4c.9-.8.9-1.8 0-2.6M12.6 8.4c.9-.8.9-1.8 0-2.6" />
    </svg>
  )
}

export function KalenderClient({ tasks, plants, inventory, generalTasks, userTasks, guides, alerts, gardenNote, isLoggedIn }: Props) {
  const nuMaaned = aktuelMaaned()
  const [valgtMaaned, setValgtMaaned] = useState(nuMaaned)
  const [visSkjulte, setVisSkjulte] = useState(false)
  const year = new Date().getFullYear()

  const aktivePlanter = plants
    .filter(p => !p.isArchived)
    .map(p => ({ id: p.id, name: p.name, variety: p.variety }))

  // LAG 1 — "Denne uge i haven": altid baseret på AKTUEL måned (nu),
  // uafhængigt af hvilken måned brugeren bladrer til i årshjulet
  const ugeSuggestions = computeWeekSuggestions(inventory, plants, nuMaaned)

  // Månedens fokus-tags = top-3 gøremåls-kategorier for valgt måned
  const focusTags = topCategories(generalTasks, valgtMaaned, 3)
  const monthlyPlannerItems = generalTasks
    .filter(g => !g.isHiddenByMe)
    .map(mapTaskToPlannerItem)

  return (
    <div className="space-y-7">
      {/* 1 · ORIENTERING — månedskapitlet er brugerens mentale landing.
          Heroen er fredet per KALENDER_MASTER_SPEC.md (critical rule). */}
      <MaanedsHero month={valgtMaaned} year={year} focusTags={focusTags} />

      {/* 2 · KONTEKST-PILLER — små have-relevante vejrsignaler lige under
          heroen. Ikke et dashboard, kun det der ændrer have-beslutninger. */}
      <WeatherPills alerts={alerts} />

      {/* 3 · UGENS RYTME — varmt papir-card med horisontale day cards.
          AKTUELT-laget. Linker via "Ugens opgaver →" til Mine opgaver
          nedenfor — IKKE til årshjulet (forskellig tidslogik).  */}
      <DenneUgeIHaven suggestions={ugeSuggestions} alerts={alerts} />

      {/* 4 · MÅNEDENS RYTME — det botaniske årshjul-snapshot.
          Erstatter den gamle "Månedens guide". Indeholder
          DYRKNINGSRYTME (rytme-tidslinjer pr. afgrøde) og
          MÅNEDENS FOKUS (3-5 prioriterede opgaver). Sektionen
          giver brugeren "hvad betyder maj for min have"-overblikket
          på under 5 sekunder. Per spec: placeret efter Denne uge,
          FØR Mine opgaver. */}
      <DetKanDuGoereEditorialPlanner
        month={nuMaaned}
        items={monthlyPlannerItems}
        onAddToTasks={isLoggedIn
          ? async (item) => {
              const today = new Date().toISOString().slice(0, 10)
              await createTask({
                title: item.title,
                description: item.description || undefined,
                date: today,
                taskType: 'custom',
                priority: item.priority ?? 'medium',
                source: 'general',
                sourceId: item.id,
              })
            }
          : undefined}
        onHide={isLoggedIn
          ? async (item) => {
              await hideGeneralTask(item.id)
            }
          : undefined}
        onOpenGuide={(item) => {
          if (item.guideHref) window.location.href = item.guideHref
        }}
      />

      {/* Lille sensorisk note — "små ting fra haven". Svæver mellem
          de strukturerede sektioner som en stille observation.
          Ikke en opgave, ikke et card. Konkret-kropsligt indhold
          der bruger måned, tid og vejr som kontekst. Per
          HAVEN_SOM_SANCTUARY.md max 1-2 noter pr. side. */}
      {/* Daglig sensorisk note — den stille invitation midt i scrollet.
          Roterer pr. dag (kontekst-aware: måned, tid, vejr) via
          pickGardenNote, beregnet server-side i page.tsx og sendt som
          prop, så den er stabil inden for samme dag. */}
      <HaveStemning text={gardenNote} />

      {/* PERSONLIG RELEVANS — horisontal scroll med KUN de af brugerens
          planter der kræver handling lige nu (skal udplantes/ompottes,
          klar til høst, mangler logning). Hvert kort bærer sin
          handlings-årsag. Princip: Planter-siden ejer overblikket,
          kalenderen ejer handlingen — så dette er IKKE et galleri over
          alle planter, men en kort handlings-liste. */}
      <section className="space-y-2">
        <Eyebrow>Din dyrkning</Eyebrow>
        <DinDyrkning plants={plants} />
      </section>

      {/* 4 · HANDLING — Mine opgaver. Sidder direkte efter uge-stripen
          fordi uge + opgaver er samme operationelle tidslag. Linket
          "Ugens opgaver →" fra DenneUgeIHaven scrollanchorer hertil. */}
      <section id="mine-opgaver" className="space-y-3 scroll-mt-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              Mine opgaver
              <span
                className="inline-flex items-center"
                title="Konkrete to-dos med specifik dato. Auto-genereres fra dine dyrkningsguides eller oprettes manuelt. Modsat 'Gøremål' der er sæsonbestemte ting."
              >
                <Info className="h-3 w-3 text-muted-foreground" />
              </span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-4 px-5 pb-5">
            <TodoTabs tasks={tasks} />
            {/* Ny opgave på samme board som Mine opgaver —
                aflang afrundet fuld-bredde knap */}
            <AddTaskDialog plants={aktivePlanter}>
              <Button className="w-full">
                <Plus className="h-4 w-4" />
                Ny opgave
              </Button>
            </AddTaskDialog>
          </div>
        </Card>
      </section>

      {/* 5 · ORIENTERING — Årshjulet, "den botaniske tidsmotor".
          SKJULT INDTIL VIDERE: hele Aarshjul-sektionen er midlertidigt
          gated bag false. "Det kan du gøre i"-card'et ovenfor har nu
          måneds-navigation (APRIL ← / → JUNI) der dækker stort set
          samme behov uden at duplikere informationen.

          Det fulde 12-måneds visuelle årshjul (TimingHorisont) ligger
          i `src/components/havekalender/timing-horisont.tsx` og kan
          enten genaktiveres her (sæt gate til true) eller flyttes til
          en dedikeret /aarshjul-side senere når brugen kalder på det. */}
      {false && (
        <section id="aarshjul" className="space-y-2 scroll-mt-20">
          <Aarshjul
            active={valgtMaaned}
            onChange={setValgtMaaned}
            tasks={tasks}
            generelle={generalTasks.filter(g => !g.isHiddenByMe)}
            renderActive={(m) => (
              <div className="space-y-5">
                <TimingHorisont
                  inventory={inventory}
                  plants={plants}
                  currentMonth={m}
                />

                <MaanedensGoeremaal
                  embedded
                  month={m}
                  generalTasks={generalTasks}
                  userTasks={userTasks}
                  visSkjulte={visSkjulte}
                  onToggleSkjulte={() => setVisSkjulte(v => !v)}
                  existingTasks={tasks}
                  year={year}
                />
              </div>
            )}
          />
        </section>
      )}

      {/* 6 · INSPIRATION — tre asymmetriske lag (Fra din frøbank →
          Kurateret → Fordyb dig). Community-lagene ("Andre dyrker",
          "Idétavle") er fjernet til launch — fokus er at hjælpe i
          haven, ikke fællesskab. Mindre funktion, mere stemning. */}
      <Inspiration
        month={valgtMaaned}
        inventory={inventory}
        plants={plants}
      />

      {/* 7 · ENGAGEMENT — månedens udfordring.
          SKJULT INDTIL VIDERE: communities + challenges-funktioner
          er midlertidigt dektiveret per user-direktion (haven-i-fokus
          retning, ikke gamification). Hele blokken bevares som
          kommenteret kode klar til genaktivering. */}
      {false && challengesForMonth(valgtMaaned).length > 0 && (
        <section className="space-y-2">
          <Eyebrow>Månedens udfordring</Eyebrow>
          <Link
            href="/havelandskab"
            className="group flex items-center gap-3 rounded-tl-[1.5rem] rounded-br-[1.5rem] rounded-tr-md rounded-bl-md bg-[var(--block-sun)] px-5 py-4 text-[var(--foreground)] transition-transform hover:-translate-y-0.5"
          >
            <Compass className="h-5 w-5 shrink-0 opacity-80" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">
                {challengesForMonth(valgtMaaned).length === 1
                  ? challengesForMonth(valgtMaaned)[0].title
                  : `${challengesForMonth(valgtMaaned).length} sæson-challenges denne måned`}
              </p>
              <p className="text-xs opacity-70 mt-0.5">
                Deltag i den fælles rytme — alle PotAlot-brugere er med.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </section>
      )}

      {/* 8 · (Tidligere HentInspiration-CTA-row er fjernet —
          "Fordyb dig"-laget inde i Inspiration-card'et ovenfor dækker
          nu adgangen til Dyrkningsguides + Idétavle som store
          invitationskort. HentInspiration-komponenten bevares i koden
          hvis vi vil have den tilbage et andet sted senere.) */}

      {/* 9 · PROGRESSION — kommende i næste måned (forventning) */}
      <NaesteMaaned month={nuMaaned} generalTasks={generalTasks} />
    </div>
  )
}

/**
 * 4 · Dine planter i fokus — personlig sektion. Dine aktive
 * planter + deres nærmeste åbne opgave (ægte data, ingen fyld).
 */
function DinePlanterIFokus({ plants, tasks }: { plants: Plant[]; tasks: CalendarTask[] }) {
  const aktive = plants.filter(p => !p.isArchived)

  if (aktive.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Du har ingen aktive planter endnu.{' '}
        <Link href="/froebank" className="font-semibold text-primary underline-offset-2 hover:underline">
          Aktivér en sort fra frøbanken
        </Link>{' '}
        — så følger dine egne planter dig her.
      </p>
    )
  }

  function nextTaskFor(plantId: string): CalendarTask | null {
    return tasks
      .filter(t => t.linkedPlantId === plantId && t.status === 'open')
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  }

  const vist = aktive.slice(0, 6)

  return (
    <div className="space-y-1.5">
      {vist.map((p, i) => {
        const nt = nextTaskFor(p.id)
        const status = PLANT_STATUS_META[p.status]?.label ?? ''
        const radius = i % 2 === 0
          ? 'rounded-tl-[1.25rem] rounded-br-[1.25rem] rounded-tr-md rounded-bl-md'
          : 'rounded-tr-[1.25rem] rounded-bl-[1.25rem] rounded-tl-md rounded-br-md'
        return (
          <Link
            key={p.id}
            href={`/mine-planter/${p.id}`}
            className={cn(
              'group flex items-center gap-3 border-l-[3px] border-primary/40 bg-secondary px-4 py-3 transition-transform hover:-translate-y-0.5',
              radius
            )}
          >
            <Sprout className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {p.name}
                {p.variety && <span className="ml-1.5 font-normal text-muted-foreground">{p.variety}</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {nt ? `Næste: ${nt.title}` : status}
              </p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        )
      })}
      {aktive.length > vist.length && (
        <Link href="/mine-planter" className="inline-block pt-1 text-xs font-semibold text-primary">
          Se alle {aktive.length} planter →
        </Link>
      )}
    </div>
  )
}

/**
 * 8 · Hent inspiration — eksplorativt, ikke akut. Varierede
 * label-links (ikke ens bokse).
 */
function HentInspiration() {
  // "Fællesskab"/grupper-linket er SKJULT INDTIL VIDERE per
  // user-direktion (haven-i-fokus retning, ingen community-feature
  // før vi er klar). Lader linket stå som kommentar så det er let
  // at genaktivere senere.
  const links = [
    { href: '/guides', label: 'Dyrkningsguides', icon: BookOpen, bg: 'var(--block-fresh)' },
    { href: '/idetavle', label: 'Idétavle', icon: Lightbulb, bg: 'var(--block-sun)' },
    // { href: '/grupper', label: 'Fællesskab', icon: Users, bg: 'var(--accent)' },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l, i) => {
        const Icon = l.icon
        const radius = i % 2 === 0
          ? 'rounded-tl-[1.1rem] rounded-br-[1.1rem] rounded-tr-md rounded-bl-md'
          : 'rounded-tr-[1.1rem] rounded-bl-[1.1rem] rounded-tl-md rounded-br-md'
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn('inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-transform hover:-translate-y-0.5', radius)}
            style={{ backgroundColor: l.bg }}
          >
            <Icon className="h-4 w-4 opacity-80" />
            {l.label}
          </Link>
        )
      })}
    </div>
  )
}

function MaanedensGoeremaal({
  month, generalTasks, userTasks, visSkjulte, onToggleSkjulte, existingTasks, year, embedded = false,
}: {
  month: number
  generalTasks: GeneralGardenTask[]
  userTasks: UserGardenTask[]
  visSkjulte: boolean
  onToggleSkjulte: () => void
  existingTasks: CalendarTask[]
  year: number
  /** Indlejret i månedens blok i årshjulet — uden Card-ramme/titel */
  embedded?: boolean
}) {
  const monthName = MONTHS_DA[month - 1].full
  const generelleAlle = generalTasks.filter(g => g.month === month)
  const generelleSynlige = generelleAlle.filter(g => !g.isHiddenByMe)
  const generelleSkjulte = generelleAlle.filter(g => g.isHiddenByMe)
  const mine = userTasks.filter(u => u.month === month)
  const harSkjulte = generelleSkjulte.length > 0

  // Find hvilke general_task_ids brugeren allerede har tilføjet til kalender i indeværende år
  const yearStr = String(year)
  const tilfoejedeIds = new Set(
    existingTasks
      .filter(t => t.source === 'general' && t.sourceId && t.date.startsWith(yearStr))
      .map(t => t.sourceId as string)
  )

  // Ikke kategorier/prioritet — menneskelig timing-tredeling.
  // Hvad er vigtigt LIGE NU, ikke "åbn kategorien Biodiversitet".
  const bucketOf = (p: GeneralGardenTask['priority']) =>
    p === 'critical' || p === 'high' ? 0 : p === 'medium' ? 1 : 2
  const sorteret = [...generelleSynlige].sort(
    (a, b) => bucketOf(a.priority) - bucketOf(b.priority)
  )
  const VIS_ANTAL = 6
  const [visAlle, setVisAlle] = useState(false)
  const vist = visAlle ? sorteret : sorteret.slice(0, VIS_ANTAL)
  const flereAntal = sorteret.length - vist.length
  const TIMING = [
    { Icon: IconSol, label: 'Gør nu', bg: 'var(--accent)' },
    { Icon: IconSpire, label: 'God timing', bg: 'var(--block-fresh)' },
    { Icon: IconKop, label: 'Hvis du har tid', bg: 'var(--secondary)' },
  ] as const

  const indhold = (
    <>
        {/* Havens gøremål — venlige sæsonskub efter timing/energi,
            ikke kategorier eller opgavestyring. Kun et lille udvalg. */}
        {generelleSynlige.length > 0 && (
          <div className="space-y-4">
            {TIMING.map((t, bi) => {
              const items = vist.filter(g => bucketOf(g.priority) === bi)
              if (items.length === 0) return null
              const Icon = t.Icon
              return (
                <div key={t.label} className="space-y-1.5">
                  <p className="flex items-center gap-2.5 text-sm font-bold text-foreground">
                    <span
                      aria-hidden
                      className="inline-flex h-7 w-7 items-center justify-center rounded-tl-[0.9rem] rounded-br-[0.9rem] rounded-tr-md rounded-bl-md"
                      style={{ backgroundColor: t.bg }}
                    >
                      <Icon className="h-[18px] w-[18px] text-[var(--foreground)]" />
                    </span>
                    {t.label}
                  </p>
                  <div className="space-y-1.5">
                    {items.map(g => (
                      <GeneralTaskCard
                        key={g.id}
                        task={g}
                        alreadyAdded={tilfoejedeIds.has(g.id)}
                        year={year}
                        soft
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {(flereAntal > 0 || visAlle) && (
              <button
                type="button"
                onClick={() => setVisAlle(v => !v)}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-transform hover:-translate-y-0.5"
              >
                {visAlle ? 'Vis færre' : `Se flere gøremål${flereAntal > 0 ? ` (${flereAntal})` : ''}`}
                <ChevronDown className={cn('h-4 w-4 transition-transform', visAlle && 'rotate-180')} />
              </button>
            )}
          </div>
        )}

        {/* Skjulte (toggle) */}
        {harSkjulte && (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleSkjulte}
              className="text-xs text-muted-foreground"
            >
              {visSkjulte ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {visSkjulte ? 'Skjul markerede' : `Vis ${generelleSkjulte.length} skjulte`}
            </Button>
            {visSkjulte && (
              <div className="space-y-2 mt-2">
                {generelleSkjulte.map(t => (
                  <GeneralTaskCard
                    key={t.id}
                    task={t}
                    alreadyAdded={tilfoejedeIds.has(t.id)}
                    year={year}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Brugerens egne */}
        {mine.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Mine gøremål</p>
            {mine.map(t => <UserTaskRow key={t.id} task={t} />)}
          </div>
        )}

        {generelleSynlige.length === 0 && mine.length === 0 && !harSkjulte && (
          <p className="text-sm text-muted-foreground italic">Ingen gøremål i {monthName.toLowerCase()}.</p>
        )}
    </>
  )

  // Indlejret i månedens blok i årshjulet: ingen Card-ramme,
  // ingen redundant "Gøremål — {måned}"-titel (blokken har den).
  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
            Månedens gøremål
          </p>
          <UserTaskDialog defaultMonth={month} />
        </div>
        {indhold}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Gøremål — {monthName}
          <span
            className="inline-flex items-center"
            title="Sæsonbestemte ting man typisk gør hver måned. Klik et gøremål for at folde det ud og se detaljer eller tilføje det til Mine opgaver."
          >
            <Info className="h-3 w-3 text-muted-foreground" />
          </span>
        </CardTitle>
        <UserTaskDialog defaultMonth={month} />
      </CardHeader>
      <CardContent className="space-y-4">{indhold}</CardContent>
    </Card>
  )
}

function UserTaskRow({ task }: { task: UserGardenTask }) {
  return (
    <div className="border-l-2 border-accent-copper/40 pl-3 py-1">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{task.title}</p>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
          )}
          {task.timeWindow && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">{task.timeWindow}</p>
          )}
        </div>
        <UserTaskDialog task={task} />
      </div>
    </div>
  )
}

/**
 * De N mest forekommende gøremåls-kategorier for en given måned.
 * Bruges til hero'ens 'månedens fokus'-tags.
 */
function topCategories(tasks: GeneralGardenTask[], month: number, n: number): string[] {
  const counts = new Map<string, number>()
  for (const t of tasks) {
    if (t.month !== month || t.isHiddenByMe || !t.category) continue
    counts.set(t.category, (counts.get(t.category) ?? 0) + 1)
  }
  // På lige antal: vis de mest "hero-værdige" kategorier først
  // (så fx Maj giver Drivhus/Udplantning/Blomster, ikke en
  // tilfældig Map-rækkefølge).
  const PRIO = [
    'drivhus', 'udplantning', 'blomster', 'såning', 'saaning',
    'køkkenhave', 'koekkenhave', 'høst', 'hoest', 'biodiversitet',
  ]
  const prio = (c: string) => {
    const i = PRIO.indexOf(c.toLowerCase())
    return i < 0 ? 99 : i
  }
  return [...counts.entries()]
    .sort((a, b) =>
      b[1] - a[1] ||
      prio(a[0]) - prio(b[0]) ||
      a[0].localeCompare(b[0], 'da')
    )
    .slice(0, n)
    .map(([cat]) => cat)
}
