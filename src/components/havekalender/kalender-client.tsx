'use client'

import { useEffect, useRef, useState } from 'react'
import { Aarshjul } from '@/components/havekalender/aarshjul'
// DetKanDuNu er erstattet af det nye 4-lags Inspiration-card. Importen
// bevares som kommentar i tilfælde af genaktivering.
// import { DetKanDuNu } from '@/components/havekalender/det-kan-du-nu'
import { InspirationFolder } from '@/components/havekalender/inspiration-folder'
import { MaanedsHero } from '@/components/havekalender/maaneds-hero'
import { UserTaskDialog } from '@/components/havekalender/user-task-dialog'
import { GeneralTaskCard } from '@/components/havekalender/general-task-card'
import { GardenAlerts } from '@/components/havekalender/garden-alerts'
import { DinDyrkning } from '@/components/havekalender/din-dyrkning'
import { WeatherPoolsImage } from '@/components/havekalender/weather-pools-image'
import { TimingHorisont } from '@/components/havekalender/timing-horisont'
import {
  DetKanDuGoereEditorialPlanner,
  mapTaskToPlannerItem,
} from '@/components/havekalender/det-kan-du-goere-editorial-planner'
import { IHavenNu } from '@/components/havekalender/i-haven-nu'
import { NextMonthTeaser } from '@/components/havekalender/next-month-teaser'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Calendar, EyeOff, Eye, Info, Compass, ArrowRight, ChevronDown,
  Sprout, BookOpen, Users, Lightbulb,
} from 'lucide-react'
import { aktuelMaaned } from '@/lib/datetime'
import { MONTHS_DA, PLANT_STATUS_META } from '@/lib/constants'
import { challengesForMonth } from '@/lib/seasonal-challenges'
import { cn } from '@/lib/utils'
import { hideGeneralTask } from '@/actions/aarshjul'
import { createTask } from '@/actions/havekalender'
import type { GardenAlert, VejrPoolsMaalinger } from '@/actions/weather'
import type { DagensFokus } from '@/lib/kalender/dagens-fokus'
import type { FroebankForslag } from '@/lib/kalender/froebank-forslag'
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
  /** Ægte målinger til vejr-pytterne (null uden lokation → pytter uden overlay). */
  vejr: VejrPoolsMaalinger | null
  isLoggedIn: boolean
  /** Kalenderens hjerne — dagens 1-3 vigtigste (lib/kalender/dagens-fokus). */
  dagensFokus: DagensFokus
  /** plantId → ægte foto-URL (server-resolveret; kun rigtige billeder). */
  plantImages: Record<string, string>
  /**
   * KAL-0110: Inspiration-mappens Frøbank-fane. Måned (1-12) → forslag der
   * er filtreret på NETOP den måned og på brugerens egne frø. Beregnes
   * server-side for hele året, fordi brugeren kan skifte måned i klienten
   * uden at billed-manifesterne skal med i kalenderens bundle.
   */
  froebankForslag: Record<number, FroebankForslag[]>
  /** Har brugeren frø i banken? Skelner "ingen frø" fra "ingen vinduer nu". */
  harFroebank: boolean
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

/** Feature-flag: "Din dyrkning"-striben er midlertidigt skjult 30/6, fordi
 *  "I haven nu" nu dækker afledte plante-handlinger. Sæt til true for at
 *  genaktivere (eller fjern flag + komponent helt efter vurdering). */
const VIS_DIN_DYRKNING = false

/** Lille vejr-note under pytterne. LÅST REGEL (Anna KAL-0140/0142): vejrtekst
 *  kræver et FAKTISK vejrsignal (GardenAlerts: frost > storm > skybrud >
 *  tørke). Intet varsel → ingen note — sæsonprosa må aldrig forklæde sig som
 *  aktuel vejrvurdering. */
function vejrNote(alerts: GardenAlert[]): { headline: string; subline: string } | null {
  const kinds = new Set(alerts.map(a => a.kind))
  if (kinds.has('frost')) return { headline: 'Dæk de sarte i aften.', subline: 'Frost på vej — tomater, georginer og squash er udsatte.' }
  if (kinds.has('storm')) return { headline: 'Bind op og sikr krukker.', subline: 'Hård vind på vej — giv stauder og høje planter støtte.' }
  if (kinds.has('skybrud')) return { headline: 'Vent med at vande.', subline: 'Kraftig regn er på vej.' }
  if (kinds.has('toerke')) return { headline: 'Vand før solen får fat.', subline: 'Lunt og tørt — krukker og drivhus tørrer hurtigt ud.' }
  return null
}

