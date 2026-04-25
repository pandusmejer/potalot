'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { PlantCard } from './plant-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, Sprout } from 'lucide-react'
import type { Plant, CalendarTask } from '@/lib/types'

interface Props {
  plants: Plant[]
  tasks: CalendarTask[]
}

/**
 * Mine planter-liste med tabs (Aktive / Klar til høst / Arkiv) og søgning.
 */
export function PlantList({ plants, tasks }: Props) {
  const [search, setSearch] = useState('')

  const aktive = useMemo(() => plants.filter(p => !p.isArchived), [plants])
  const arkiverede = useMemo(() => plants.filter(p => p.isArchived), [plants])
  const hoestklar = useMemo(() => aktive.filter(p => p.status === 'hoestklar' || p.status === 'i_vaekst'), [aktive])

  function filter(list: Plant[]) {
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.variety?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    )
  }

  function nextTaskFor(plantId: string): CalendarTask | null {
    return tasks
      .filter(t => t.linkedPlantId === plantId && t.status === 'open')
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  }

  function renderList(list: Plant[]) {
    const filtered = filter(list)
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={<Sprout className="h-8 w-8" />}
          title={search ? 'Ingen resultater' : 'Ingen planter her'}
          description={search ? 'Prøv et andet søgeord.' : 'Tilføj en plante via Frøbank.'}
        />
      )
    }
    return (
      <div className="space-y-3">
        {filtered.map(p => <PlantCard key={p.id} plant={p} nextTask={nextTaskFor(p.id)} />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg navn, sort eller placering"
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="aktive">
        <TabsList>
          <TabsTrigger value="aktive">
            Aktive <span className="ml-1.5 text-xs opacity-60">({aktive.length})</span>
          </TabsTrigger>
          <TabsTrigger value="hoestklar">
            Klar til høst <span className="ml-1.5 text-xs opacity-60">({hoestklar.length})</span>
          </TabsTrigger>
          <TabsTrigger value="arkiv">
            Arkiv <span className="ml-1.5 text-xs opacity-60">({arkiverede.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aktive">{renderList(aktive)}</TabsContent>
        <TabsContent value="hoestklar">{renderList(hoestklar)}</TabsContent>
        <TabsContent value="arkiv">
          {arkiverede.length > 0 && (
            <p className="text-xs text-muted-foreground italic mb-3">
              Arkiverede planter er read-only. Brugt til at sammenligne på tværs af år.
            </p>
          )}
          {renderList(arkiverede)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
