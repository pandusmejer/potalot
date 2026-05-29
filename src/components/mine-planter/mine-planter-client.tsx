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
import { ArrowRight, BookOpen } from 'lucide-react'

export function MinePlanterClient() {
  const [activeFilter, setActiveFilter] = useState<PlantFilterStatus>('alle')

  const activePlants = useMemo(
    () => filterMockPlantsByStatus(mockPlants, activeFilter),
    [activeFilter]
  )

  const varietyCount = useMemo(() => {
    const varieties = new Set(
      mockPlants
        .filter(plant => !plant.isArchived)
        .map(plant => `${plant.name}-${plant.variety ?? ''}`)
    )
    return varieties.size
  }, [])

  const nextTaskFor = (plantId: string) =>
    mockPlantTasks.find(task => task.linkedPlantId === plantId) ?? null

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <PlantHero
        activeCount={mockPlants.filter(plant => !plant.isArchived).length}
        varietyCount={varietyCount}
      />

      <GreenhouseNow plants={mockPlants} />

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

      <NextPlantActions actions={mockPlantActions} />
      <RecentPlantActivity activities={mockPlantActivities} />

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
            <Link href="/mine-planter?arkiv=kommende">
              Åbn havebog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