export function KalenderClient({ tasks, plants, inventory, generalTasks, userTasks, guides, alerts, vejr, isLoggedIn, dagensFokus, plantImages, froebankForslag, harFroebank }: Props) {
  const nuMaaned = aktuelMaaned()
  const [valgtMaaned, setValgtMaaned] = useState(nuMaaned)
  const [visSkjulte, setVisSkjulte] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())

  // Månedsheaderen (MaanedsHero). "Se [næste måned]"-teaseren scroller herop
  // via ref — ikke window.top — så den sticky topbar ikke æder placeringen
  // (wrapperen har scroll-mt).
  const maanedsHeaderRef = useRef<HTMLDivElement>(null)

  // Central måneds-skifter: ÉN kilde til sandhed for hele siden. Alle
  // kontroller (planner-stepperen ← →, bund-teaseren, hero-navigationen)
  // går herigennem, så hero, vejr-billede, "Det kan du gøre", Inspiration
  // og teaser altid viser SAMME måned. Håndterer årsskifte begge veje
  // (dec→jan = +1 år, jan→dec = −1).
  const gaaTilMaaned = (next: number) => {
    if (valgtMaaned === 12 && next === 1) setYear((y) => y + 1)
    else if (valgtMaaned === 1 && next === 12) setYear((y) => y - 1)
    setValgtMaaned(next)
  }

  // Fælles månedsskift (Anna 3/8): "Kig mod [måned]" nederst skal vise den
  // nye måned FRA BEGYNDELSEN — scroll sker i en effect EFTER at den nye
  // måned er renderet (ikke synkront i handleren, hvor gammelt indhold
  // stadig står i DOM'en). Hero-navigationen skifter uden scroll (brugeren
  // står allerede ved heroen — ingen hop).
  const [scrollTilHero, setScrollTilHero] = useState(false)
  const skiftMaaned = (next: number, scroll: boolean) => {
    gaaTilMaaned(next)
    if (scroll) setScrollTilHero(true)
  }
  useEffect(() => {
    if (!scrollTilHero) return
    const reduceret = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    maanedsHeaderRef.current?.scrollIntoView({
      behavior: reduceret ? 'auto' : 'smooth',
      block: 'start',
    })
    setScrollTilHero(false)
  }, [valgtMaaned, scrollTilHero])

  // "Kig mod [næste måned]" i bund-teaseren: bladr ét skridt frem fra den
  // VISTE måned (ikke den aktuelle), så man kan bladre længere end ét skridt.
  const handleSelectNextMonth = () => {
    skiftMaaned(valgtMaaned >= 12 ? 1 : valgtMaaned + 1, true)
  }

  const aktivePlanter = plants
    .filter(p => !p.isArchived)
    .map(p => ({ id: p.id, name: p.name, variety: p.variety }))

  // Månedens fokus-tags = top-3 gøremåls-kategorier for valgt måned
  const focusTags = topCategories(generalTasks, valgtMaaned, 3)

  // Månedens gøremål → editorial planner-items (Annas "Det kan du gøre"-design,
  // sammenlagt fra ikon/frøbank-grenen 29/6). mapTaskToPlannerItem bor i planneren.
  const monthlyPlannerItems = generalTasks
    .filter(g => !g.isHiddenByMe)
    .map(mapTaskToPlannerItem)

  // Valgt måned (små bogstaver) til Inspiration-folderen — følger bladringen.
  // "Kig mod …"-teaseren afleder selv NÆSTE måned (label/titel/subtitle/body/
  // hero) ud fra currentMonth, så den får bare den viste måned ind.
  const valgtMaanedNavn = MONTHS_DA[valgtMaaned - 1].full.toLowerCase()

  return (
    <div className="space-y-7">
      {/* 1 · ORIENTERING — månedskapitlet er brugerens mentale landing.
          Heroen er fredet per KALENDER_MASTER_SPEC.md (critical rule).
          scroll-mt giver plads til den sticky topbar, når teaseren scroller herop. */}
      <div ref={maanedsHeaderRef} className="scroll-mt-20">
        <MaanedsHero
          month={valgtMaaned}
          year={year}
          focusTags={focusTags}
          onForrige={() => skiftMaaned(valgtMaaned <= 1 ? 12 : valgtMaaned - 1, false)}
          onNaeste={() => skiftMaaned(valgtMaaned >= 12 ? 1 : valgtMaaned + 1, false)}
        />
      </div>

      {/* 2 · VEJR-POOLS — sæson-billed-assets med tekst-overlay (sanselag).
          Ikke et dashboard; rolige observationer fra haven. Sæsonbilledet
          skifter med måneden. Overlay = ÆGTE Open-Meteo-målinger for havens
          placering (KAL-0137: live data eller intet). Målinger og varsler
          gælder KUN nu — bladrer man væk fra den aktuelle måned, vises
          sæsonbilledet uden tal og noten falder tilbage. */}
      <WeatherPoolsImage
        month={valgtMaaned}
        data={(valgtMaaned === nuMaaned ? vejr : null) ?? undefined}
        note={vejrNote(valgtMaaned === nuMaaned ? alerts : []) ?? undefined}
      />

      {/* 3 · I HAVEN NU — Kalenderens samlede handlingscenter (Anna 30/6,
          "én arbejdsseddel"). Pinned "Fokus lige nu" (BRAIN-toppen) over
          fanerne + I dag/Denne uge/Denne måned/Forsinket/Afsluttet med
          brugerens egne opgaver + afledte handlinger fra Planter/Frøbank.
          Afløser standalone "Ugens fokus" + den gamle "Mine opgaver"-Card. */}
      <IHavenNu
        tasks={tasks}
        dagensFokus={dagensFokus}
        canPersist={isLoggedIn}
        aktivePlanter={aktivePlanter}
        plantImages={plantImages}
        month={nuMaaned}
      />

      {/* 4 · MÅNEDENS RYTME — det botaniske årshjul-snapshot.
          Erstatter den gamle "Månedens guide". Indeholder
          DYRKNINGSRYTME (rytme-tidslinjer pr. afgrøde) og
          MÅNEDENS FOKUS (3-5 prioriterede opgaver). Sektionen
          giver brugeren "hvad betyder maj for min have"-overblikket
          på under 5 sekunder. Per spec: placeret efter Denne uge,
          FØR Mine opgaver. */}
      <DetKanDuGoereEditorialPlanner
        month={valgtMaaned}
        onMonthChange={gaaTilMaaned}
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

      {/* (Den daglige sensoriske stemnings-note er BEVIDST fjernet fra
          kalenderen — kalendersiden har rigeligt med tekst. garden-notes-
          puljen kører fortsat på /froebank og /mine-planter.) */}

      {/* PERSONLIG RELEVANS — "Din dyrkning" (horisontal plante-action-strip).
          MIDLERTIDIGT SKJULT 30/6 (VIS_DIN_DYRKNING=false): "I haven nu"-modulet
          ovenfor viser nu de samme afledte plante-handlinger (Plant ud / Giv
          mere plads / Høst), så striben dublerer rollen. Beholdes som kode mens
          vi vurderer kalenderen uden overlap; hører sandsynligvis bedre hjemme
          på Planter-forsiden (status på konkrete planter) end i Kalender.
          Sæt flaget til true for at genaktivere. */}
      {VIS_DIN_DYRKNING && (
        <section className="space-y-2">
          <Eyebrow>Din dyrkning</Eyebrow>
          <DinDyrkning plants={plants} isLoggedIn={isLoggedIn} />
        </section>
      )}

      {/* (Tidligere stod "Mine opgaver"-Card'et her som et separat opgavebræt.
          Det er nu samlet ind i "I haven nu"-modulet øverst (pos 3), så der
          ikke er flere overlappende handlingsflader.) */}

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
            onChange={gaaTilMaaned}
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

      {/* 6 · INSPIRATION-FOLDER — kalenderens frivillige fordybelse,
          samlet i én editorial mappe med tre faner (Frøbank / Juni-greb
          / Guides). Erstatter de tidligere løse inspirationslag. Ingen
          opgavestatus, ingen persistens — ren "dyk ned hvis du har lyst". */}
      <InspirationFolder
        month={valgtMaaned}
        monthName={valgtMaanedNavn}
        seedItems={froebankForslag[valgtMaaned] ?? []}
        hasSeedsInBank={harFroebank}
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
                  : `${challengesForMonth(valgtMaaned).length} sæsonudfordringer denne måned`}
              </p>
              <p className="text-xs opacity-70 mt-0.5">
                Deltag i den fælles rytme — alle Potalot-brugere er med.
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

      {/* 9 · PROGRESSION — rolig teaser mod næste måned. Kalenderens
          afslutning ("næste kapitel venter"), ikke endnu en opgaveliste. */}
      <NextMonthTeaser currentMonth={valgtMaaned} onSelectNextMonth={handleSelectNextMonth} />
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
