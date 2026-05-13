import { STAGE_ORDER, STAGE_SHORT_LABEL, stageIndex } from '@/lib/plant-stages'
import { PLANT_STATUS_META } from '@/lib/constants'
import type { PlantStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

/**
 * Vandret stadie-progression med 'du er her'-markør.
 * Bruges øverst på plantedetalje. Mobile-friendly: scrollable hvis nødvendigt.
 */
export function StageProgress({ status }: { status: PlantStatus }) {
  const currentIdx = stageIndex(status)

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="flex items-center min-w-fit">
        {STAGE_ORDER.map((stage, i) => {
          const passed = i < currentIdx
          const current = i === currentIdx
          const future = i > currentIdx
          const isLast = i === STAGE_ORDER.length - 1
          const meta = PLANT_STATUS_META[stage]

          return (
            <div key={stage} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center border-2 transition-colors',
                    passed && 'bg-green-600 border-green-600 text-white',
                    current && 'bg-green-100 border-green-600 text-green-800 ring-2 ring-green-200 ring-offset-2 ring-offset-card',
                    future && 'bg-muted border-border text-muted-foreground'
                  )}
                  title={meta.description}
                >
                  {passed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px] font-semibold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] whitespace-nowrap',
                    current && 'font-semibold text-foreground',
                    !current && 'text-muted-foreground'
                  )}
                >
                  {STAGE_SHORT_LABEL[stage]}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'h-[2px] w-6 sm:w-10 mb-4 transition-colors',
                    i < currentIdx ? 'bg-green-600' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
