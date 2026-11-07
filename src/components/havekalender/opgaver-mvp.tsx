'use client'

/**
 * "OpgaverMvp" — MVP 1.0's Opgaver (fase 3): Nu · Kommende · Udført.
 *
 * Ét sted at se, hvad der skal gøres i haven, uden at gennemgå en kalender.
 * Komponenten ejer INGEN opgaveregler — de bor i lib/opgaver-mvp.ts — og
 * ingen nye handlinger: afkrydsning bruger de eksisterende (completeTask /
 * uncompleteTask for opgaver, useDerivedCompletions for plante-råd), og
 * forslagene bruger addGeneralTasksToCalendar / hideGeneralTask.
 *
 * Prioritet: dine egne opgaver og dine plante-råd står øverst med
 * afkrydsning. Månedens generelle gøremål er VALGFRIE FORSLAG længere nede —
 * uden afkrydsning, uden pligt, og kun få ad gangen.
 *
 * Planteopgaver samles under deres konkrete dyrkning (plante-id), når mindst to
 * hører til samme plante: overskriften viser art/sort, "Sået i" + placering og
 * sådato, så to dyrkninger af samme sort kan skelnes. Hver opgave beholder sin
 * egen dato og sin egen afkrydsning.
 *
 * Vises kun når MVP_OPGAVER.enkelVisning er slået til (mvp-config.ts); den
 * oprindelige kalender (KalenderClient) vender tilbage, når MVP slås fra.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ChevronDown, Plus, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import { CompleteTaskDialog } from '@/components/havekalender/complete-task-dialog'
import { TaskActions } from '@/components/havekalender/task-actions'
import { GardenAlerts } from '@/components/havekalender/garden-alerts'
import { CheckCircle, useDerivedCompletions } from '@/components/havekalender/fokus-handling-ui'
import { hideGeneralTask } from '@/actions/aarshjul'
import { addGeneralTasksToCalendar } from '@/actions/year-wheel'
import { completeTask, uncompleteTask } from '@/actions/havekalender'
import { MONTHS_DA } from '@/lib/constants'
import { formatDatoKort, formatDatoMedAar, venligDato } from '@/lib/datetime'
import { dyrkningsSted, type Dyrkning } from '@/lib/dyrkning-info'
import {
  bygListeElementer, bygOpgaveOversigt, efterfoelgendeMaaned, opdelForsinkede, opgaveTypeLabel, raekkeDato,
  type DineRaekke, type Forslag,
} from '@/lib/opgaver-mvp'
import type { DagensFokus, FokusHandling } from '@/lib/kalender/dagens-fokus'
import type { GardenAlert } from '@/actions/weather'
import type {
  CalendarTask, GeneralGardenTask, PlantLogType, UserGardenTask,
} from '@/lib/types'

const sans = 'var(--font-manrope)'
const gabarito = 'var(--font-gabarito), var(--font-manrope), sans-serif'

/** Diskret terracotta til forsinkede datoer (mørkere udgave af nav-badgens #B4694A, så teksten er læsbar). */
const TERRACOTTA = '#A3563A'

/** Dato uden år i år, med år ellers — "1. mar" i dag, "1. mar 2027" næste år. */
function datoTekst(date: string, today: string): string {
  return date.slice(0, 4) === today.slice(0, 4) ? formatDatoKort(date) : formatDatoMedAar(date)
}

/** Så mange forslag vises, før resten ligger bag "Vis flere". */
const SYNLIGE_FORSLAG = 3

interface Props {
  tasks: CalendarTask[]
  dagensFokus: DagensFokus
  generalTasks: GeneralGardenTask[]
  userTasks: UserGardenTask[]
  alerts: GardenAlert[]
  aktivePlanter: { id: string; name: string; variety?: string | null }[]
  /** Dyrkningsinfo pr. plante-id ("Sået i", placering, sådato) — skiller to dyrkninger af samme sort. */
  dyrkninger?: Record<string, Dyrkning>
  /** Dagens dato, måned og år fra serveren — stabilt mellem server og klient. */
  today: string
  month: number
  year: number
  /** Logget ind. Anonyme ser demo uden at kunne gemme. */
  canPersist: boolean
}

