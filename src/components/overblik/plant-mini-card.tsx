import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PLANT_STATUS_META } from '@/lib/constants'
import { venligDato } from '@/lib/datetime'
import type { Plant } from '@/lib/types'
import { Sprout, MapPin } from 'lucide-react'

/**
 * Lille plante-kort til Overblik. Større version i /mine-planter.
 */
export function PlantMiniCard({ plant }: { plant: Plant }) {
  const statusMeta = PLANT_STATUS_META[plant.status]

  return (
    <Link
      href={`/mine-planter/${plant.id}`}
      className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
    >
      <div className="h-10 w-10 rounded-lg bg-secondary/40 flex items-center justify-center shrink-0">
        <Sprout className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground truncate">{plant.name}</p>
          {plant.variety && (
            <span className="text-sm italic text-muted-foreground truncate">
              {plant.variety}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
          {plant.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {plant.location}
            </span>
          )}
          {plant.sowDate && (
            <>
              <span>·</span>
              <span>Sået {venligDato(plant.sowDate)}</span>
            </>
          )}
        </div>
      </div>
      <Badge variant={(statusMeta.badgeVariant as 'muted' | 'info' | 'success' | 'warning' | 'outline') ?? 'muted'}>
        {statusMeta.label}
      </Badge>
    </Link>
  )
}
