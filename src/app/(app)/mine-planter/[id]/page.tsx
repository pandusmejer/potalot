import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlantCard } from '@/components/mine-planter/plant-card'
import { PlantTimeline } from '@/components/mine-planter/plant-timeline'
import { PlantPhotoGrid } from '@/components/mine-planter/plant-photo-grid'
import { PlantKarakter } from '@/components/mine-planter/plant-karakter'
import { NextPlantActions } from '@/components/mine-planter/next-plant-actions'
import { PlantNaeste } from '@/components/mine-planter/plant-naeste'
import { PlantTidslinje } from '@/components/mine-planter/plant-tidslinje'
import { PlantGalleri } from '@/components/mine-planter/plant-galleri'
import { PlantSammenligning } from '@/components/mine-planter/plant-sammenligning'
import { LogForm } from '@/components/mine-planter/log-form'
import { Timeline } from '@/components/mine-planter/timeline'
import { karakterFor, type PlantKarakter as Karakter } from '@/data/plant-karakter'
import { detailFor, type PlantDetail } from '@/data/plant-detail'
import { PLANT_STATUS_META } from '@/lib/constants'
import {
  formatPlantDate,
  getMockPlantById,
  mockPlantTasks,
  type MockPlant,
  type MockPlantNextAction,
} from '@/data/mock-plants'
import type { Plant, PlantLog } from '@/lib/types'
import { getPlant, getPlantLogs } from '@/actions/mine-planter'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  ChevronDown,
  Images,
  NotebookText,
  Plus,
} from 'lucide-react'

/** Logging-kontekst: brugerens rigtige logs + om de kan redigeres (logget ind). */
interface LogContext {
  logs: PlantLog[]
  canLog: boolean
}

interface Props {
  params: Promise<{ id: string }>
}

// Dynamisk: siden henter brugerens plante via getPlant() (cookies/Supabase).
// Uden dette kaster produktions-renderen DYNAMIC_SERVER_USAGE → 500.
export const dynamic = 'force-dynamic'

/**
 * Plante-detail — real-data først, mock-fallback for demo-browsing.
 *
 * For ægte logged-in brugere fetcher vi planten fra DB via getPlant(id).
 * Hvis ikke fundet (UUID matcher ingen plante for current user), prøver vi
 * mock-data (demo-pathen). Hvis stadig ikke fundet → 404.
 *
 * To render-spor:
 *   • EDITORIAL (ny, fase 1) — når sorten har redaktionelt detalje-
 *     indhold (src/data/plant-detail.ts). Den perfekte planteside som
 *     statisk artefakt: Hero → Mål → Lige nu → Karakter → Tidslinje →
 *     Billeder → Sammenligning. San Marzano er bygget 1:1 efter mockup.
 *   • KLASSISK (fallback) — alle andre planter beholder det eksisterende
 *     layout, indtil deres detalje-indhold er skrevet sort for sort.
 */
export default async function PlanteDetailPage({ params }: Props) {
  const { id } = await params

  // 1) Real-data path: prøv DB først
  const realPlant = await getPlant(id)
  if (realPlant) {
    // Logget ind med egen plante → hent rigtige logs + tillad logging.
    const logs = await getPlantLogs(realPlant.id)
    return renderDetail(toMockShape(realPlant), null, { logs, canLog: true })
  }

  // 2) Demo-fallback: kig i mock-bibliotek (anonym → ingen skrivning).
  const mockPlant = getMockPlantById(id)
  if (mockPlant) {
    const nextTask = mockPlantTasks.find(t => t.linkedPlantId === mockPlant.id) ?? null
    return renderDetail(mockPlant, nextTask, { logs: [], canLog: false })
  }

  notFound()
}

/**
 * Wrap en ægte Plant i MockPlant-form med tomme/default extras, så
 * detail-siden kan rendre uden større refaktorering. Sektioner der
 * afhænger af extras (Billeder, Noter, Dyrkningsguide) vil vise tomme
 * tilstande — det er korrekt: brugeren har endnu ikke logget noget.
 */
