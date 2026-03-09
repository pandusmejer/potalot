'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SeedForm } from '@/components/inventory/seed-form'
import { PlantForm } from '@/components/inventory/plant-form'
import { PLANT_STATUSES, SEED_STATUSES, type PlantStatus } from '@/lib/constants'
import type { Seed, Plant, PlantGuide } from '@/lib/types'
import { Package, Sprout, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface InventoryListProps {
  seeds: Seed[]
  plants: Plant[]
  guides: PlantGuide[]
}

export function InventoryList({ seeds, plants, guides }: InventoryListProps) {
  const [tab, setTab] = useState<'seeds' | 'plants'>('seeds')
  const [seedFormOpen, setSeedFormOpen] = useState(false)
  const [plantFormOpen, setPlantFormOpen] = useState(false)
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null)
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('seeds')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tab === 'seeds' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Frø ({seeds.length})
        </button>
        <button
          onClick={() => setTab('plants')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tab === 'plants' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Planter ({plants.length})
        </button>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => tab === 'seeds' ? setSeedFormOpen(true) : setPlantFormOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {tab === 'seeds' ? 'Nyt frø' : 'Ny plante'}
        </Button>
      </div>

      {tab === 'seeds' && (
        <>
          {seeds.length === 0 ? (
            <EmptyState
              icon={<Package className="h-10 w-10" />}
              title="Ingen frø endnu"
              description="Tilføj dine frø for at holde styr på din beholdning."
              action={<Button size="sm" onClick={() => setSeedFormOpen(true)}>Tilføj frø</Button>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {seeds.map((seed) => {
                const statusMeta = SEED_STATUSES[seed.status as keyof typeof SEED_STATUSES]
                return (
                  <Card
                    key={seed.id}
                    className="cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => { setEditingSeed(seed); setSeedFormOpen(true) }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{seed.name}</p>
                        {seed.variety && <p className="text-xs text-muted-foreground">{seed.variety}</p>}
                      </div>
                      {statusMeta && <Badge className={statusMeta.color}>{statusMeta.label}</Badge>}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {seed.quantity != null && <span>{seed.quantity} stk</span>}
                      {seed.brand && <span>{seed.brand}</span>}
                      {seed.year_purchased && <span>Købt {seed.year_purchased}</span>}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'plants' && (
        <>
          {plants.length === 0 ? (
            <EmptyState
              icon={<Sprout className="h-10 w-10" />}
              title="Ingen planter endnu"
              description="Tilføj din første plante for at begynde at tracke dyrkningen."
              action={<Button size="sm" onClick={() => setPlantFormOpen(true)}>Tilføj plante</Button>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {plants.map((plant) => {
                const statusMeta = PLANT_STATUSES[plant.status as PlantStatus]
                return (
                  <Link key={plant.id} href={`/inventory/${plant.id}`}>
                    <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{plant.name}</p>
                          {plant.variety && <p className="text-xs text-muted-foreground">{plant.variety}</p>}
                        </div>
                        {statusMeta && <Badge className={statusMeta.color}>{statusMeta.label}</Badge>}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        {plant.location && <span>{plant.location}</span>}
                        {plant.sow_date && <span>Sået {plant.sow_date}</span>}
                        {plant.quantity > 1 && <span>{plant.quantity} stk</span>}
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      <SeedForm
        open={seedFormOpen}
        onClose={() => { setSeedFormOpen(false); setEditingSeed(null) }}
        seed={editingSeed}
        guides={guides}
      />
      <PlantForm
        open={plantFormOpen}
        onClose={() => { setPlantFormOpen(false); setEditingPlant(null) }}
        plant={editingPlant}
        guides={guides}
        seeds={seeds}
      />
    </div>
  )
}
