import { eventNarrativ } from '@/lib/sprog'
import type { PlantEvent } from '@/lib/types'
import {
  Sprout, Leaf, Droplets, MoveRight, Scissors, Flag, FileText, Camera,
} from 'lucide-react'

const EVENT_IKON: Record<string, React.ComponentType<{ className?: string }>> = {
  soet:       Sprout,
  spiret:     Leaf,
  priklet:    Sprout,
  udplantet:  Leaf,
  vandet:     Droplets,
  goedet:     Leaf,
  flyttet:    MoveRight,
  beskaaret:  Scissors,
  hoestet:    Sprout,
  afsluttet:  Flag,
  note:       FileText,
  foto:       Camera,
}

const EVENT_FARVE: Record<string, string> = {
  soet:       'text-green-600 bg-green-50 border-green-200',
  spiret:     'text-emerald-600 bg-emerald-50 border-emerald-200',
  priklet:    'text-teal-600 bg-teal-50 border-teal-200',
  udplantet:  'text-lime-600 bg-lime-50 border-lime-200',
  vandet:     'text-blue-600 bg-blue-50 border-blue-200',
  goedet:     'text-amber-600 bg-amber-50 border-amber-200',
  flyttet:    'text-indigo-600 bg-indigo-50 border-indigo-200',
  beskaaret:  'text-orange-600 bg-orange-50 border-orange-200',
  hoestet:    'text-emerald-700 bg-emerald-50 border-emerald-300',
  afsluttet:  'text-muted-foreground bg-muted border-border',
  note:       'text-muted-foreground bg-card border-border',
  foto:       'text-muted-foreground bg-card border-border',
}

interface Props {
  events: PlantEvent[]
}

export function PlantTimeline({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Endnu ingen begivenheder.</p>
  }

  return (
    <div className="relative space-y-3">
      {/* Vertikal linje */}
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />

      {events.map(event => {
        const Icon = EVENT_IKON[event.event_type] ?? FileText
        const color = EVENT_FARVE[event.event_type] ?? EVENT_FARVE.note
        const narrativ = eventNarrativ(event.event_type, event.data ?? {}, event.event_date)

        return (
          <div key={event.id} className="flex items-start gap-3 relative">
            <div className={`h-8 w-8 rounded-full border flex items-center justify-center flex-shrink-0 relative z-10 bg-card ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 pt-1 min-w-0">
              <p className="text-sm text-foreground">{narrativ}</p>
              {event.notes && (
                <p className="text-xs text-muted-foreground mt-0.5">{event.notes}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
