import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Sprout, MapPin, Package } from 'lucide-react'
import { formatDatoKort } from '@/lib/datetime'
import type { SowingEvent } from '@/lib/types'

interface Props {
  events: SowingEvent[]
}

export function SowingsList({ events }: Props) {
  if (events.length === 0) return null

  const total = events.reduce((sum, e) => sum + e.sownCount, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sprout className="h-4 w-4 text-primary" />
          Såninger
          <span className="text-xs font-normal text-muted-foreground">
            ({events.length} hold, {total} frø sået i alt)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.map(ev => (
          <div
            key={ev.id}
            className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
          >
            <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap pt-0.5">
              {formatDatoKort(ev.sowingDate)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                {ev.sownCount} {ev.sownCount === 1 ? 'frø' : 'frø'} sået
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                {ev.containerType && (
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {ev.containerType}
                  </span>
                )}
                {ev.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {ev.location}
                  </span>
                )}
              </div>
              {ev.notes && (
                <p className="text-xs text-muted-foreground italic mt-1">{ev.notes}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
