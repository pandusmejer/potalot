import { formatDatoMedAar, venligDato } from '@/lib/datetime'
import type { Plant, PlantLog } from '@/lib/types'
import { Sprout, Leaf, ArrowUpRight, TreePine, Wheat, Flag, FileText, Droplets, Scissors, Bug } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogActions } from '@/components/mine-planter/log-actions'
import type { ComponentType, SVGProps } from 'react'

/** Log-typer som brugeren har oprettet — kan redigeres/slettes.
 *  Auto-genererede status_change og archive lader vi være. */
const EDITABLE_TYPES = new Set<string>([
  'note', 'watering', 'fertilizing', 'pruning', 'pest_disease',
  'harvest', 'germination', 'repotting', 'planting_out', 'sowing',
])

const LOG_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  sowing: Sprout,
  germination: Leaf,
  repotting: ArrowUpRight,
  planting_out: TreePine,
  watering: Droplets,
  fertilizing: Leaf,
  pruning: Scissors,
  pest_disease: Bug,
  harvest: Wheat,
  status_change: Flag,
  archive: Flag,
  note: FileText,
}

const LOG_FARVE: Record<string, string> = {
  sowing:        'bg-green-50 border-green-200 text-green-700',
  germination:   'bg-emerald-50 border-emerald-200 text-emerald-700',
  repotting:     'bg-amber-50 border-amber-200 text-amber-700',
  planting_out:  'bg-lime-50 border-lime-200 text-lime-700',
  watering:      'bg-blue-50 border-blue-200 text-blue-700',
  fertilizing:   'bg-yellow-50 border-yellow-200 text-yellow-700',
  pruning:       'bg-orange-50 border-orange-200 text-orange-700',
  pest_disease:  'bg-red-50 border-red-200 text-red-700',
  harvest:       'bg-amber-50 border-amber-300 text-amber-800',
  status_change: 'bg-muted border-border text-muted-foreground',
  archive:       'bg-muted border-border text-muted-foreground',
  note:          'bg-card border-border text-muted-foreground',
}

interface Props {
  plant: Plant
  logs: PlantLog[]
}

/**
 * Plante-tidslinje. Viser strukturerede milepæle (sået/spiret/udplantet/første høst)
 * + alle log-events i kronologisk rækkefølge.
 */
export function Timeline({ plant, logs }: Props) {
  // Strukturerede milepæle fra plant fields
  const milepaele = [
    { type: 'sowing', label: 'Sået', date: plant.sowDate },
    { type: 'planting_out', label: 'Udplantet', date: plant.plantingOutDate },
    { type: 'harvest', label: 'Første høst', date: plant.firstHarvestDate },
  ].filter(m => m.date) as { type: string; label: string; date: string }[]

  // Sammenflet logs + milepæle, sorteret efter dato (nyeste først)
  const items = [
    ...logs.map(l => ({ kind: 'log' as const, log: l, date: l.date })),
    ...milepaele.map(m => ({ kind: 'milestone' as const, milestone: m, date: m.date })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4">
        Ingen log-events endnu.
      </p>
    )
  }

  return (
    <div className="relative space-y-3">
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />
      {items.map((item, i) => {
        if (item.kind === 'log') {
          const Icon = LOG_ICON[item.log.type] ?? FileText
          const farve = LOG_FARVE[item.log.type] ?? LOG_FARVE.note
          const editable = EDITABLE_TYPES.has(item.log.type)
          return (
            <div key={`l${item.log.id}`} className="group flex items-start gap-3 relative">
              <div
                className={cn(
                  'h-8 w-8 rounded-full border flex items-center justify-center shrink-0 z-10 bg-card',
                  farve
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 pt-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    {item.log.title ?? 'Note'}
                  </p>
                  <span className="text-xs text-muted-foreground">{venligDato(item.log.date)}</span>
                </div>
                {item.log.note && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.log.note}</p>
                )}
                {item.log.imageIds.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {item.log.imageIds.map(url => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square rounded-md overflow-hidden border border-border bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {editable && (
                <LogActions plantId={plant.id} log={item.log} />
              )}
            </div>
          )
        }

        const Icon = LOG_ICON[item.milestone.type] ?? Flag
        const farve = LOG_FARVE[item.milestone.type] ?? LOG_FARVE.note
        return (
          <div key={`m${i}`} className="flex items-start gap-3 relative">
            <div className={cn('h-8 w-8 rounded-full border flex items-center justify-center shrink-0 z-10 bg-card', farve)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-sm">
                <span className="font-medium text-foreground">{item.milestone.label}</span>
                <span className="text-muted-foreground"> · {formatDatoMedAar(item.milestone.date)}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
