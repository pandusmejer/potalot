'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlantCard } from '@/components/mine-planter/plant-card'
import { PlantHero } from '@/components/mine-planter/plant-hero'
import { GreenhouseNow } from '@/components/mine-planter/greenhouse-now'
import { PlantStatusFilter } from '@/components/mine-planter/plant-status-filter'
import { NextPlantActions } from '@/components/mine-planter/next-plant-actions'
import { RecentPlantActivity } from '@/components/mine-planter/recent-plant-activity'
import { PlantEmptyState } from '@/components/mine-planter/plant-empty-state'
import {
  filterMockPlantsByStatus,
  mockPlantActions,
  mockPlantActivities,
  mockPlantTasks,
  mockPlants,
  plantStatusFilters,
  type PlantFilterStatus,
} from '@/data/mock-plants'
import type { Plant, CalendarTask } from '@/lib/types'
import { ArrowRight, BookOpen } from 'lucide-react'

interface Props {
  /**
   * Brugerens ægte planter. Hvis tomt array → demo-mode (mock-data
   * driver hele siden). Hvis non-empty → real-data path: ægte planter
   * vises, og de mock-baserede "Næste handlinger" + "Senest i haven"
   * skjules (de hører til demo-oplevelsen og har endnu ingen ægte
   * data-kilde for almindelige brugere).
   */
  plants: Plant[]
}

export function MinePlanterClient({ plants: realPlants }: Props) {
  const [activeFilter, setActiveFilter] = useState<PlantFilterStatus>('alle')

  const isDemo = realPlants.length === 0
  // Bemærk: mockPlants extends Plant, så typen er Plant-kompatibel
  // begge veje. Vi kalder den bare "plants" i komponentkroppen.
  const plants: Plant[] = isDemo ? mockPlants : realPlants

  const activePlants = useMemo(
    () =>
      isDemo
        ? filterMockPlantsByStatus(mockPlants, activeFilter)
        : filterRealPlantsByStatus(realPlants, activeFilter),
    [isDemo, realPlants, activeFilter],
  )

  const varietyCount = useMemo(() => {
    const varieties = new Set(
      plants
        .filter(plant => !plant.isArchived)
        .map(plant => `${plant.name}-${plant.variety ?? ''}`),
    )
    return varieties.size
  }, [plants])

  const nextTaskFor = (plantId: string): CalendarTask | null => {
    if (!isDemo) {
      // Real-data path: vi har ingen task-kobling endnu i Planter-flowet.
      // Næste-handling vises stadig via PlantCard's egen estimateNextTask
      // (asset-drevet, statusbaseret) — så denne returner null.
      return null
    }
    return mockPlantTasks.find(task => task.linkedPlantId === plantId) ?? null
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <PlantHero
        activeCount={plants.filter(plant => !plant.isArchived).length}
        varietyCount={varietyCount}
      />

      <GreenhouseNow plants={plants} />

      <PlantStatusFilter
        filters={plantStatusFilters}
        active={activeFilter}
        onChange={setActiveFilter}
      />

      <section className="space-y-5">
        {activePlants.length > 0 ? (
          activePlants.map(plant => (
            <PlantCard key={plant.id} plant={plant} nextTask={nextTaskFor(plant.id)} />
          ))
        ) : (
          <PlantEmptyState />
        )}
      </section>

      {/* Mock-drevne demo-sektioner — vises kun i demo-mode, fordi de
          har ingen real-data ækvivalent endnu. Når real users har data
          her, kommer en separat real-data variant. */}
      {isDemo && (
        <>
          <NextPlantActions actions={mockPlantActions} />
          <RecentPlantActivity activities={mockPlantActivities} />
        </>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,var(--surface-2),var(--card))] p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl leading-tight text-foreground">Tidligere sæsoner</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Se arkiverede planter, noter og høsterfaringer.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/">
              Åbn havebog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

/** Status-filter for ægte Plant-objekter (uden Mock-extras). */
function filterRealPlantsByStatus(
  plants: Plant[],
  status: PlantFilterStatus,
): Plant[] {
  if (status === 'alle') return plants.filter(p => !p.isArchived)
  // PlantFilterStatus matches PlantStatus minus 'alle'
  return plants.filter(p => !p.isArchived && (p.status as string) === status)
}
