'use client'

import { MONTHS_DA } from '@/lib/constants'
import { aktuelMaaned, aktuelAar, saeson } from '@/lib/datetime'
import type { CalendarTask, GeneralGardenTask } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Snowflake, Sprout, Sun, Leaf } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

interface Props {
  active: number
  onChange: (month: number) => void
  tasks: CalendarTask[]
  generelle: GeneralGardenTask[]
}

type Saeson = 'Vinter' | 'Forår' | 'Sommer' | 'Efterår'

/** Sæson-ikon (lille naturindikator). */
const SAESON_ICON: Record<Saeson, ComponentType<SVGProps<SVGSVGElement>>> = {
  Vinter: Snowflake,
  Forår: Sprout,
  Sommer: Sun,
  Efterår: Leaf,
}

/** Sæson-farvetema — subtilt, ikke neon. */
const SAESON_THEME: Record<Saeson, {
  bg: string
  border: string
  text: string
  activeBg: string
  iconColor: string
}> = {
  Vinter: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
    activeBg: 'bg-slate-600 text-white border-slate-600',
    iconColor: 'text-slate-400',
  },
  Forår: {
    bg: 'bg-green-50/70',
    border: 'border-green-200',
    text: 'text-green-700',
    activeBg: 'bg-green-600 text-white border-green-600',
    iconColor: 'text-green-500',
  },
  Sommer: {
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    text: 'text-amber-800',
    activeBg: 'bg-amber-600 text-white border-amber-600',
    iconColor: 'text-amber-500',
  },
  Efterår: {
    bg: 'bg-orange-50/60',
    border: 'border-orange-200/80',
    text: 'text-orange-800',
    activeBg: 'bg-orange-700 text-white border-orange-700',
    iconColor: 'text-orange-500',
  },
}

/**
 * Årshjul — organisk månedstidslinje.
 *
 * I stedet for ens admin-tabs får hver måned sin sæsonfarve + lille
 * naturindikator (snefnug/spire/sol/blad). Aktuel måned markeres med
 * ring. Aktiv (valgt) måned er større og fyldt. Det giver rytme — man
 * kan SE året skifte karakter, ikke bare klikke rundt.
 */
export function Aarshjul({ active, onChange, tasks, generelle }: Props) {
  const nu = aktuelMaaned()

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Årshjul {aktuelAar()}
      </p>
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex items-end gap-1.5 min-w-max">
          {MONTHS_DA.map(m => {
            const tasksIMaaned = tasks.filter(t => {
              const dateMonth = new Date(t.date).getMonth() + 1
              return dateMonth === m.num
            }).length
            const generelleAntal = generelle.filter(g => g.month === m.num).length
            const total = tasksIMaaned + generelleAntal

            const isActive = active === m.num
            const isNow = m.num === nu
            const sa = saeson(m.num) as Saeson
            const theme = SAESON_THEME[sa]
            const Icon = SAESON_ICON[sa]

            return (
              <button
                key={m.num}
                onClick={() => onChange(m.num)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border transition-all',
                  // Aktiv måned er større + fyldt med sæsonfarve
                  isActive
                    ? cn('px-4 py-3 min-w-[76px] shadow-md', theme.activeBg)
                    : cn(
                        'px-3 py-2 min-w-[62px]',
                        theme.bg, theme.border, theme.text,
                        'hover:brightness-95'
                      ),
                  // Nuværende måned (selv hvis ikke valgt): subtil ring
                  isNow && !isActive && 'ring-2 ring-offset-1 ring-offset-background ring-foreground/15',
                )}
              >
                <Icon
                  className={cn(
                    isActive ? 'h-4 w-4 text-white/90' : cn('h-3.5 w-3.5', theme.iconColor),
                  )}
                />
                <span className={cn('font-medium', isActive ? 'text-base' : 'text-sm')}>
                  {m.short.charAt(0).toUpperCase() + m.short.slice(1)}
                </span>
                <span className={cn('text-[10px]', isActive ? 'text-white/80' : 'opacity-60')}>
                  {total}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
