'use client'

/**
 * "I HAVEN NU" — Kalenderens samlede handlingscenter. Ét sted der svarer på
 * "Hvad skal jeg faktisk holde øje med og gøre?".
 *
 * Sammenlægger (Anna 2026-06-30, "én arbejdsseddel"):
 *   • BRAIN'ens top-prioritet som et pinned "Fokus lige nu"-kort OVER fanerne
 *     — altid synligt, ejer den øverste prioritet (vises aldrig igen i listen).
 *   • Fanerne (I dag / Denne uge / Denne måned / Forsinket / Afsluttet) =
 *     opgaveoverblikket: brugerens egne daterede `calendar_tasks` + afledte
 *     "nu"-handlinger fra Planter/Frøbank, hver med diskret kilde-chip.
 *
 * Afløser standalone "Ugens fokus" (DagensFokusSection) + den gamle "Mine
 * opgaver"-Card. Genbruger fokus-handling-ui.tsx (pinned/rækker/tap-to-check)
 * og TodoTabs' dato-bucketing — opfinder ikke ny mekanik.
 *
 * Grænse: ingen ny BRAIN-logik, ingen admin-opgaver som datakilde her.
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { TaskRow } from '@/components/overblik/task-row'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import {
  PrimaryFocus, SecondaryRow, useDerivedCompletions,
} from '@/components/havekalender/fokus-handling-ui'
import { SourceChip } from '@/components/havekalender/source-chip'
import { ListChecks, CalendarCheck, Info, Plus } from 'lucide-react'
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

/** Papir-filter-faner (ikke segment-control): lav højde, dæmpet inaktiv-tekst,
 *  blød creme aktiv-flade med let løft — ikke en grålig knap-blok. */
const tabCls = 'h-[40px] rounded-lg text-[13px] text-[rgba(35,56,43,0.55)] data-[state=active]:bg-[rgba(255,250,238,0.85)] data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-[0_2px_5px_rgba(64,58,42,0.08)]'
/** Tæller: mindre end label + dæmpet. */
const countCls = 'ml-1.5 text-[11px] opacity-[0.55]'

