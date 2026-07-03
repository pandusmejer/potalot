'use client'

/**
 * "I HAVEN NU" — Kalenderens samlede handlingscenter. Ét sted der svarer på
 * "Hvad skal jeg faktisk holde øje med og gøre?".
 *
 * Sammenlægger (Anna 2026-06-30, "én arbejdsseddel"):
 *   • BRAIN'ens top-prioritet som et pinned "Fokus lige nu"-kort OVER fanerne
 *     — altid synligt, ejer den øverste prioritet (vises aldrig igen i listen).
 *   • Fanerne (I dag / Denne uge / Kan vente / Færdige) = opgaveoverblikket:
 *     brugerens egne daterede `calendar_tasks` + afledte "nu"-handlinger fra
 *     Planter/Frøbank, hver med diskret kilde-chip.
 *
 * Design (Anna 3/7): "Dagens havebriefing", ikke flad to-do i beige kort.
 *   1. Briefing-header (titel + hvad kalder i dag)
 *   2. Fokus-kort (dagens vigtigste, særstatus)
 *   3. Mini-statuskort (let overblik/filter — IKKE tung tabs-boks)
 *   4. Opgaver opdelt i grupper (Gør nu / Snart / Når du har tid / Dine opgaver)
 *   5. Sekundær "Tilføj opgave"-CTA
 *
 * Grænse: ingen ny BRAIN-logik, ingen admin-opgaver som datakilde her. Data-
 * og completion-logik er UÆNDRET — kun informationsarkitektur + visuelt.
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { TaskRow } from '@/components/overblik/task-row'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import {
  PrimaryFocus, SecondaryRow, useDerivedCompletions, chipLabel,
} from '@/components/havekalender/fokus-handling-ui'
import { SourceChip } from '@/components/havekalender/source-chip'
import { CalendarCheck, Info, Plus } from 'lucide-react'
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

/** Inden for `dage` dage frem (≥ i dag) — samme regel som TodoTabs. */
function erInden(date: string, dage: number): boolean {
  const today = new Date(idag())
  const target = new Date(date)
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= dage
}

/** Kilde-chip for en afledt handling: plante-bunden vs. frøbank-invitation. */
function derivedSourceChip(h: FokusHandling) {
  return <SourceChip label={h.plantId !== null ? 'Fra planter' : 'Fra frøbank'} />
}

/** Chip-labels der betyder "tidskritisk nu" hhv. "snart". Resten = når du har tid. */
const URGENT = new Set(['Haster', 'Høst nu', 'Godt vindue'])
const SOON = new Set(['Plant ud', 'Tjek', 'Mere plads'])

