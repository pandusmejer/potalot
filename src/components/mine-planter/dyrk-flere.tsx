'use client'

import { Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SowDialog } from '@/components/froebank/sow-dialog'
import { EgenPlanteDialog } from '@/components/mine-planter/egen-plante-dialog'
import type { GardenLocation } from '@/lib/types'

interface Props {
  /** Plantens art (påkrævet) og sort — den nye dyrkning får de samme. */
  name: string
  variety: string | null
  /** plants_v2.source_inventory_id. null = planten har ingen frøpose i Frøbanken. */
  sourceInventoryId: string | null
  gardenLocations: GardenLocation[]
}

/**
 * "Dyrk flere" — start en NY dyrkning af samme art og sort fra plantens side.
 *
 * Genbruger de to eksisterende oprettelsesflows i stedet for et nyt:
 *   • Med frøpose  → SowDialog (saaFroeFraInventory). `altidNyDyrkning` gør,
 *     at der ALTID oprettes en ny plante med samme source_inventory_id; den
 *     eksisterende dyrkning ændres aldrig og spørges ikke om at blive slået
 *     sammen.
 *   • Uden frøpose → EgenPlanteDialog (opretEgenPlante, source_inventory_id =
 *     null), forudfyldt med art og sort. Intet kræver en frøpose.
 */
export function DyrkFlere({ name, variety, sourceInventoryId, gardenLocations }: Props) {
  const knap = (
    <Button variant="outline" className="w-full gap-2">
      <Sprout className="h-4 w-4" aria-hidden />
      Dyrk flere
    </Button>
  )

  if (sourceInventoryId) {
    return (
      <SowDialog
        inventoryItemId={sourceInventoryId}
        itemLabel={variety ? `${name} · ${variety}` : name}
        altidNyDyrkning
      >
        {knap}
      </SowDialog>
    )
  }

  return (
    <EgenPlanteDialog gardenLocations={gardenLocations} defaults={{ name, variety }}>
      {knap}
    </EgenPlanteDialog>
  )
}
