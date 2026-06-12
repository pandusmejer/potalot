import { cn } from '@/lib/utils'
import { formatPlantDate, type MockPlant } from '@/data/mock-plants'
import { Check, Circle } from 'lucide-react'

interface TimelinePoint {
  label: string
  date: string | null | undefined
}

interface PlantTimelineProps {
  plant: MockPlant
}

export function PlantTimeline({ plant }: PlantTimelineProps) {
  const points: TimelinePoint[] = [
    { label: 'Sået', date: plant.sownDate },
    { label: 'Spiret', date: plant.sproutedDate },
    { label: 'Ompottet', date: plant.repottedDate },
    { label: 'Udplantet', date: plant.plantedOutDate },
    { label: 'Første høst', date: plant.expectedHarvestStart },
    { label: 'Afsluttet/arkiveret', date: plant.archivedAt },
  ]

  return (
    <ol className="space-y-3">
      {points.map((point, index) => {
        const isDone = Boolean(point.date)
        return (
          <li key={point.label} className="grid grid-cols-[2rem_1fr] gap-3">
            <div className="relative flex justify-center">
              {index < points.length - 1 && (
                <span className="absolute top-8 h-[calc(100%+0.75rem)] w-px bg-border" />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-card',
                  isDone ? 'border-primary/20 text-primary' : 'border-border text-muted-foreground'
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </span>
            </div>
            <div className="pb-2">
              <p className="text-sm font-semibold text-foreground">{point.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{formatPlantDate(point.date)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
