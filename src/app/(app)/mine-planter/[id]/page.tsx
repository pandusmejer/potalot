import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlantCard } from '@/components/mine-planter/plant-card'
import { PlantTimeline } from '@/components/mine-planter/plant-timeline'
import { PlantLogEntry } from '@/components/mine-planter/plant-log-entry'
import { PlantPhotoGrid } from '@/components/mine-planter/plant-photo-grid'
import { NextPlantActions } from '@/components/mine-planter/next-plant-actions'
import { PLANT_STATUS_META } from '@/lib/constants'
import {
  formatPlantDate,
  getMockPlantById,
  mockPlantTasks,
  type MockPlant,
  type MockPlantNextAction,
} from '@/data/mock-plants'
import type { Plant } from '@/lib/types'
import { getPlant } from '@/actions/mine-planter'
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Camera,
  ChevronDown,
  Images,
  NotebookText,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return []
}

/**
 * Plante-detail — real-data først, mock-fallback for demo-browsing.
 *
 * For ægte logged-in brugere fetcher vi planten fra DB via getPlant(id).
 * Hvis ikke fundet (UUID matcher ingen plante for current user), prøver vi
 * mock-data (demo-pathen). Hvis stadig ikke fundet → 404.
 *
 * Ægte planter har kun rene Plant-felter (navn, sort, status, billede,
 * isArchived osv.) — de mangler MockPlant-extras (type, pictures, logs,
 * guide). For V1 vises de sektioner derfor som tomme for ægte planter.
 * Plant_logs_v2-integration (rigtige logs/billeder) er post-launch arbejde.
 */
export default async function PlanteDetailPage({ params }: Props) {
  const { id } = await params

  // 1) Real-data path: prøv DB først
  const realPlant = await getPlant(id)
  if (realPlant) {
    return renderDetail(toMockShape(realPlant), null)
  }

  // 2) Demo-fallback: kig i mock-bibliotek
  const mockPlant = getMockPlantById(id)
  if (mockPlant) {
    const nextTask = mockPlantTasks.find(t => t.linkedPlantId === mockPlant.id) ?? null
    return renderDetail(mockPlant, nextTask)
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

function renderDetail(plant: MockPlant, nextTask: import('@/lib/types').CalendarTask | null) {
  const statusMeta = PLANT_STATUS_META[plant.status]
  // For real plants har vi ingen calendar-task; behold nextTask null.
  const resolvedNextTask =
    nextTask ?? mockPlantTasks.find(task => task.linkedPlantId === plant.id) ?? null

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

      {(plant.logs.length > 0 || plant.notes) && (
        <details className="group rounded-2xl border border-border bg-card shadow-soft">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <NotebookText className="h-4 w-4" />
              </span>
              <span>
                <span className="block font-serif text-2xl leading-tight text-foreground">Noter</span>
                <span className="text-xs text-muted-foreground">{plant.logs.length} logpunkter</span>
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 px-5 pb-5 pt-0">
            {plant.notes && (
              <div className="rounded-2xl border border-border bg-[linear-gradient(135deg,var(--card),var(--surface-2))] p-5">
                <p className="text-sm leading-6 text-muted-foreground">{plant.notes}</p>
              </div>
            )}
            <div className="grid gap-3">
              {plant.logs.map(log => (
                <PlantLogEntry key={log.id} entry={log} />
              ))}
            </div>
          </div>
        </details>
      )}

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

      <section className="rounded-2xl border border-border bg-surface-2 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground">
            <Archive className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl leading-tight text-foreground">Arkivér plante</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Gem sæsonens noter, billeder og høsterfaringer i havebogen, når planten er færdig.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 bg-card/70">
            Arkivér
          </Button>
        </div>
      </section>
    </article>
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
