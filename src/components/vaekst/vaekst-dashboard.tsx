'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { PlantForm } from '@/components/inventory/plant-form'
import { PLANT_STATUSES, type PlantStatus } from '@/lib/constants'
import type { Seed, Plant, PlantGuide } from '@/lib/types'
import {
  Sprout, Plus, Search, X, ArrowRight, MapPin,
  AlertCircle, Clock, Droplets, Scissors, Flower2
} from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

// Next action logic per status
function getNextAction(plant: Plant): { text: string; urgent: boolean; icon: React.ReactNode } {
  switch (plant.status) {
    case 'planned':
      return { text: 'Tid til at så', urgent: false, icon: <Sprout className="h-3.5 w-3.5" /> }
    case 'sown':
      return { text: 'Tjek for spirer', urgent: false, icon: <Clock className="h-3.5 w-3.5" /> }
    case 'germinated':
      return { text: 'Klar til prikling', urgent: true, icon: <AlertCircle className="h-3.5 w-3.5" /> }
    case 'pricked':
      return { text: 'Lad vokse — afhærd snart', urgent: false, icon: <Clock className="h-3.5 w-3.5" /> }
    case 'hardening':
      return { text: 'Klar til udplantning', urgent: true, icon: <AlertCircle className="h-3.5 w-3.5" /> }
    case 'planted_out':
      return { text: 'Vand og gød regelmæssigt', urgent: false, icon: <Droplets className="h-3.5 w-3.5" /> }
    case 'growing':
      return { text: 'Vedligehold — beskær/bind', urgent: false, icon: <Scissors className="h-3.5 w-3.5" /> }
    case 'flowering':
      return { text: 'Snart høstklar!', urgent: false, icon: <Flower2 className="h-3.5 w-3.5" /> }
    case 'harvesting':
      return { text: 'Høst nu!', urgent: true, icon: <AlertCircle className="h-3.5 w-3.5" /> }
    case 'done':
      return { text: 'Sæson afsluttet', urgent: false, icon: <Clock className="h-3.5 w-3.5" /> }
    case 'dead':
      return { text: 'Udgået', urgent: false, icon: <Clock className="h-3.5 w-3.5" /> }
    default:
      return { text: '', urgent: false, icon: null }
  }
}

// Phase groups for the dashboard
const PHASE_GROUPS = [
  { key: 'attention', label: 'Kræver handling', statuses: ['germinated', 'hardening', 'harvesting'], color: 'text-amber-600' },
  { key: 'early', label: 'Tidlig fase', statuses: ['planned', 'sown'], color: 'text-green-600' },
  { key: 'growing', label: 'I vækst', statuses: ['pricked', 'planted_out', 'growing', 'flowering'], color: 'text-blue-600' },
  { key: 'done', label: 'Afsluttet', statuses: ['done', 'dead'], color: 'text-gray-500' },
]

interface VaekstDashboardProps {
  plants: Plant[]
  guides: PlantGuide[]
  seeds: Seed[]
}

