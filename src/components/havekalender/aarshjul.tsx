'use client'

import { MONTHS_DA } from '@/lib/constants'
import { aktuelMaaned, aktuelAar } from '@/lib/datetime'
import type { CalendarTask, GeneralGardenTask } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  active: number
  onChange: (month: number) => void
  tasks: CalendarTask[]
  generelle: GeneralGardenTask[]
}

/**
 * Årshjul — lineær månedsnavigation med tællere.
 * Aktuel måned er fremhævet. Klik for at skifte måned.
 */
export function Aarshjul({ active, onChange, tasks, generelle }: Props) {
  const nu = aktuelMaaned()

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Årshjul {aktuelAar()}
        </p>
      </div>
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-1.5 min-w-max">
          {MONTHS_DA.map(m => {
            const tasksIMaaned = tasks.filter(t => {
              const dateMonth = new Date(t.date).getMonth() + 1
              return dateMonth === m.num
            }).length
            const generelleAntal = generelle.filter(g => g.month === m.num).length
            const total = tasksIMaaned + generelleAntal
            const isActive = active === m.num
            const erFortid = m.num < nu

            return (
              <button
                key={m.num}
                onClick={() => onChange(m.num)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all min-w-[68px]',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : erFortid
                    ? 'bg-muted/40 border-border text-muted-foreground'
                    : 'bg-card border-border text-foreground hover:bg-accent/40'
                )}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {m.short}
                </span>
                <span className="text-sm font-medium">{m.full.slice(0, 3)}</span>
                {total > 0 && (
                  <span className={cn(
                    'text-[10px] mt-0.5',
                    isActive ? 'opacity-80' : 'text-muted-foreground'
                  )}>
                    {total}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