export function IHavenNu({ tasks, dagensFokus, canPersist, aktivePlanter, month }: Props) {
  const { isDone, toggle } = useDerivedCompletions(
    [...dagensFokus.fokus, ...dagensFokus.flere, ...dagensFokus.rytme],
    canPersist,
  )

  // ── Pinned fokus = BRAIN-toppen. Ejer den øverste prioritet og udelades
  //    derfor af alle fanelister (ingen dublet). ───────────────────────
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

  /** Antal i en fane = aktive afledte (ikke-udførte) + brugeropgaver. */
  const antal = (derived: FokusHandling[], user: CalendarTask[]) =>
    derived.filter(h => !isDone(h)).length + user.length

  function DerivedRows({ list }: { list: FokusHandling[] }) {
    const active = list.filter(h => !isDone(h))
    if (active.length === 0) return null
    return (
      <div>
        {active.map((h, i) => (
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

  function renderTab(derived: FokusHandling[], user: CalendarTask[], emptyTitle: string, emptyDescription: string) {
    const hasDerived = derived.some(h => !isDone(h))
    if (!hasDerived && user.length === 0) {
      return (
        <EmptyState
          icon={<CalendarCheck className="h-8 w-8" />}
          title={emptyTitle}
          description={emptyDescription}
        />
      )
    }
    return (
      <div className="space-y-2">
        <DerivedRows list={derived} />
        {user.map(t => <TaskRow key={t.id} task={t} showSource />)}
      </div>
    )
  }

  return (
    <section id="mine-opgaver" className="scroll-mt-20">
      <Card
        className="overflow-hidden"
        style={{
          // Varmt papir frem for flad app-card: blød creme-gradient, hairline,
          // meget diskret løft + inset-toplys — matcher kalenderens materialitet.
          borderRadius: 26,
          border: '1px solid rgba(64,58,42,0.10)',
          background: 'linear-gradient(180deg, #FBF7EC 0%, #F5EFE1 100%)',
          boxShadow: '0 10px 24px rgba(64,58,42,0.07), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      >
        {/* Header som arbejdsseddel-label: mindre ikon, editorial titel, info
            tæt på titlen, "HAVEN LIGE NU" som sekundær stemme. */}
        <div className="flex items-center gap-2.5 px-5 pt-4 pb-2.5">
          <ListChecks className="shrink-0 text-primary" style={{ width: 32, height: 32 }} strokeWidth={1.6} aria-hidden />
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 leading-none text-foreground" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 25, fontWeight: 600 }}>
              Mine opgaver
              <span
                className="inline-flex items-center"
                title="Kalenderens handlingscenter: dagens vigtigste fokus øverst, derefter dine egne opgaver og afledte handlinger fra planter og frøbank."
              >
                <Info className="h-3 w-3 text-muted-foreground" />
              </span>
            </h3>
            <p
              className="uppercase"
              style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.20em', color: 'rgba(35,56,43,0.52)', margin: '8px 0 0' }}
            >
              Haven lige nu
            </p>
          </div>
        </div>

        <div className="space-y-3 px-5 pb-4">
          {/* Pinned fokus — over fanerne, altid synlig. */}
          {pinned ? (
            <PrimaryFocus
              h={pinned}
              done={isDone(pinned)}
              month={month}
              markoer="Fokus"
              onToggle={() => toggle(pinned)}
            />
          ) : dagensFokus.almanak ? (
            <div
              className="rounded-tl-[1.4rem] rounded-br-[1.4rem] rounded-tr-md rounded-bl-md"
              style={{ background: 'var(--secondary)', padding: '16px 18px' }}
            >
              <p className="text-sm font-medium text-foreground">Alt er roligt i haven i dag</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{dagensFokus.almanak}</p>
            </div>
          ) : null}

          {/* Faner = opgaveoverblikket — lette planlægningsfiltre (2×2), ikke en kasse. */}
          <Tabs defaultValue="idag">
            <TabsList
              className="grid w-full grid-cols-2 gap-1.5 h-auto rounded-xl p-1"
              style={{ background: 'rgba(42,51,32,0.035)' }}
            >
              <TabsTrigger value="idag" className={tabCls}>I dag <span className={countCls}>({antal(derivedIDag, userIDag)})</span></TabsTrigger>
              <TabsTrigger value="uge" className={tabCls}>Denne uge <span className={countCls}>({antal(derivedUge, userUge)})</span></TabsTrigger>
              <TabsTrigger value="maaned" className={tabCls}>Denne måned <span className={countCls}>({antal(derivedMaaned, userMaaned)})</span></TabsTrigger>
              {forsinkede.length > 0 && (
                <TabsTrigger value="forsinket" className={`${tabCls} text-destructive`}>
                  Forsinket <span className={countCls}>({forsinkede.length})</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="afsluttet" className={tabCls}>Afsluttet <span className={countCls}>({afsluttede.length + derivedDone.length})</span></TabsTrigger>
            </TabsList>

            <TabsContent value="idag">
              {renderTab(derivedIDag, userIDag, 'Ingen opgaver i dag', 'Fokus-kortet ovenfor har dig dækket — ellers: nyd kaffen.')}
            </TabsContent>
            <TabsContent value="uge">
              {renderTab(derivedUge, userUge, 'Roligt program i denne uge', 'Intet på listen — pust ud.')}
            </TabsContent>
            <TabsContent value="maaned">
              {renderTab(derivedMaaned, userMaaned, 'Tomt indtil videre i denne måned', 'Find inspiration længere nede på siden.')}
            </TabsContent>
            <TabsContent value="forsinket">
              {forsinkede.length === 0 ? (
                <EmptyState icon={<CalendarCheck className="h-8 w-8" />} title="Intet er forsinket" description="Du har styr på det hele." />
              ) : (
                <div className="space-y-2">{forsinkede.map(t => <TaskRow key={t.id} task={t} showSource />)}</div>
              )}
            </TabsContent>
            <TabsContent value="afsluttet">
              {afsluttede.length === 0 && derivedDone.length === 0 ? (
                <EmptyState
                  icon={<ListChecks className="h-8 w-8" />}
                  title="Ingen afsluttede opgaver endnu"
                  description="Når du markerer opgaver som udført, dukker de op her."
                />
              ) : (
                <div className="space-y-2">
                  {derivedDone.length > 0 && (
                    <div>
                      {derivedDone.map((h, i) => (
                        <SecondaryRow
                          key={h.taskKey}
                          h={h}
                          done
                          first={i === 0}
                          month={month}
                          onToggle={() => toggle(h)}
                          sourceChip={derivedSourceChip(h)}
                        />
                      ))}
                    </div>
                  )}
                  {afsluttede.map(t => <TaskRow key={t.id} task={t} compact showSource />)}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Ny opgave — sekundær støttehandling, ikke sektionens hovedperson:
              let papirknap (grøn tint + hairline), ikke massiv mørkegrøn pille.
              Brugeren skal handle på listen først; oprettelse er sekundært. */}
          <div style={{ marginTop: 18 }}>
            <AddTaskDialog plants={aktivePlanter}>
              <Button
                variant="ghost"
                className="w-full rounded-full"
                style={{
                  height: 54,
                  background: 'rgba(89,112,61,0.12)',
                  color: '#2F4D2B',
                  border: '1px solid rgba(47,77,43,0.16)',
                  boxShadow: 'none',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <Plus style={{ width: 20, height: 20 }} />
                Ny opgave
              </Button>
            </AddTaskDialog>
          </div>
        </div>
      </Card>
    </section>
  )
}
