import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlantCard } from '@/components/mine-planter/plant-card'
import { PlantTimeline } from '@/components/mine-planter/plant-timeline'
import { PlantLogEntry } from '@/components/mine-planter/plant-log-entry'
import { PlantPhotoGrid } from '@/components/mine-planter/plant-photo-grid'
import { NextPlantActions } from '@/components/mine-planter/next-plant-actions'
import { PLANT_STATUS_META } from '@/lib/constants'
import { formatPlantDate, getMockPlantById, mockPlantTasks } from '@/data/mock-plants'
import {
  Archive,
  ArrowLeft,
  BookOpen,
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

export default async function PlanteDetailPage({ params }: Props) {
  const { id } = await params
  const plant = getMockPlantById(id)

  if (!plant) notFound()

  const statusMeta = PLANT_STATUS_META[plant.status]
  const nextTask = mockPlantTasks.find(task => task.linkedPlantId === plant.id) ?? null

  return (
    <article className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/mine-planter">
            <ArrowLeft className="h-4 w-4" />
            Tilbage
          </Link>
        </Button>
        <PlantCard plant={plant} nextTask={nextTask} />
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Fact label="Status" value={statusMeta.label} />
        <Fact label="Type" value={plant.type} />
        <Fact label="Forventet høst" value={formatPlantDate(plant.expectedHarvestStart)} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-serif text-2xl leading-tight text-foreground">Tidslinje</h2>
        <div className="mt-4">
          <PlantTimeline plant={plant} />
        </div>
      </section>

      <NextPlantActions actions={[plant.nextAction]} />

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
          <div className="rounded-2xl border border-border bg-[linear-gradient(135deg,var(--card),var(--surface-2))] p-5">
            <p className="text-sm leading-6 text-muted-foreground">{plant.notes}</p>
          </div>
          <div className="grid gap-3">
            {plant.logs.map(log => (
              <PlantLogEntry key={log.id} entry={log} />
            ))}
          </div>
        </div>
      </details>

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
