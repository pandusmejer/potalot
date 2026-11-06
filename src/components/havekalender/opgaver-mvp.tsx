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
 * afkrydsning. Månedens generelle gøremål er FORSLAG længere nede — uden
 * afkrydsning, uden pligt, og kun få ad gangen.
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
import { formatDatoKort, venligDato } from '@/lib/datetime'
import {
  bygOpgaveOversigt, efterfoelgendeMaaned, opgaveTypeLabel,
  type DineRaekke, type Forslag,
} from '@/lib/opgaver-mvp'
import type { DagensFokus, FokusHandling } from '@/lib/kalender/dagens-fokus'
import type { GardenAlert } from '@/actions/weather'
import type {
  CalendarTask, GeneralGardenTask, PlantLogType, UserGardenTask,
} from '@/lib/types'

const sans = 'var(--font-manrope)'
const gabarito = 'var(--font-gabarito), var(--font-manrope), sans-serif'

/** Så mange forslag vises, før resten ligger bag "Vis flere". */
const SYNLIGE_FORSLAG = 3

interface Props {
  tasks: CalendarTask[]
  dagensFokus: DagensFokus
  generalTasks: GeneralGardenTask[]
  userTasks: UserGardenTask[]
  alerts: GardenAlert[]
  aktivePlanter: { id: string; name: string; variety?: string | null }[]
  /** Dagens dato, måned og år fra serveren — stabilt mellem server og klient. */
  today: string
  month: number
  year: number
  /** Logget ind. Anonyme ser demo uden at kunne gemme. */
  canPersist: boolean
}