/** En række i en opgaveliste: opgave, afledt plante-råd eller udført opgave. */
type Raekke = DineRaekke | { type: 'udfoert'; task: CalendarTask }

function plantIdAf(r: Raekke): string | null {
  if (r.type === 'opgave' || r.type === 'udfoert') return r.task.linkedPlantId ?? null
  return r.handling.plantId ?? null
}

function raekkeNoegle(r: Raekke): string {
  if (r.type === 'opgave') return `t-${r.task.id}`
  if (r.type === 'udfoert') return `u-${r.task.id}`
  return `a-${r.handling.taskKey}`
}

export function OpgaverMvp(props: Props) {
  const { tasks, dagensFokus, generalTasks, userTasks, alerts, aktivePlanter, dyrkninger = {}, today, month, year, canPersist } = props

  const o = bygOpgaveOversigt({ tasks, dagensFokus, generalTasks, userTasks, today, month, year })
  const { isDone, toggle } = useDerivedCompletions(
    [...dagensFokus.fokus, ...dagensFokus.flere, ...dagensFokus.rytme],
    canPersist,
  )

  // Afledte råd afkrydses med det samme og flytter sig til Udført.
  const dine = o.nu.dine.filter((r) => r.type === 'opgave' || !isDone(r.handling))
  // Kræver handling: forsinkede opgaver for sig (øverst), resten under "Nu".
  const { forsinkede, nu: nuRaekker } = opdelForsinkede(dine)
  const vedligehold = o.nu.vedligehold.filter((h) => !isDone(h))
  const udfoertAfledte = o.udfoert.afledte.filter(isDone)
  const udfoertAntal = o.udfoert.opgaver.length + udfoertAfledte.length
  const kommende: Raekke[] = o.kommende.opgaver.map((task) => ({ type: 'opgave', task, forsinket: false }))
  const udfoert: Raekke[] = [
    ...udfoertAfledte.map((handling): Raekke => ({ type: 'afledt', handling })),
    ...o.udfoert.opgaver.map((task): Raekke => ({ type: 'udfoert', task })),
  ]

  // Plante-id → dyrkningen (art/sort, "Sået i", placering, sådato). Falder
  // tilbage til den aktive plantes navn, hvis dyrkningsinfoen mangler.
  const dyrk = (plantId: string | null): Dyrkning | null => {
    if (!plantId) return null
    const d = dyrkninger[plantId]
    if (d) return d
    const p = aktivePlanter.find((x) => x.id === plantId)
    return p ? { id: p.id, name: p.name, variety: p.variety ?? null, container: null, sted: null, saadato: null } : null
  }
  const ctx: Ctx = { today, dyrk, isDone, toggle }
  // Sorteringsdato: det, der skal gøres først, står først — både grupperne og
  // rækkerne i dem. Udført bevarer "seneste afsluttet øverst" (ingen datoOf).
  const dineDato = (r: Raekke): string => (r.type === 'udfoert' ? r.task.date : raekkeDato(r, today))
  const kommendeDato = (r: Raekke): string => (r.type === 'opgave' ? r.task.date : today)

  const maanedNavn = MONTHS_DA[month - 1].full
  const naeste = efterfoelgendeMaaned(month, year)
  const naesteNavn = MONTHS_DA[naeste.month - 1].full

  return (
    <section className="space-y-4" style={{ fontFamily: sans }}>
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h1
            className="text-[26px] leading-tight text-foreground"
            style={{ fontFamily: gabarito, fontWeight: 600 }}
          >
            Opgaver
          </h1>
          <p className="text-[13px] text-muted-foreground">{maanedNavn}</p>
        </div>
        {canPersist && (
          <AddTaskDialog plants={aktivePlanter}>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5 rounded-full">
              <Plus className="h-4 w-4" /> Egen opgave
            </Button>
          </AddTaskDialog>
        )}
      </header>

      <Tabs defaultValue="nu">
        <TabsList className="grid h-11 w-full grid-cols-3">
          <TabsTrigger value="nu" className="gap-1.5">
            Nu {dine.length > 0 && <Taeller>{dine.length}</Taeller>}
          </TabsTrigger>
          <TabsTrigger value="kommende" className="gap-1.5">
            Kommende {o.kommende.opgaver.length > 0 && <Taeller>{o.kommende.opgaver.length}</Taeller>}
          </TabsTrigger>
          <TabsTrigger value="udfoert">Udført</TabsTrigger>
        </TabsList>

        {/* ── NU ─────────────────────────────────────────────────────── */}
        <TabsContent value="nu" className="space-y-10">
          {/* Vejret er kontekst: de eksisterende varsler, kun når der er et. */}
          <GardenAlerts alerts={alerts} />

          {dine.length > 0 ? (
            <div className="space-y-5">
              <Sektion titel="Kræver handling" antal={dine.length} />
              {forsinkede.length > 0 && (
                <div className="space-y-2">
                  <Underoverskrift>Forsinket</Underoverskrift>
                  <Raekkeliste rows={forsinkede} ctx={ctx} datoOf={dineDato} />
                </div>
              )}
              {nuRaekker.length > 0 && (
                <div className="space-y-2">
                  {forsinkede.length > 0 && <Underoverskrift>Nu</Underoverskrift>}
                  <Raekkeliste rows={nuRaekker} ctx={ctx} datoOf={dineDato} />
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[14px] leading-relaxed text-muted-foreground">
              Roligt i haven lige nu. Det, der kommer, ligger under &quot;Kommende&quot;.
            </p>
          )}

          {vedligehold.length > 0 && (
            <details className="group rounded-2xl border border-border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[14px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                <span>
                  Vedligehold <span className="font-normal text-muted-foreground">· {vedligehold.length}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="border-t border-border/70 p-2">
                <Raekkeliste rows={vedligehold.map((handling): Raekke => ({ type: 'afledt', handling }))} ctx={ctx} indlejret />
              </div>
            </details>
          )}

          <ForslagListe
            titel={`Valgfrie forslag til ${maanedNavn.toLowerCase()}`}
            hjaelp="Ingen pligt — tilføj det, du vil have med."
            forslag={o.nu.forslag}
            year={year}
            canPersist={canPersist}
          />
        </TabsContent>

        {/* ── KOMMENDE ───────────────────────────────────────────────── */}
        <TabsContent value="kommende" className="space-y-10">
          {kommende.length > 0 ? (
            <div className="space-y-5">
              <Sektion titel="Planlagt" antal={kommende.length} />
              <Raekkeliste rows={kommende} ctx={ctx} datoOf={kommendeDato} medDato />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[14px] text-muted-foreground">
              Ingen opgaver er planlagt længere frem.
            </p>
          )}

          <ForslagListe
            titel={`Valgfrie forslag til ${naesteNavn.toLowerCase()}`}
            hjaelp="Generelle haveopgaver, når måneden nærmer sig. Ingen pligt."
            forslag={o.kommende.forslag}
            year={naeste.year}
            canPersist={canPersist}
          />
        </TabsContent>

        {/* ── UDFØRT ─────────────────────────────────────────────────── */}
        <TabsContent value="udfoert" className="space-y-5">
          {udfoertAntal > 0 ? (
            <div className="space-y-5">
              <Sektion titel="Udført" antal={udfoertAntal} />
              <Raekkeliste rows={udfoert} ctx={ctx} />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[14px] text-muted-foreground">
              Du har ikke afsluttet nogen opgaver endnu.
            </p>
          )}
          {/* Udført er ikke en fuldstændig historik: plante-råd huskes kun for
              i dag (eksisterende design), og kun de 30 seneste opgaver vises. */}
          <p className="px-1 text-[12.5px] leading-snug text-muted-foreground">
            De seneste udførte opgaver vises her. Plante-råd, du har krydset af
            tidligere end i dag, står i plantens historie.
          </p>
        </TabsContent>
      </Tabs>
    </section>
  )
}

interface Ctx {
  today: string
  dyrk: (plantId: string | null) => Dyrkning | null
  isDone: (h: FokusHandling) => boolean
  toggle: (h: FokusHandling) => void
}

// ─────────────────────────────────────────────────────────────
// Overskrifter
// ─────────────────────────────────────────────────────────────

/** Sektionstitel: tydelig forskel i størrelse og vægt mod gruppelabels. */
function Sektion({ titel, antal }: { titel: string; antal?: number }) {
  return (
    <div className="flex items-baseline gap-2 px-1 pt-1">
      <h2 className="text-[17px] leading-tight text-foreground" style={{ fontFamily: gabarito, fontWeight: 600 }}>
        {titel}
      </h2>
      {antal !== undefined && antal > 0 && (
        <span className="text-[13px] tabular-nums text-muted-foreground">{antal}</span>
      )}
    </div>
  )
}

/** Gruppelabel under en sektion (Forsinket / Nu). */
function Underoverskrift({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h3>
  )
}

function Taeller({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary/12 px-1.5 text-[11px] font-semibold tabular-nums text-primary">
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Rækkeliste: grupper pr. dyrkning (plante-id), enkeltstående rækker som før
// ─────────────────────────────────────────────────────────────

function Raekkeliste({
  rows, ctx, datoOf, medDato = false, indlejret = false,
}: {
  rows: Raekke[]
  ctx: Ctx
  /** Sorteringsdato pr. række; uden den bevares rækkefølgen (Udført, Vedligehold). */
  datoOf?: (r: Raekke) => string
  medDato?: boolean
  /** Inde i et andet kort (Vedligehold): ingen egen ramme. */
  indlejret?: boolean
}) {
  const elementer = bygListeElementer(rows, plantIdAf, datoOf)

  const kortKlasse = indlejret ? '' : 'overflow-hidden rounded-2xl border border-border bg-card'

  return (
    <div className="space-y-3">
      {elementer.map((e, idx) =>
        e.art === 'gruppe' ? (
          <PlanteGruppe key={`g-${e.plantId}`} plantId={e.plantId} items={e.items} ctx={ctx}>
            <ul className="divide-y divide-border/60">
              {e.items.map((r) => (
                <li key={raekkeNoegle(r)}>
                  <RaekkeVisning row={r} ctx={ctx} medDato={medDato} iGruppe />
                </li>
              ))}
            </ul>
          </PlanteGruppe>
        ) : (
          <ul key={`e-${idx}`} className={`${kortKlasse} divide-y divide-border/60`}>
            {e.items.map((r) => (
              <li key={raekkeNoegle(r)}>
                <RaekkeVisning row={r} ctx={ctx} medDato={medDato} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}

function RaekkeVisning({
  row, ctx, medDato, iGruppe = false,
}: {
  row: Raekke
  ctx: Ctx
  medDato: boolean
  iGruppe?: boolean
}) {
  if (row.type === 'opgave') {
    return (
      <OpgaveRaekke
        task={row.task}
        forsinket={row.forsinket}
        today={ctx.today}
        medDato={medDato}
        iGruppe={iGruppe}
        sted={iGruppe ? null : dyrkningsSted(ctx.dyrk(row.task.linkedPlantId ?? null)) ?? row.task.linkedPlantLocation ?? null}
      />
    )
  }
  if (row.type === 'udfoert') {
    return (
      <UdfoertRaekke
        task={row.task}
        iGruppe={iGruppe}
        sted={iGruppe ? null : dyrkningsSted(ctx.dyrk(row.task.linkedPlantId ?? null)) ?? row.task.linkedPlantLocation ?? null}
      />
    )
  }
  return (
    <AfledtRaekke
      handling={row.handling}
      done={ctx.isDone(row.handling)}
      onToggle={() => ctx.toggle(row.handling)}
      iGruppe={iGruppe}
      sted={iGruppe ? null : dyrkningsSted(ctx.dyrk(row.handling.plantId ?? null))}
    />
  )
}

/**
 * Overskriften over en dyrkning: art og sort, så "Sået i" + placering og sådato.
 * Fx "Spinat · Engelsk spinat" / "Drivhus · Vandingskasse · Sået 6. nov.".
 */
function PlanteGruppe({
  plantId, items, ctx, children,
}: {
  plantId: string
  items: Raekke[]
  ctx: Ctx
  children: React.ReactNode
}) {
  const d = ctx.dyrk(plantId)
  const foersteTask = items.map((r) => (r.type === 'opgave' || r.type === 'udfoert' ? r.task : null)).find((t) => t !== null) ?? null
  const navn = d?.name ?? foersteTask?.linkedPlantName ?? 'Plante'
  const sort = d?.variety ?? foersteTask?.linkedPlantVariety ?? null
  const dele = [
    dyrkningsSted(d) ?? foersteTask?.linkedPlantLocation ?? null,
    d?.saadato ? `Sået ${formatDatoKort(d.saadato)}` : null,
  ].filter((x): x is string => !!x)

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <Link
        href={`/mine-planter/${plantId}`}
        className="block border-b border-border/60 px-3 pb-2.5 pt-3 no-underline"
        style={{ background: 'rgba(36,48,31,0.035)' }}
      >
        <span className="flex items-center gap-1.5">
          <Sprout className="h-3.5 w-3.5 shrink-0 text-[#3D5626]" aria-hidden />
          <span className="text-[15px] font-semibold leading-snug text-foreground">{navn}</span>
          {sort && <span className="truncate text-[14px] leading-snug text-foreground/70">{sort}</span>}
        </span>
        {dele.length > 0 && (
          <span className="mt-0.5 block pl-5 text-[12.5px] leading-snug text-muted-foreground">{dele.join(' · ')}</span>
        )}
      </Link>
      {children}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Rækker
// ─────────────────────────────────────────────────────────────

/** En opgave fra calendar_tasks. Afkrydsning = completeTask (+ log-spørgsmål ved plante). */
function OpgaveRaekke({
  task, forsinket, today, medDato = false, iGruppe = false, sted = null,
}: {
  task: CalendarTask
  forsinket: boolean
  today: string
  medDato?: boolean
  /** Står under en dyrknings overskrift: ingen egen plantelinje. */
  iGruppe?: boolean
  /** Dyrkningssted ("Drivhus · Vandingskasse") — kun på enkeltstående rækker. */
  sted?: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [logPrompt, setLogPrompt] = useState<{
    plantId: string; logType: PlantLogType; title: string; logTitle: string
  } | null>(null)

  function afslut() {
    startTransition(async () => {
      const res = await completeTask(task.id)
      if ('error' in res) return
      // Samme flow som kalenderens TaskRow: spørg om det skal i plantens historie.
      if (res.linkedPlantId && res.suggestedLogType) {
        setLogPrompt({
          plantId: res.linkedPlantId, logType: res.suggestedLogType,
          title: res.taskTitle, logTitle: res.suggestedLogTitle,
        })
      } else {
        router.refresh()
      }
    })
  }

  const dato = forsinket
    ? venligDato(task.date)
    : task.date <= today ? 'I dag' : datoTekst(task.date, today)
  const plante = task.linkedPlantId
    ? [task.linkedPlantName, task.linkedPlantVariety].filter(Boolean).join(' ')
    : null
  const typeLabel = opgaveTypeLabel(task)

  return (
    <>
      <div className="flex items-start gap-3 px-3 py-3">
        <span className="pt-0.5">
          <CheckCircle done={false} onToggle={afslut} label={`Markér udført: ${task.title}`} size={22} />
        </span>
        <div className={`min-w-0 flex-1 ${pending ? 'opacity-60' : ''}`}>
          <p className="text-[15px] font-semibold leading-snug text-foreground">{task.title}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
            <span style={{ color: forsinket ? TERRACOTTA : undefined, fontWeight: forsinket ? 600 : undefined }}>
              {medDato && !forsinket ? datoTekst(task.date, today) : dato}
            </span>
            {!iGruppe && (
              <>
                {' · '}
                {task.linkedPlantId ? (
                  <Link href={`/mine-planter/${task.linkedPlantId}`} className="font-medium text-[#3D5626] no-underline hover:underline">
                    <Sprout className="mr-0.5 inline h-3 w-3" aria-hidden />
                    {plante || typeLabel}
                  </Link>
                ) : (
                  typeLabel
                )}
                {task.linkedPlantId && sted ? ` · ${sted}` : ''}
              </>
            )}
          </p>
        </div>
        {/* Rediger/slet kun på brugerens EGNE opgaver. */}
        {task.source === 'manual' && <TaskActions task={task} />}
      </div>

      {logPrompt && (
        <CompleteTaskDialog
          open
          onClose={() => { setLogPrompt(null); router.refresh() }}
          taskId={task.id}
          plantId={logPrompt.plantId}
          taskTitle={logPrompt.title}
          suggestedLogType={logPrompt.logType}
          suggestedLogTitle={logPrompt.logTitle}
        />
      )}
    </>
  )
}

/** Et afledt plante-råd ("Pluk Tomat nu"). Afkrydsning gemmes for i dag. */
function AfledtRaekke({
  handling, done, onToggle, iGruppe = false, sted = null,
}: {
  handling: FokusHandling
  done: boolean
  onToggle: () => void
  iGruppe?: boolean
  /** Dyrkningssted — kun på enkeltstående rækker. */
  sted?: string | null
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-3">
      <span className="pt-0.5">
        <CheckCircle
          done={done}
          onToggle={onToggle}
          label={done ? `Fortryd: ${handling.titel}` : `Markér udført: ${handling.titel}`}
          size={22}
        />
      </span>
      <Link href={handling.href} className="min-w-0 flex-1 no-underline" style={{ opacity: done ? 0.55 : 1 }}>
        <span
          className="block text-[15px] font-semibold leading-snug text-foreground"
          style={{ textDecoration: done ? 'line-through' : 'none' }}
        >
          {handling.titel}
        </span>
        <span className="mt-0.5 line-clamp-1 text-[12.5px] leading-snug text-muted-foreground">
          {done ? 'Udført i dag' : handling.hvorfor}
        </span>
        {!iGruppe && (
          <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
            Fra dine planter{sted ? ` · ${sted}` : ''}
          </span>
        )}
      </Link>
    </div>
  )
}

/** En udført opgave med mulighed for at fortryde. */
function UdfoertRaekke({
  task, iGruppe = false, sted = null,
}: {
  task: CalendarTask
  iGruppe?: boolean
  sted?: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const plante = task.linkedPlantId
    ? [task.linkedPlantName, task.linkedPlantVariety].filter(Boolean).join(' ')
    : null
  const dato = task.completedAt ? formatDatoKort(task.completedAt.slice(0, 10)) : formatDatoKort(task.date)

  return (
    <div className="flex items-start gap-3 px-3 py-3">
      <span className="pt-0.5">
        <CheckCircle
          done
          onToggle={() => startTransition(async () => { await uncompleteTask(task.id); router.refresh() })}
          label={`Fortryd: ${task.title}`}
          size={22}
        />
      </span>
      <div className={`min-w-0 flex-1 ${pending ? 'opacity-50' : ''}`}>
        <p className="text-[15px] leading-snug text-foreground/70 line-through">{task.title}</p>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          Udført {dato}
          {!iGruppe && (
            <>
              {' · '}
              {task.linkedPlantId ? (
                <Link href={`/mine-planter/${task.linkedPlantId}`} className="text-[#3D5626] no-underline hover:underline">
                  {plante || opgaveTypeLabel(task)}
                </Link>
              ) : (
                opgaveTypeLabel(task)
              )}
              {task.linkedPlantId && sted ? ` · ${sted}` : ''}
            </>
          )}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Forslag
// ─────────────────────────────────────────────────────────────

function ForslagListe({
  titel, hjaelp, forslag, year, canPersist,
}: {
  titel: string
  hjaelp: string
  forslag: Forslag[]
  year: number
  canPersist: boolean
}) {
  const [alle, setAlle] = useState(false)
  if (forslag.length === 0) return null
  const synlige = alle ? forslag : forslag.slice(0, SYNLIGE_FORSLAG)
  const rest = forslag.length - synlige.length

  return (
    <div className="space-y-3 border-t border-border/60 pt-8">
      <div className="px-1">
        <h2 className="text-[15px] leading-tight text-foreground/75" style={{ fontFamily: gabarito, fontWeight: 600 }}>
          {titel}
        </h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{hjaelp}</p>
      </div>
      <ul className="divide-y divide-border/50">
        {synlige.map((f) => (
          <li key={forslagNoegle(f)}>
            <ForslagRaekke forslag={f} year={year} canPersist={canPersist} />
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setAlle(true)}
          className="px-1 text-[13px] font-semibold text-[#3D5626] hover:underline"
        >
          Vis {rest} flere
        </button>
      )}
    </div>
  )
}

function forslagNoegle(f: Forslag): string {
  return f.type === 'froebank' ? `f-${f.handling.taskKey}` : `${f.type}-${f.task.id}`
}

function ForslagRaekke({
  forslag, year, canPersist,
}: {
  forslag: Forslag
  year: number
  canPersist: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [fejl, setFejl] = useState<string | null>(null)

  if (forslag.type === 'froebank') {
    const h = forslag.handling
    return (
      <Link href={h.href} className="block px-1 py-3.5 no-underline">
        <span className="block text-[15px] font-semibold leading-snug text-foreground">{h.titel}</span>
        <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{h.hvorfor}</span>
        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
          Fra din frøbank · en mulighed
        </span>
      </Link>
    )
  }

  if (forslag.type === 'eget') {
    return (
      <div className="px-1 py-3.5">
        <p className="text-[15px] font-semibold leading-snug text-foreground">{forslag.task.title}</p>
        <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">Dit eget gøremål</p>
      </div>
    )
  }

  const g = forslag.task
  function tilfoej() {
    setFejl(null)
    startTransition(async () => {
      const res = await addGeneralTasksToCalendar({ generalTaskIds: [g.id], year })
      if ('error' in res) { setFejl(res.error); return }
      router.refresh()
    })
  }
  function skjul() {
    setFejl(null)
    startTransition(async () => {
      const res = await hideGeneralTask(g.id)
      if ('error' in res) { setFejl(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className={`flex items-start gap-3 px-1 py-3.5 ${pending ? 'opacity-60' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug text-foreground">{g.title}</p>
        {g.description && (
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{g.description}</p>
        )}
        {canPersist && (
          <button
            type="button"
            disabled={pending}
            onClick={skjul}
            className="mt-2 text-[12.5px] text-muted-foreground/80 hover:text-foreground hover:underline"
          >
            Ikke relevant
          </button>
        )}
        {fejl && <p className="mt-1 text-[12.5px] text-destructive">{fejl}</p>}
      </div>
      {canPersist && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={tilfoej}
          aria-label={`Tilføj til mine opgaver: ${g.title}`}
          className="h-8 shrink-0 gap-1 rounded-full px-3 text-[13px]"
        >
          <Plus className="h-3.5 w-3.5" /> Tilføj
        </Button>
      )}
    </div>
  )
}