export function IHavenNu({ tasks, dagensFokus, canPersist, aktivePlanter, month }: Props) {
  const { isDone, toggle } = useDerivedCompletions(
    [...dagensFokus.fokus, ...dagensFokus.flere, ...dagensFokus.rytme],
    canPersist,
  )

  // ── Pinned fokus = BRAIN-toppen. Ejer den øverste prioritet og udelades
  //    derfor af alle lister (ingen dublet). ───────────────────────────
  const pinned = dagensFokus.fokus[0] ?? null
  const pinnedKey = pinned?.taskKey

  // Afledte "nu"-handlinger (lag 1-4) minus den pinnede + vedligehold ("rytme", lag 5).
  const akutResten = [...dagensFokus.fokus.slice(1), ...dagensFokus.flere]
    .filter(h => h.taskKey !== pinnedKey)
  const rytme = dagensFokus.rytme

  // Afledte pr. horisont. "Nu"-handlinger er relevante i dag OG ugen; rytme
  // hører til uge/måned (vedligehold, ikke dagens hast).
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

  /** Antal i en horisont = aktive afledte (ikke-udførte) + brugeropgaver. */
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
    : `${iDagAntal} ${iDagAntal === 1 ? 'opgave' : 'opgaver'} i dag${hasterAntal > 0 ? ` · ${hasterAntal} haster` : ''}`

  // ── Render-hjælpere (funktions-kald, ikke nestede komponenter) ──────
  function groupLabel(text: string, tone?: string) {
    return (
      <p
        className="uppercase"
        style={{ fontFamily: sans, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: tone ?? 'rgba(35,56,43,0.46)', margin: '2px 0 7px' }}
      >
        {text}
      </p>
    )
  }

  function derivedList(list: FokusHandling[]) {
    return (
      <div>
        {list.map((h, i) => (
          <SecondaryRow
            key={h.taskKey}
            h={h}
            done={false}
            first={i === 0}
            month={month}
            onToggle={() => toggle(h)}
            sourceChip={derivedSourceChip(h)}
          />
        ))}
      </div>
    )
  }

  function statTab(value: string, label: string, count: number, danger?: boolean) {
    return (
      <TabsTrigger
        value={value}
        className="flex h-auto flex-col items-start justify-center gap-0.5 rounded-xl border px-3.5 py-2.5 text-left transition-all border-[rgba(64,58,42,0.08)] bg-[rgba(255,252,244,0.5)] data-[state=active]:border-[rgba(76,96,56,0.28)] data-[state=active]:bg-[rgba(255,250,238,0.96)] data-[state=active]:shadow-[0_2px_6px_rgba(64,58,42,0.09)]"
      >
        <span
          className="tabular-nums"
          style={{ fontFamily: sans, fontSize: 22, fontWeight: 750, lineHeight: 1, color: danger && count > 0 ? '#B5602F' : '#2F4D2B' }}
        >
          {count}
        </span>
        <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: 'rgba(35,56,43,0.58)' }}>
          {label}
        </span>
      </TabsTrigger>
    )
  }

  /** Grupperet horisont: Forsinket (rød) → Gør nu → Snart → Når du har tid → Dine opgaver. */
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
      <div className="space-y-4">
        {overdue.length > 0 && (
          <div>
            {groupLabel('Forsinket', 'rgba(181,96,47,0.92)')}
            <div className="space-y-2">{overdue.map(t => <TaskRow key={t.id} task={t} showSource />)}</div>
          </div>
        )}
        {nu.length > 0 && <div>{groupLabel('Gør nu', 'rgba(76,96,56,0.92)')}{derivedList(nu)}</div>}
        {snart.length > 0 && <div>{groupLabel('Snart')}{derivedList(snart)}</div>}
        {senere.length > 0 && <div>{groupLabel('Når du har tid')}{derivedList(senere)}</div>}
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
      <div className="space-y-2">
        {derivedDone.map((h, i) => (
          <SecondaryRow key={h.taskKey} h={h} done first={i === 0} month={month} onToggle={() => toggle(h)} sourceChip={derivedSourceChip(h)} />
        ))}
        {afsluttede.map(t => <TaskRow key={t.id} task={t} compact showSource />)}
      </div>
    )
  }

  return (
    <section id="mine-opgaver" className="scroll-mt-20">
      <Card
        className="overflow-hidden"
        style={{
          // Varmt papir frem for flad app-card — matcher kalenderens materialitet.
          borderRadius: 26,
          border: '1px solid rgba(64,58,42,0.10)',
          background: 'linear-gradient(180deg, #FBF7EC 0%, #F5EFE1 100%)',
          boxShadow: '0 10px 24px rgba(64,58,42,0.07), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      >
        {/* 1 · Briefing-header — "dagens havebriefing", ikke standard modulheader. */}
        <div className="px-5 pt-4 pb-3">
          <h3 className="flex items-center gap-1.5 leading-none text-foreground" style={{ fontFamily: serif, fontSize: 26, fontWeight: 600 }}>
            I haven nu
            <span
              className="inline-flex items-center"
              title="Kalenderens handlingscenter: dagens vigtigste fokus øverst, derefter dine egne opgaver og afledte handlinger fra planter og frøbank."
            >
              <Info className="h-3 w-3 text-muted-foreground" />
            </span>
          </h3>
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em', color: 'rgba(76,96,56,0.9)', margin: '7px 0 0' }}>
            {briefing}
          </p>
        </div>

        <div className="space-y-4 px-5 pb-5">
          {/* 2 · Fokus-kort — dagens vigtigste, altid synligt. */}
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

          {/* 3 · Mini-statuskort (overblik/filter) + 4 · grupperede lister. */}
          <Tabs defaultValue="idag">
            <TabsList className="grid w-full grid-cols-2 gap-2 h-auto bg-transparent p-0">
              {statTab('idag', 'I dag', iDagAntal, hasterAntal > 0)}
              {statTab('uge', 'Denne uge', antal(derivedUge, userUge))}
              {statTab('maaned', 'Kan vente', antal(derivedMaaned, userMaaned))}
              {statTab('afsluttet', 'Færdige', afsluttede.length + derivedDone.length)}
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

          {/* 5 · Sekundær CTA — støtter flowet, dominerer ikke. */}
          <div className="pt-1">
            <AddTaskDialog plants={aktivePlanter}>
              <Button
                variant="ghost"
                className="w-full rounded-full"
                style={{
                  height: 48,
                  background: 'rgba(89,112,61,0.10)',
                  color: '#2F4D2B',
                  border: '1px solid rgba(47,77,43,0.16)',
                  boxShadow: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                <Plus style={{ width: 18, height: 18 }} />
                Tilføj opgave
              </Button>
            </AddTaskDialog>
          </div>
        </div>
      </Card>
    </section>
  )
}