export function VaekstDashboard({ plants, guides, seeds }: VaekstDashboardProps) {
  const [plantFormOpen, setPlantFormOpen] = useState(false)
  const [nameSearch, setNameSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState<string | null>(null)

  // Get unique locations
  const locations = useMemo(() => {
    const locs = plants.map(p => p.location).filter((l): l is string => !!l)
    return [...new Set(locs)].sort()
  }, [plants])

  // Filter plants
  const filteredPlants = useMemo(() => {
    let result = [...plants]

    if (locationFilter) {
      result = result.filter(p => p.location === locationFilter)
    }

    if (nameSearch.trim()) {
      const search = nameSearch.toLowerCase().trim()
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.variety && p.variety.toLowerCase().includes(search))
      )
    }

    return result
  }, [plants, locationFilter, nameSearch])

  // Group plants by phase
  const grouped = useMemo(() => {
    const groups: Record<string, Plant[]> = {}
    for (const group of PHASE_GROUPS) {
      groups[group.key] = filteredPlants.filter(p => group.statuses.includes(p.status))
    }
    return groups
  }, [filteredPlants])

  // Count plants needing attention
  const attentionCount = grouped['attention']?.length ?? 0
  const activeCount = plants.filter(p => !['done', 'dead'].includes(p.status)).length

  const hasActiveFilters = !!locationFilter || !!nameSearch

  return (
    <div className="space-y-6">
      {/* ========== Summary Bar ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
          <Sprout className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-lg font-bold text-foreground">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Aktive planter</p>
          </div>
        </div>
        {attentionCount > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-lg font-bold text-foreground">{attentionCount}</p>
              <p className="text-xs text-muted-foreground">Kræver handling</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <MapPin className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-lg font-bold text-foreground">{locations.length}</p>
            <p className="text-xs text-muted-foreground">Placeringer</p>
          </div>
        </div>
      </div>

      {/* ========== Filters ========== */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            placeholder="Søg planter..."
            className="pl-8 h-9 text-sm"
          />
          {nameSearch && (
            <button onClick={() => setNameSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {locations.length > 0 && (
          <select
            value={locationFilter ?? ''}
            onChange={e => setLocationFilter(e.target.value || null)}
            className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
          >
            <option value="">Alle steder</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
        {hasActiveFilters && (
          <button onClick={() => { setNameSearch(''); setLocationFilter(null) }} className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap">
            Ryd
          </button>
        )}
        <Button size="sm" onClick={() => setPlantFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Ny plante
        </Button>
      </div>

      {/* ========== Phase Groups ========== */}
      {filteredPlants.length === 0 ? (
        <EmptyState
          icon={<Sprout className="h-10 w-10" />}
          title={hasActiveFilters ? 'Ingen resultater' : 'Ingen planter endnu'}
          description={
            hasActiveFilters
              ? 'Prøv at ændre dine filtre.'
              : 'Tilføj din første plante eller registrer såning i Frøbanken.'
          }
          action={<Button size="sm" onClick={() => setPlantFormOpen(true)}>Tilføj plante</Button>}
        />
      ) : (
        PHASE_GROUPS.map(group => {
          const groupPlants = grouped[group.key]
          if (!groupPlants || groupPlants.length === 0) return null

          return (
            <div key={group.key}>
              <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${group.color}`}>
                {group.key === 'attention' && <AlertCircle className="h-4 w-4" />}
                {group.label}
                <span className="text-xs font-normal text-muted-foreground">({groupPlants.length})</span>
              </h2>

              <div className="grid gap-3 sm:grid-cols-2">
                {groupPlants.map(plant => {
                  const statusMeta = PLANT_STATUSES[plant.status as PlantStatus]
                  const nextAction = getNextAction(plant)

                  return (
                    <Link key={plant.id} href={`/vaekst/${plant.id}`}>
                      <Card className={`cursor-pointer transition-colors hover:border-primary/30 ${
                        nextAction.urgent ? 'border-amber-300 dark:border-amber-700' : ''
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{plant.name}</p>
                            {plant.variety && <p className="text-xs text-muted-foreground truncate">{plant.variety}</p>}
                          </div>
                          {statusMeta && <Badge className={`shrink-0 ${statusMeta.color}`}>{statusMeta.label}</Badge>}
                        </div>

                        {/* Next Action */}
                        <div className={`mt-2 flex items-center gap-1.5 text-xs ${
                          nextAction.urgent ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                        }`}>
                          {nextAction.icon}
                          <span>{nextAction.text}</span>
                          <ArrowRight className="h-3 w-3 ml-auto opacity-40" />
                        </div>

                        {/* Meta info */}
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          {plant.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {plant.location}
                            </span>
                          )}
                          {plant.quantity > 1 && <span>{plant.quantity} stk</span>}
                          {plant.sow_date && <span>Sået {plant.sow_date}</span>}
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      <PlantForm
        open={plantFormOpen}
        onClose={() => setPlantFormOpen(false)}
        guides={guides}
        seeds={seeds}
      />
    </div>
  )
}
