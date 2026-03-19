'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PlantForm } from '@/components/inventory/plant-form'
import { PLANT_STATUSES, type PlantStatus } from '@/lib/constants'
import type { Seed, Plant, PlantGuide } from '@/lib/types'
import { Sprout, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface InventoryListProps {
  plants: Plant[]
  guides: PlantGuide[]
  seeds: Seed[]
}

export function InventoryList({ plants, guides, seeds }: InventoryListProps) {
  const [plantFormOpen, setPlantFormOpen] = useState(false)
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1" />
        <Button size="sm" onClick={() => setPlantFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Ny plante
        </Button>
      </div>

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
