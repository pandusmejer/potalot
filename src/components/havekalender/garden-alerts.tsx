import { Snowflake, Sun, CloudRain, Wind } from 'lucide-react'
import type { GardenAlert } from '@/actions/weather'
import type { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<GardenAlert['icon'], ComponentType<SVGProps<SVGSVGElement>>> = {
  Snowflake, Sun, CloudRain, Wind,
}

/** Farvetema pr. varseltype — alvorligt men ikke skrigende. */
const KIND_THEME: Record<GardenAlert['kind'], string> = {
  frost: 'bg-sky-50 border-sky-300 text-sky-900',
  storm: 'bg-orange-50 border-orange-300 text-orange-900',
  skybrud: 'bg-slate-50 border-slate-300 text-slate-900',
  toerke: 'bg-amber-50 border-amber-300 text-amber-900',
}

const ICON_COLOR: Record<GardenAlert['kind'], string> = {
  frost: 'text-sky-700',
  storm: 'text-orange-700',
  skybrud: 'text-slate-700',
  toerke: 'text-amber-700',
}

/**
 * Natur-varsler. Vises kun når der er aktive varsler — ellers intet
 * (ingen støj på rolige dage). Frost/storm/skybrud er warnings,
 * tørke er en blødere info-reminder.
 */
export function GardenAlerts({ alerts }: { alerts: GardenAlert[] }) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map(a => {
        const Icon = ICON_MAP[a.icon] ?? Sun
        return (
          <div
            key={a.kind}
            className={cn(
              'flex items-start gap-3 rounded-xl border px-4 py-3',
              KIND_THEME[a.kind],
              a.severity === 'warning' && 'border-l-[5px]',
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', ICON_COLOR[a.kind])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{a.title}</p>
              <p className="text-xs mt-0.5 leading-relaxed opacity-90">{a.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
