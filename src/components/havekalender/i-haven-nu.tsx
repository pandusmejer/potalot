'use client'

/**
 * "I HAVEN NU" — Kalenderens samlede handlingscenter som en "Dagens have-
 * briefing" (Anna 3/7): ét sted der svarer på "Hvad kræver handling nu, hvad
 * kommer næst, hvad kan vente — og hvor kommer det fra?".
 *
 * Struktur (top→bund):
 *   1. Briefing-header — titel + dynamisk "hvad kalder i dag"-linje.
 *   2. Fokus-kort — dagens vigtigste, farvet venstremarkør efter urgency.
 *   3. Mini-statuskort (2×2) — let overblik/filter, IKKE tung tabs-boks.
 *   4. Opgaver som små taktile task-cards, opdelt i grupper med rytme:
 *      Forsinket → Gør nu → Næste i haven → Når du har tid → Dine opgaver.
 *   5. Sekundær "Tilføj opgave"-CTA.
 *
 * ÆRLIGHED: FokusHandling bærer hverken billede eller tids-estimat, så rækkerne
 * bruger en neutral KILDE-MARKØR (ikon-badge: plante/frøbank/rutine) — ingen
 * opdigtede plantefotos, ingen fabrikerede "5 min". Metadata = ægte kilde.
 *
 * Data- og completion-logik er UÆNDRET (genbruger BRAIN + fokus-handling-ui).
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { TaskRow } from '@/components/overblik/task-row'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import {
  PrimaryFocus, CheckCircle, Chip, useDerivedCompletions, chipLabel,
} from '@/components/havekalender/fokus-handling-ui'
import Link from 'next/link'
import {
  Sprout, Flower2, RefreshCw, CalendarDays, Clock, CheckCheck, CalendarCheck, Info, Plus,
} from 'lucide-react'
import { erIDag, erForsinket, idag } from '@/lib/datetime'
import type { CalendarTask } from '@/lib/types'
import type { DagensFokus, FokusHandling } from '@/lib/kalender/dagens-fokus'

interface Props {
  tasks: CalendarTask[]
  dagensFokus: DagensFokus
  canPersist: boolean
  aktivePlanter: React.ComponentProps<typeof AddTaskDialog>['plants']
  /** Aktuel måned (1-12) — til chip-logikken. Stabil pr. dag (ingen hydration-mismatch). */
  month: number
}

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/** Chip-labels der betyder "tidskritisk nu" hhv. "snart". Resten = når du har tid. */
const URGENT = new Set(['Haster', 'Høst nu', 'Godt vindue'])
const SOON = new Set(['Plant ud', 'Tjek', 'Mere plads'])

/** Inden for `dage` dage frem (≥ i dag) — samme regel som TodoTabs. */
function erInden(date: string, dage: number): boolean {
  const today = new Date(idag())
  const target = new Date(date)
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= dage
}

/** Neutral kilde-markør — ikon-badge frem for opdigtet foto (der er endnu ingen
 *  ægte plante-thumbnails i datamodellen). Farve/ikon efter kilde. */
