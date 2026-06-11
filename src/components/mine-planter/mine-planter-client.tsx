'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlantArtRow } from '@/components/mine-planter/plant-art-row'
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
  mockPlants,
  plantStatusFilters,
  type PlantFilterStatus,
} from '@/data/mock-plants'
import type { Plant, PlantStatus } from '@/lib/types'
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

  // V2-arkitektur: "Aktive → Art → Sorter".
  // Gruppér de filtrerede planter efter art (plant.name). Hver art
  // bliver en sektion med horisontal scroll af sort-kort, i stedet
  // for den gamle uendelige lodrette liste af store kort.
  //
  // Art-grupper sorteres: grupper med opmærksomheds-status
  // (høstklar / klar til udplantning) først, derefter flest planter,
  // derefter alfabetisk. Det besvarer "hvordan har mine planter det"
  // i prioriteret rækkefølge: dem der har brug for dig står øverst.
  const artGroups = useMemo(() => {
    const byArt = new Map<string, Plant[]>()
    for (const plant of activePlants) {
      const key = plant.name
      if (!byArt.has(key)) byArt.set(key, [])
      byArt.get(key)!.push(plant)
    }
    const needsAttention = (group: Plant[]) =>
      group.some(
        p => (p.status as PlantStatus) === 'hoestklar' ||
             (p.status as PlantStatus) === 'klar_til_udplantning',
      )
    return [...byArt.entries()].sort(([nameA, groupA], [nameB, groupB]) => {
      const attA = needsAttention(groupA) ? 0 : 1
      const attB = needsAttention(groupB) ? 0 : 1
      if (attA !== attB) return attA - attB
      if (groupA.length !== groupB.length) return groupB.length - groupA.length
      return nameA.localeCompare(nameB, 'da')
    })
  }, [activePlants])

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

      <section className="space-y-7">
        {artGroups.length > 0 ? (
          artGroups.map(([artName, group]) => (
            <PlantArtRow key={artName} artName={artName} plants={group} />
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
