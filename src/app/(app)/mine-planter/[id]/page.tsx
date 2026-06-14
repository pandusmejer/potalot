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
 * DAGBOG — logging på plantesiden (genskabt "som tidligere").
 *
 * Ægte (logget-ind) bruger: "Tilføj"-knap (LogForm-dialog med foto) +
 * Timeline med brugerens logs (redigér/slet). showMilestones=false fordi
 * den nye Tidslinje-sektion allerede viser milepælene.
 *
 * Demo (anonym): kan ikke skrive (createPlantLog kræver requireUser), så
 * knappen er deaktiveret med en venlig opfordring; demo-noter vises read-
 * only, så showcasen stadig har indhold.
 */
function DagbogSektion({ plant, log }: { plant: MockPlant; log: LogContext }) {
  const { logs, canLog } = log
  const antal = canLog ? logs.length : plant.logs.length

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <NotebookText className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-serif text-2xl leading-tight text-foreground">Dagbog</span>
            <span className="text-xs text-muted-foreground">
              {antal === 0
                ? 'Ingen log endnu'
                : `${antal} ${antal === 1 ? 'logpunkt' : 'logpunkter'}`}
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

      {!canLog && (
        <p className="mt-2 text-xs text-muted-foreground">
          Opret en bruger for at logge dine egne observationer og fotos.
        </p>
      )}

      <div className="mt-4">
        {canLog ? (
          logs.length > 0 ? (
            <Timeline plant={plant} logs={logs} showMilestones={false} />
          ) : (
            <p className="py-2 text-sm italic text-muted-foreground">
              Ingen log endnu. Tilføj din første observation.
            </p>
          )
        ) : plant.logs.length > 0 ? (
          // Redaktionel dagbog: noten er hovedpersonen, datoen er diskret.
          <ol className="space-y-5">
            {[...plant.logs]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(entry => (
                <li key={entry.id}>
                  <p
                    className="uppercase"
                    style={{
                      fontFamily: 'var(--font-manrope)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      color: 'rgba(36,48,31,0.5)',
                      margin: 0,
                    }}
                  >
                    {formatDagbogDato(entry.date)} · {entry.action}
                  </p>
                  {entry.note && (
                    <p
                      className="mt-1.5 max-w-[46ch]"
                      style={{
                        fontFamily: 'var(--font-cormorant), Georgia, serif',
                        fontSize: 'clamp(17px, 4.6vw, 19px)',
                        fontWeight: 500,
                        lineHeight: 1.34,
                        letterSpacing: '0.004em',
                        color: '#2D2A24',
                        margin: '6px 0 0',
                      }}
                    >
                      {entry.note}
                    </p>
                  )}
                </li>
              ))}
          </ol>
        ) : (
          <p className="py-2 text-sm italic text-muted-foreground">Ingen log endnu.</p>
        )}
      </div>
    </section>
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

/** Dagbogs-dato: kort dansk form, fx "20. april". */
function formatDagbogDato(date: string): string {
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long' }).format(new Date(date))
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
