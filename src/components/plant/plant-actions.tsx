'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionDialog } from './action-dialog'
import { TILLADTE_HANDLINGER, HANDLING_LABEL, type HandlingType } from '@/lib/livscyklus/state-machine'
import type { Livscyklus, Placering } from '@/lib/types'
import {
  Sprout, Scissors, Droplets, Leaf, MoveRight, Ruler, Package,
  FileText, Flag,
} from 'lucide-react'

interface Props {
  plantId: string
  livscyklus: Livscyklus
  placeringer: Placering[]
  currentPlaceringId?: string | null
}

// Ikoner per handling
const HANDLING_IKON: Record<HandlingType, React.ComponentType<{ className?: string }>> = {
  soe:       Sprout,
  spiret:    Leaf,
  prikle:    Ruler,
  plant_ud:  Package,
  vand:      Droplets,
  goed:      Leaf,
  flyt:      MoveRight,
  beskaar:   Scissors,
  hoest:     Sprout,
  afslut:    Flag,
  note:      FileText,
}

/**
 * Rækkefølge af handlinger — mest relevante/hyppige først.
 */
const HANDLING_RAEKKEFOELGE: HandlingType[] = [
  'spiret', 'prikle', 'plant_ud',   // Livscyklus-overgange først
  'vand', 'goed',                    // Pasning
  'hoest', 'beskaar',                // Høst + vedligehold
  'flyt', 'note',                    // Administrative
  'afslut',                          // Terminal — til sidst
]

export function PlantActions({ plantId, livscyklus, placeringer, currentPlaceringId }: Props) {
  const [activeAction, setActiveAction] = useState<HandlingType | null>(null)

  const tilladte = TILLADTE_HANDLINGER[livscyklus] ?? []
  const sorteret = HANDLING_RAEKKEFOELGE.filter(h => tilladte.includes(h))

  if (sorteret.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Planten er afsluttet — kun noter kan tilføjes.
      </p>
    )
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {sorteret.map(h => {
          const Icon = HANDLING_IKON[h]
          const isDestructive = h === 'afslut'
          return (
            <Button
              key={h}
              onClick={() => setActiveAction(h)}
              variant={isDestructive ? 'ghost' : 'secondary'}
              size="sm"
              className={isDestructive ? 'text-destructive' : ''}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {HANDLING_LABEL[h]}
            </Button>
          )
        })}
      </div>

      <ActionDialog
        plantId={plantId}
        action={activeAction}
        open={!!activeAction}
        onClose={() => setActiveAction(null)}
        placeringer={placeringer}
        currentPlaceringId={currentPlaceringId}
      />
    </>
  )
}
