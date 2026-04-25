import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PLANT_STATUS_META } from '@/lib/constants'
import { dageSiden } from '@/lib/datetime'
import type { Plant, CalendarTask } from '@/lib/types'
import { Sprout, MapPin, Calendar, ArrowRight } from 'lucide-react'

interface Props {
  plant: Plant
  /** Næste opgave for planten — vises som CTA */
  nextTask?: CalendarTask | null
}

/**
 * Plantekort til oversigten på Mine planter.
 * Indeholder navn, sort, billede, status, næste opgave, placering, alder, quick actions.
 */
export function PlantCard({ plant, nextTask }: Props) {
  const statusMeta = PLANT_STATUS_META[plant.status]
  const alder = plant.sowDate ? dageSiden(plant.sowDate) : null

  return (
    <Link
      href={`/mine-planter/${plant.id}`}
      className="block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex">
        {/* Venstre: billede / placeholder */}
        <div className="w-24 sm:w-32 shrink-0 bg-secondary/40 flex items-center justify-center">
          {/* TODO (storage): faktisk plante-billede fra MediaAsset */}
          <Sprout className="h-10 w-10 text-primary/40" />
        </div>

        {/* Højre: indhold */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-1.5">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">{plant.name}</p>
              {plant.variety && (
                <p className="text-sm italic text-muted-foreground truncate">
                  {plant.variety}
                </p>
              )}
            </div>
            <Badge variant={(statusMeta.badgeVariant as 'muted' | 'info' | 'success' | 'warning' | 'outline') ?? 'muted'}>
              {statusMeta.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {plant.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {plant.location}
              </span>
            )}
            {alder !== null && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {alder === 0 ? 'Sået i dag' : `${alder} dage gammel`}
                </span>
              </>
            )}
            {plant.quantity > 1 && (
              <>
                <span>·</span>
                <span>{plant.quantity} stk</span>
              </>
            )}
          </div>

          {nextTask && (
            <div className="mt-1 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary self-start">
              <ArrowRight className="h-3 w-3" />
              {nextTask.title}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