function SourceMarker({ kind }: { kind: 'plant' | 'seed' | 'routine' }) {
  const m = {
    plant:   { Icon: Sprout,    bg: 'rgba(107,138,74,0.16)', color: '#4C6038' },
    seed:    { Icon: Flower2,   bg: 'rgba(168,124,59,0.15)', color: '#8A6A2E' },
    routine: { Icon: RefreshCw, bg: 'rgba(64,58,42,0.07)',   color: 'rgba(64,58,42,0.55)' },
  }[kind]
  return (
    <span
      aria-hidden
      style={{ width: 46, height: 46, borderRadius: 999, background: m.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}
    >
      <m.Icon style={{ width: 21, height: 21, color: m.color }} strokeWidth={1.7} />
    </span>
  )
}

export function IHavenNu({ tasks, dagensFokus, canPersist, aktivePlanter, month }: Props) {
  const { isDone, toggle } = useDerivedCompletions(
    [...dagensFokus.fokus, ...dagensFokus.flere, ...dagensFokus.rytme],
    canPersist,
  )

  // ── Pinned fokus = BRAIN-toppen. Ejer den øverste prioritet og udelades
  //    derfor af alle lister (ingen dublet). ───────────────────────────
  const pinned = dagensFokus.fokus[0] ?? null
  const pinnedKey = pinned?.taskKey

  const akutResten = [...dagensFokus.fokus.slice(1), ...dagensFokus.flere]
    .filter(h => h.taskKey !== pinnedKey)
  const rytme = dagensFokus.rytme
  const rytmeKeys = new Set(rytme.map(h => h.taskKey))

  const derivedIDag   = akutResten
  const derivedUge    = [...akutResten, ...rytme]
  const derivedMaaned = [...akutResten, ...rytme]
  const derivedDone   = [...akutResten, ...rytme].filter(isDone)

  // ── Brugerens egne daterede opgaver (samme bucketing som TodoTabs) ──
  const aaben = tasks.filter(t => t.status === 'open')
  const userIDag   = aaben.filter(t => erIDag(t.date))
  const userUge    = aaben.filter(t => erIDag(t.date) || (!erForsinket(t.date) && erInden(t.date, 7)))
  const userMaaned = aaben.filter(t => erIDag(t.date) || (!erForsinket(t.date) && erInden(t.date, 30)))
  const forsinkede = aaben.filter(t => erForsinket(t.date))
  const afsluttede = tasks.filter(t => t.status === 'completed').slice(0, 20)

  const antal = (derived: FokusHandling[], user: CalendarTask[]) =>
    derived.filter(h => !isDone(h)).length + user.length

  /** Gruppér afledte efter urgency (BRAIN har allerede prioriteret rækkefølgen). */
  function groupDerived(list: FokusHandling[]) {
    const active = list.filter(h => !isDone(h))
    return {
      nu:     active.filter(h => URGENT.has(chipLabel(h, month))),
      snart:  active.filter(h => SOON.has(chipLabel(h, month))),
      senere: active.filter(h => !URGENT.has(chipLabel(h, month)) && !SOON.has(chipLabel(h, month))),
    }
  }

  // ── Briefing-linje: hvad kalder i dag. ──────────────────────────────
  const iDagAntal = antal(derivedIDag, userIDag)
  const hasterAntal = forsinkede.length + derivedIDag.filter(
    h => !isDone(h) && (chipLabel(h, month) === 'Haster' || chipLabel(h, month) === 'Høst nu'),
  ).length
  const briefing = iDagAntal === 0 && forsinkede.length === 0
    ? 'Roligt i haven i dag'
    : `${iDagAntal} ${iDagAntal === 1 ? 'ting' : 'ting'} kalder i dag${hasterAntal > 0 ? ` · ${hasterAntal} haster` : ''}`

  // ── Render-hjælpere ─────────────────────────────────────────────────
  function groupLabel(text: string, tone?: string) {
    const color = tone ?? 'rgba(47,77,43,0.72)'
    return (
      <div className="flex items-center gap-1.5" style={{ margin: '26px 0 12px' }}>
        <span style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color }}>
          {text}
        </span>
        <Sprout style={{ width: 13, height: 13, color, opacity: 0.75 }} strokeWidth={1.9} aria-hidden />
      </div>
    )
  }

  /** Én afledt handling som lille taktilt task-card. */
  function derivedCard(h: FokusHandling) {
    const routine = rytmeKeys.has(h.taskKey)
    const checkbar = h.plantId !== null
    const kind: 'plant' | 'seed' | 'routine' = routine ? 'routine' : h.plantId !== null ? 'plant' : 'seed'
    const meta = routine ? 'Rutine' : h.plantId !== null ? 'Fra planter' : 'Fra frøbank'
    const done = isDone(h)
    return (
      <div
        key={h.taskKey}
        className="grid"
        style={{
          gridTemplateColumns: '46px minmax(0, 1fr)',
          gap: 12,
          alignItems: 'start',
          padding: '13px 14px',
          borderRadius: 18,
          background: 'rgba(255,250,238,0.72)',
          border: '1px solid rgba(64,58,42,0.08)',
          boxShadow: '0 3px 8px rgba(64,58,42,0.045), inset 0 1px 0 rgba(255,255,255,0.4)',
          marginBottom: 10,
          opacity: done ? 0.55 : 1,
          transition: 'opacity .2s',
        }}
      >
        <SourceMarker kind={kind} />
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            {checkbar ? (
              <CheckCircle done={done} onToggle={() => toggle(h)} label={done ? `Fortryd: ${h.titel}` : `Markér udført: ${h.titel}`} size={22} />
            ) : (
              <span className="shrink-0" style={{ width: 2 }} aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link href={h.href} className="min-w-0" style={{ textDecoration: 'none' }}>
                  <span style={{ display: 'block', fontFamily: sans, fontSize: 16.5, fontWeight: 750, lineHeight: 1.22, letterSpacing: '-0.01em', color: '#203024', textDecoration: done ? 'line-through' : 'none' }}>
                    {h.titel}
                  </span>
                </Link>
                {!done && <Chip h={h} month={month} size="lg" />}
              </div>
              <Link href={h.href} style={{ textDecoration: 'none' }}>
                <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, lineHeight: 1.32, color: 'rgba(35,56,43,0.68)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {h.hvorfor}
                </span>
              </Link>
              <span style={{ display: 'block', fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(35,56,43,0.4)', marginTop: 8 }}>
                {meta}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function statTab(value: string, label: string, count: number, Icon: typeof CalendarDays, danger?: boolean) {
    return (
      <TabsTrigger
        value={value}
        className="flex h-auto flex-col items-start justify-center gap-0.5 rounded-[18px] border px-4 py-2 text-left transition-all border-[rgba(64,58,42,0.09)] bg-[rgba(255,250,238,0.55)] data-[state=active]:border-[rgba(85,116,59,0.26)] data-[state=active]:bg-[rgba(252,248,230,0.95)] data-[state=active]:shadow-[0_4px_10px_rgba(64,58,42,0.08)]"
      >
        <span className="tabular-nums" style={{ fontFamily: sans, fontSize: 23, fontWeight: 800, lineHeight: 1, color: danger && count > 0 ? '#B5602F' : '#2F4D2B' }}>
          {count}
        </span>
        <span className="flex w-full items-center justify-between">
          <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(35,56,43,0.6)' }}>{label}</span>
          <Icon style={{ width: 14, height: 14, color: 'rgba(35,56,43,0.32)' }} strokeWidth={1.9} aria-hidden />
        </span>
      </TabsTrigger>
    )
  }

  /** Grupperet horisont: Forsinket (rød) → Gør nu → Næste i haven → Når du har tid → Dine opgaver. */
  function renderHorizon(
    derived: FokusHandling[],
    user: CalendarTask[],
    opts: { showOverdue?: boolean; emptyTitle: string; emptyDescription: string },
  ) {
    const { nu, snart, senere } = groupDerived(derived)
    const overdue = opts.showOverdue ? forsinkede : []
    if (nu.length + snart.length + senere.length + user.length + overdue.length === 0) {
      return <EmptyState icon={<CalendarCheck className="h-8 w-8" />} title={opts.emptyTitle} description={opts.emptyDescription} />
    }
    return (
      <div>
        {overdue.length > 0 && (
          <div>
            {groupLabel('Forsinket', 'rgba(181,96,47,0.92)')}
            <div className="space-y-2">{overdue.map(t => <TaskRow key={t.id} task={t} showSource />)}</div>
          </div>
        )}
        {nu.length > 0 && <div>{groupLabel('Gør nu', 'rgba(76,96,56,0.92)')}{nu.map(derivedCard)}</div>}
        {snart.length > 0 && <div>{groupLabel('Næste i haven')}{snart.map(derivedCard)}</div>}
        {senere.length > 0 && <div>{groupLabel('Når du har tid')}{senere.map(derivedCard)}</div>}
        {user.length > 0 && (
          <div>
            {groupLabel('Dine opgaver')}
            <div className="space-y-2">{user.map(t => <TaskRow key={t.id} task={t} showSource />)}</div>
          </div>
        )}
      </div>
    )
  }

  function renderDone() {
    if (afsluttede.length === 0 && derivedDone.length === 0) {
      return (
        <EmptyState
          icon={<CalendarCheck className="h-8 w-8" />}
          title="Ingen afsluttede opgaver endnu"
          description="Når du markerer opgaver som udført, dukker de op her."
        />
      )
    }
    return (
      <div>
        {derivedDone.map(derivedCard)}
        <div className="space-y-2">{afsluttede.map(t => <TaskRow key={t.id} task={t} compact showSource />)}</div>
      </div>
    )
  }

  return (
    <section id="mine-opgaver" className="scroll-mt-20">
      <Card
        className="overflow-hidden"
        style={{
          borderRadius: 30,
          border: '1px solid rgba(64,58,42,0.10)',
          background: 'linear-gradient(180deg, #FBF7EC 0%, #F5EFE1 100%)',
          boxShadow: '0 14px 32px rgba(64,58,42,0.08), inset 0 1px 0 rgba(255,255,255,0.45)',
        }}
      >
        {/* 1 · Briefing-header. */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="flex items-center gap-1.5 leading-none text-foreground" style={{ fontFamily: serif, fontSize: 28, fontWeight: 600 }}>
            I haven nu
            <span
              className="inline-flex items-center"
              title="Kalenderens handlingscenter: dagens vigtigste fokus øverst, derefter opgaver og afledte handlinger fra planter og frøbank."
            >
              <Info style={{ width: 15, height: 15 }} className="text-muted-foreground" />
            </span>
          </h3>
          <p style={{ fontFamily: sans, fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.005em', color: '#55743B', margin: '9px 0 0' }}>
            {briefing}
          </p>
        </div>

        <div className="space-y-4 px-5 pb-6">
          {/* 2 · Fokus-kort. */}
          {pinned ? (
            <PrimaryFocus h={pinned} done={isDone(pinned)} month={month} markoer="Fokus" onToggle={() => toggle(pinned)} />
          ) : dagensFokus.almanak ? (
            <div
              className="rounded-tl-[1.4rem] rounded-br-[1.4rem] rounded-tr-md rounded-bl-md"
              style={{ background: 'var(--secondary)', padding: '16px 18px' }}
            >
              <p className="text-sm font-medium text-foreground">Alt er roligt i haven i dag</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{dagensFokus.almanak}</p>
            </div>
          ) : null}

          {/* 3 · Mini-statuskort + 4 · grupperede task-cards. */}
          <Tabs defaultValue="idag">
            <TabsList className="grid w-full grid-cols-2 gap-3 h-auto bg-transparent p-0">
              {statTab('idag', 'I dag', iDagAntal, Sprout, hasterAntal > 0)}
              {statTab('uge', 'Denne uge', antal(derivedUge, userUge), CalendarDays)}
              {statTab('maaned', 'Kan vente', antal(derivedMaaned, userMaaned), Clock)}
              {statTab('afsluttet', 'Færdige', afsluttede.length + derivedDone.length, CheckCheck)}
            </TabsList>

            <TabsContent value="idag">
              {renderHorizon(derivedIDag, userIDag, { showOverdue: true, emptyTitle: 'Roligt i haven i dag', emptyDescription: 'Fokus-kortet ovenfor har dig dækket — ellers: nyd kaffen.' })}
            </TabsContent>
            <TabsContent value="uge">
              {renderHorizon(derivedUge, userUge, { emptyTitle: 'Roligt program i denne uge', emptyDescription: 'Intet på listen — pust ud.' })}
            </TabsContent>
            <TabsContent value="maaned">
              {renderHorizon(derivedMaaned, userMaaned, { emptyTitle: 'Tomt indtil videre', emptyDescription: 'Find inspiration længere nede på siden.' })}
            </TabsContent>
            <TabsContent value="afsluttet">
              {renderDone()}
            </TabsContent>
          </Tabs>

          {/* 5 · Sekundær CTA. */}
          <div className="pt-1">
            <AddTaskDialog plants={aktivePlanter}>
              <Button
                variant="ghost"
                className="w-full rounded-full"
                style={{
                  height: 54,
                  background: 'rgba(89,112,61,0.10)',
                  color: '#2F4D2B',
                  border: '1px solid rgba(47,77,43,0.18)',
                  boxShadow: 'none',
                  fontSize: 16,
                  fontWeight: 750,
                }}
              >
                <Plus style={{ width: 20, height: 20 }} />
                Tilføj opgave
              </Button>
            </AddTaskDialog>
          </div>
        </div>
      </Card>
    </section>
  )
}