function toMockShape(plant: Plant): MockPlant {
  return {
    ...plant,
    seedId: plant.sourceElementId ?? '',
    type: 'Plante',
    sownDate: plant.sowDate ?? null,
    sproutedDate: null,
    repottedDate: null,
    plantedOutDate: plant.plantingOutDate ?? null,
    expectedHarvestStart: null,
    expectedHarvestEnd: null,
    notes: '',
    pictures: [],
    latestActivity: {
      id: `activity-${plant.id}`,
      plantId: plant.id,
      plantName: plant.name,
      action: PLANT_STATUS_META[plant.status]?.label ?? 'Aktiv',
      when: plant.updatedAt,
    },
    nextAction: {
      id: `next-${plant.id}`,
      plantId: plant.id,
      plantName: plant.name,
      action: 'Tjek planten',
      timing: 'Når du har tid',
      image: plant.primaryImageId ?? null,
    },
    logs: [],
    guide: {
      title: '',
      body: '',
    },
  }
}

function renderDetail(
  plant: MockPlant,
  nextTask: import('@/lib/types').CalendarTask | null,
  log: LogContext,
) {
  const karakter = karakterFor(plant.guideId)
  const detail = detailFor(plant.guideId)
  // For real plants har vi ingen calendar-task; behold nextTask null.
  const resolvedNextTask =
    nextTask ?? mockPlantTasks.find(task => task.linkedPlantId === plant.id) ?? null

  // Det nye editorial-spor: kun for sorter med redaktionelt indhold.
  if (detail) {
    return renderEditorial(plant, detail, karakter, resolvedNextTask, log)
  }

  const statusMeta = PLANT_STATUS_META[plant.status]

  const expectedHarvest = plant.expectedHarvestStart
    ? formatPlantDate(plant.expectedHarvestStart)
    : '—'
  const nextActions: MockPlantNextAction[] = plant.nextAction ? [plant.nextAction] : []

  return (
    <article className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/mine-planter">
            <ArrowLeft className="h-4 w-4" />
            Tilbage
          </Link>
        </Button>
        <PlantCard plant={plant} nextTask={resolvedNextTask} />
        {plant.imageSource !== 'user_upload' && (
          <Button variant="outline" size="sm" className="bg-card/70" disabled>
            <Camera className="h-4 w-4" />
            Tilføj dit første foto
          </Button>
        )}
      </div>

      {/* KARAKTER — sortens sjæl, det første du møder (fase 1: oplevelse). */}
      {karakter && <PlantKarakter karakter={karakter} />}

      <section className="grid gap-3 sm:grid-cols-3">
        <Fact label="Status" value={statusMeta.label} />
        <Fact label="Type" value={plant.type || '—'} />
        <Fact label="Forventet høst" value={expectedHarvest} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-serif text-2xl leading-tight text-foreground">Tidslinje</h2>
        <div className="mt-4">
          <PlantTimeline plant={plant} />
        </div>
      </section>

      {nextActions.length > 0 && <NextPlantActions actions={nextActions} />}

      {plant.pictures.length > 0 && (
        <details className="group rounded-2xl border border-border bg-card shadow-soft">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Images className="h-4 w-4" />
              </span>
              <span>
                <span className="block font-serif text-2xl leading-tight text-foreground">Billeder</span>
                <span className="text-xs text-muted-foreground">{plant.pictures.length} billeder</span>
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5 pt-0">
            <PlantPhotoGrid images={plant.pictures} />
          </div>
        </details>
      )}

      <DagbogSektion plant={plant} log={log} />

      {plant.guide.title && (
        <details className="group rounded-2xl border border-border bg-card shadow-soft">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </span>
              <span>
                <span className="block font-serif text-2xl leading-tight text-foreground">Dyrkningsguide</span>
                <span className="text-xs text-muted-foreground">{plant.guide.title}</span>
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5 pt-0">
            <p className="text-sm font-semibold text-foreground">{plant.guide.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{plant.guide.body}</p>
          </div>
        </details>
      )}

      <AdministrerPlante />
    </article>
  )
}

/**
 * EDITORIAL-spor — den perfekte planteside som statisk artefakt.
 * Rækkefølge (Annas valg): Plantekort-hero → Karakter → Lige nu →
 * Tidslinje → Billeder → Sammenligning. Dagbog + arkivér diskret nederst.
 *
 * Heroen er det klassiske Plantekort (foto-kort med titel ovenpå + tæller).
 * Dets bundpanel viser Mål-strimlen (Status·Alder·Højde·Sundhed) — den
 * ligger altså OVENPÅ hero-fotoet, i stedet for vækstbjælke + fakta
 * (Annas valg). Drives af `maal`-prop'en på <PlantCard>.
 */
function renderEditorial(
  plant: MockPlant,
  detail: PlantDetail,
  karakter: Karakter | null,
  nextTask: import('@/lib/types').CalendarTask | null,
  log: LogContext,
) {
  return (
    <article className="space-y-5 pb-4">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/mine-planter">
            <ArrowLeft className="h-4 w-4" />
            Tilbage
          </Link>
        </Button>
        {/* Mål-strimlen er Plantekortets bundpanel (Status·Alder·Højde·
            Sundhed) — ligger ovenpå hero-fotoet (Annas valg 14. juni). */}
        <PlantCard plant={plant} nextTask={nextTask} maal={detail.maal} />
      </div>

      {/* KARAKTER = sektion 2, lige efter hero (Annas valg). */}
      {karakter && <PlantKarakter karakter={karakter} />}
      <PlantNaeste naeste={detail.naeste} />
      <PlantTidslinje milestones={detail.tidslinje} />
        <PlantGalleri billeder={detail.billeder} />
        {detail.sammenligning && <PlantSammenligning data={detail.sammenligning} />}

        <DagbogSektion plant={plant} log={log} />

        <AdministrerPlante />
    </article>
  )
}

/**
 * PLANTENS HISTORIE — dagbogen som kapitler, ikke en flad liste.
 *
 * Anna (14. juni 2026): logpunkterne havde alle samme vægt → "for
 * demokratisk". En avis giver ikke alle historier samme skriftstørrelse.
 * Nu: ÉT aktuelt kapitel med pondus (dominerende dato + stor serif +
 * KONSEKVENS — hvad det betød), derefter historik i aftagende vægt.
 *
 * Ægte (logget-ind) bruger beholder Timeline (redigér/slet via LogForm).
 * Demo viser de redaktionelle kapitler fra mock-loggen.
 */
const sansFont = 'var(--font-manrope)'
const serifFont = 'var(--font-cormorant), Georgia, serif'

function dagbogDag(date: string): string {
  return String(new Date(date).getDate()).padStart(2, '0')
}
function dagbogMaaned(date: string): string {
  return new Intl.DateTimeFormat('da-DK', { month: 'short' })
    .format(new Date(date))
    .replace('.', '')
    .toUpperCase()
}
/** Del en note i åbnings-sætning + resten (til det sekundære lag). */
function delNote(note: string): [string, string] {
  const i = note.indexOf('. ')
  if (i === -1) return [note, '']
  return [note.slice(0, i + 1), note.slice(i + 2)]
}

function DagbogSektion({ plant, log }: { plant: MockPlant; log: LogContext }) {
  const { logs, canLog } = log
  const kapitler = [...plant.logs].sort((a, b) => b.date.localeCompare(a.date))
  const aktuel = kapitler[0]
  const historik = kapitler.slice(1)
  const aar = plant.sowDate ? new Date(plant.sowDate).getFullYear() : ''

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      {/* Header — "Plantens historie", ikke "Dagbog". */}
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <NotebookText className="h-4 w-4" />
          </span>
          <span>
            <span className="block uppercase" style={{ fontFamily: sansFont, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.5)' }}>
              Plantens historie
            </span>
            <span className="block font-serif text-[26px] leading-none text-foreground" style={{ marginTop: 3 }}>
              Denne sæson
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Din logbog for {plant.variety ?? plant.name}{aar ? ` i ${aar}` : ''}.
            </span>
          </span>
        </span>
        {canLog ? (
          <LogForm
            plantId={plant.id}
            trigger={
              <Button variant="outline" size="sm" className="shrink-0 bg-card/70">
                <Plus className="h-4 w-4" />
                Tilføj
              </Button>
            }
          />
        ) : (
          <Button variant="outline" size="sm" className="shrink-0 bg-card/70" disabled>
            <Plus className="h-4 w-4" />
            Tilføj
          </Button>
        )}
      </div>

      {/* Ægte bruger → funktionel Timeline. Demo → redaktionelle kapitler. */}
      {canLog ? (
        <div className="mt-4">
          {logs.length > 0 ? (
            <Timeline plant={plant} logs={logs} showMilestones={false} />
          ) : (
            <p className="py-2 text-sm italic text-muted-foreground">
              Ingen historie endnu. Tilføj dit første kapitel.
            </p>
          )}
        </div>
      ) : !aktuel ? (
        <p className="mt-4 py-2 text-sm italic text-muted-foreground">Ingen historie endnu.</p>
      ) : (
        <>
          {/* AKTUELT KAPITEL — pondus: dominerende dato + stor serif + konsekvens. */}
          <div
            className="mt-5 overflow-hidden rounded-[18px]"
            style={{ background: 'linear-gradient(158deg, #EAEFE0 0%, #E3E9D4 100%)', padding: '18px 18px 16px' }}
          >
            <div className="flex gap-4">
              <DagbogDato date={aktuel.date} stor />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 uppercase" style={{ fontFamily: sansFont, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: '#5A7038', margin: 0 }}>
                  <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: '#5A7038' }} />
                  {aktuel.action}
                </p>
                {aktuel.note && (
                  <p style={{ fontFamily: serifFont, fontWeight: 500, fontSize: 'clamp(21px, 5.6vw, 25px)', lineHeight: 1.22, letterSpacing: '0.004em', color: '#24301F', margin: '8px 0 0' }}>
                    {aktuel.note}
                  </p>
                )}
                {aktuel.konsekvens && (
                  <div className="mt-4 flex items-start gap-2.5 border-t pt-3.5" style={{ borderColor: 'rgba(36,48,31,0.12)' }}>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(90,112,56,0.16)', color: '#5A7038' }}>
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                    </span>
                    <p style={{ fontFamily: sansFont, fontSize: 13.5, fontWeight: 500, lineHeight: 1.4, color: 'rgba(45,58,36,0.82)', margin: 0 }}>
                      {aktuel.konsekvens}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HISTORIK — aftagende vægt, på en rolig rail. */}
          {historik.length > 0 && (
            <ol className="relative mt-5" style={{ paddingLeft: 0 }}>
              {historik.map((entry, i) => {
                const [primaer, sekundaer] = entry.note ? delNote(entry.note) : ['', '']
                return (
                  <li
                    key={entry.id}
                    className="flex gap-4"
                    style={{
                      paddingTop: i === 0 ? 0 : 16,
                      marginTop: i === 0 ? 0 : 0,
                      borderTop: i === 0 ? 'none' : '1px solid rgba(36,48,31,0.08)',
                    }}
                  >
                    <DagbogDato date={entry.date} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 uppercase" style={{ fontFamily: sansFont, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(36,48,31,0.5)', margin: 0 }}>
                        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'rgba(36,48,31,0.32)' }} />
                        {entry.action}
                      </p>
                      {primaer && (
                        <p style={{ fontFamily: serifFont, fontWeight: 500, fontSize: 17, lineHeight: 1.3, letterSpacing: '0.004em', color: '#2D2A24', margin: '5px 0 0' }}>
                          {primaer}
                        </p>
                      )}
                      {sekundaer && (
                        <p style={{ fontFamily: sansFont, fontSize: 13, fontWeight: 400, lineHeight: 1.4, color: 'rgba(36,48,31,0.55)', margin: '3px 0 0' }}>
                          {sekundaer}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      )}
    </section>
  )
}

/** Dominerende dato-kolonne: dag stort, måned lille — gør det til en tidslinje. */
function DagbogDato({ date, stor = false }: { date: string; stor?: boolean }) {
  return (
    <div className="shrink-0 text-center" style={{ width: stor ? 52 : 44 }}>
      <p
        style={{
          fontFamily: serifFont,
          fontWeight: 600,
          fontSize: stor ? 38 : 26,
          lineHeight: 0.92,
          color: stor ? '#24301F' : 'rgba(36,48,31,0.62)',
          margin: 0,
        }}
      >
        {dagbogDag(date)}
      </p>
      <p
        className="uppercase"
        style={{
          fontFamily: sansFont,
          fontSize: stor ? 11 : 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: stor ? '#5A7038' : 'rgba(36,48,31,0.45)',
          margin: '2px 0 0',
        }}
      >
        {dagbogMaaned(date)}
      </p>
    </div>
  )
}

/**
 * ADMINISTRER PLANTE — stille bund-utility (Annas dom: "Arkivér" er en
 * systemhandling, ikke en del af plantens historie). Diskret, under en
 * tynd streg — ikke et selvstændigt rum.
 */
function AdministrerPlante() {
  return (
    <div className="mt-3 border-t pt-5" style={{ borderColor: 'rgba(36,48,31,0.10)' }}>
      <p
        className="uppercase"
        style={{
          fontFamily: 'var(--font-manrope)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'rgba(36,48,31,0.42)',
          margin: 0,
        }}
      >
        Administrer plante
      </p>
      <Button variant="ghost" size="sm" className="-ml-2 mt-1.5 text-muted-foreground">
        <Archive className="h-4 w-4" />
        Arkivér plante
      </Button>
    </div>
  )
}


function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