export function OpgaverMvp(props: Props) {
  const { tasks, dagensFokus, generalTasks, userTasks, alerts, aktivePlanter, today, month, year, canPersist } = props

  const o = bygOpgaveOversigt({ tasks, dagensFokus, generalTasks, userTasks, today, month, year })
  const { isDone, toggle } = useDerivedCompletions(
    [...dagensFokus.fokus, ...dagensFokus.flere, ...dagensFokus.rytme],
    canPersist,
  )

  // Afledte råd afkrydses med det samme og flytter sig til Udført.
  const dine = o.nu.dine.filter((r) => r.type === 'opgave' || !isDone(r.handling))
  const vedligehold = o.nu.vedligehold.filter((h) => !isDone(h))
  const udfoertAfledte = o.udfoert.afledte.filter(isDone)
  const udfoertAntal = o.udfoert.opgaver.length + udfoertAfledte.length

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
        <TabsContent value="nu" className="space-y-5">
          {/* Vejret er kontekst: de eksisterende varsler, kun når der er et. */}
          <GardenAlerts alerts={alerts} />

          {dine.length > 0 ? (
            <div className="space-y-2">
              <Overskrift>Dine opgaver</Overskrift>
              <ul className="overflow-hidden rounded-2xl border border-border bg-card">
                {dine.map((r, i) => (
                  <li key={raekkeNoegle(r)} className={i > 0 ? 'border-t border-border/70' : undefined}>
                    {r.type === 'opgave'
                      ? <OpgaveRaekke task={r.task} forsinket={r.forsinket} today={today} />
                      : <AfledtRaekke handling={r.handling} done={isDone(r.handling)} onToggle={() => toggle(r.handling)} />}
                  </li>
                ))}
              </ul>
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
              <ul className="border-t border-border/70">
                {vedligehold.map((h, i) => (
                  <li key={h.taskKey} className={i > 0 ? 'border-t border-border/70' : undefined}>
                    <AfledtRaekke handling={h} done={false} onToggle={() => toggle(h)} />
                  </li>
                ))}
              </ul>
            </details>
          )}

          <ForslagListe
            titel={`Forslag til ${maanedNavn.toLowerCase()}`}
            hjaelp="Ingen pligt — tilføj det, du vil have med."
            forslag={o.nu.forslag}
            maaned={maanedNavn}
            year={year}
            canPersist={canPersist}
          />
        </TabsContent>

        {/* ── KOMMENDE ───────────────────────────────────────────────── */}
        <TabsContent value="kommende" className="space-y-5">
          {o.kommende.opgaver.length > 0 ? (
            <div className="space-y-2">
              <Overskrift>Planlagt</Overskrift>
              <ul className="overflow-hidden rounded-2xl border border-border bg-card">
                {o.kommende.opgaver.map((t, i) => (
                  <li key={t.id} className={i > 0 ? 'border-t border-border/70' : undefined}>
                    <OpgaveRaekke task={t} forsinket={false} today={today} medDato />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[14px] text-muted-foreground">
              Ingen opgaver er planlagt længere frem.
            </p>
          )}

          <ForslagListe
            titel={`Kommende i ${naesteNavn.toLowerCase()}`}
            hjaelp="Generelle haveopgaver, når måneden nærmer sig."
            forslag={o.kommende.forslag}
            maaned={naesteNavn}
            year={naeste.year}
            canPersist={canPersist}
          />
        </TabsContent>

        {/* ── UDFØRT ─────────────────────────────────────────────────── */}
        <TabsContent value="udfoert" className="space-y-3">
          {udfoertAntal > 0 ? (
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {udfoertAfledte.map((h, i) => (
                <li key={h.taskKey} className={i > 0 ? 'border-t border-border/70' : undefined}>
                  <AfledtRaekke handling={h} done onToggle={() => toggle(h)} />
                </li>
              ))}
              {o.udfoert.opgaver.map((t, i) => (
                <li key={t.id} className={i > 0 || udfoertAfledte.length > 0 ? 'border-t border-border/70' : undefined}>
                  <UdfoertRaekke task={t} />
                </li>
              ))}
            </ul>
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

function raekkeNoegle(r: DineRaekke): string {
  return r.type === 'opgave' ? `t-${r.task.id}` : `a-${r.handling.taskKey}`
}

function Overskrift({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h2>
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
// Rækker
// ─────────────────────────────────────────────────────────────

/** En opgave fra calendar_tasks. Afkrydsning = completeTask (+ log-spørgsmål ved plante). */
function OpgaveRaekke({
  task, forsinket, today, medDato = false,
}: {
  task: CalendarTask
  forsinket: boolean
  today: string
  medDato?: boolean
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
    : task.date <= today ? 'I dag' : formatDatoKort(task.date)
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
            <span style={{ color: forsinket ? '#8A5A1C' : undefined, fontWeight: forsinket ? 600 : undefined }}>
              {medDato && !forsinket ? formatDatoKort(task.date) : dato}
            </span>
            {' · '}
            {task.linkedPlantId ? (
              <Link href={`/mine-planter/${task.linkedPlantId}`} className="font-medium text-[#3D5626] no-underline hover:underline">
                <Sprout className="mr-0.5 inline h-3 w-3" aria-hidden />
                {plante || typeLabel}
              </Link>
            ) : (
              typeLabel
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
  handling, done, onToggle,
}: {
  handling: FokusHandling
  done: boolean
  onToggle: () => void
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
        <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
          Fra dine planter
        </span>
      </Link>
    </div>
  )
}

/** En udført opgave med mulighed for at fortryde. */
function UdfoertRaekke({ task }: { task: CalendarTask }) {
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
          Udført {dato} ·{' '}
          {task.linkedPlantId ? (
            <Link href={`/mine-planter/${task.linkedPlantId}`} className="text-[#3D5626] no-underline hover:underline">
              {plante || opgaveTypeLabel(task)}
            </Link>
          ) : (
            opgaveTypeLabel(task)
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
  titel, hjaelp, forslag, maaned, year, canPersist,
}: {
  titel: string
  hjaelp: string
  forslag: Forslag[]
  maaned: string
  year: number
  canPersist: boolean
}) {
  const [alle, setAlle] = useState(false)
  if (forslag.length === 0) return null
  const synlige = alle ? forslag : forslag.slice(0, SYNLIGE_FORSLAG)
  const rest = forslag.length - synlige.length

  return (
    <div className="space-y-2">
      <div className="px-1">
        <Overskrift>{titel}</Overskrift>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">{hjaelp}</p>
      </div>
      <ul className="overflow-hidden rounded-2xl border border-dashed border-border bg-card/60">
        {synlige.map((f, i) => (
          <li key={forslagNoegle(f)} className={i > 0 ? 'border-t border-dashed border-border/80' : undefined}>
            <ForslagRaekke forslag={f} maaned={maaned} year={year} canPersist={canPersist} />
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
  forslag, maaned, year, canPersist,
}: {
  forslag: Forslag
  maaned: string
  year: number
  canPersist: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [fejl, setFejl] = useState<string | null>(null)

  if (forslag.type === 'froebank') {
    const h = forslag.handling
    return (
      <Link href={h.href} className="block px-3 py-3 no-underline">
        <span className="block text-[15px] font-semibold leading-snug text-foreground">{h.titel}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{h.hvorfor}</span>
        <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
          Fra din frøbank · en mulighed
        </span>
      </Link>
    )
  }

  if (forslag.type === 'eget') {
    return (
      <div className="px-3 py-3">
        <p className="text-[15px] font-semibold leading-snug text-foreground">{forslag.task.title}</p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
          Dit eget gøremål · {maaned}
        </p>
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
    <div className={`px-3 py-3 ${pending ? 'opacity-60' : ''}`}>
      <p className="text-[15px] font-semibold leading-snug text-foreground">{g.title}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
        Generel haveopgave · {maaned}
      </p>
      {g.description && (
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">{g.description}</p>
      )}
      {canPersist && (
        <div className="mt-2 flex items-center gap-3">
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={tilfoej} className="h-8 gap-1 rounded-full px-3 text-[13px]">
            <Plus className="h-3.5 w-3.5" /> Tilføj til mine opgaver
          </Button>
          <button type="button" disabled={pending} onClick={skjul} className="text-[13px] text-muted-foreground hover:text-foreground hover:underline">
            Ikke relevant
          </button>
        </div>
      )}
      {fejl && <p className="mt-1 text-[12.5px] text-destructive">{fejl}</p>}
    </div>
  )
}
