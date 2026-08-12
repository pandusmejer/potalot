'use client'

import { MONTHS_DA } from '@/lib/constants'
import { MAANEDS_STEMNING } from '@/lib/maaneds-stemning'
import { aktuelMaaned, aktuelAar } from '@/lib/datetime'
import type { CalendarTask, GeneralGardenTask } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Snowflake, Sprout, Sun, Leaf, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { ComponentType, SVGProps, ReactNode } from 'react'

interface Props {
  active: number
  onChange: (month: number) => void
  tasks: CalendarTask[]
  generelle: GeneralGardenTask[]
  /** Indhold der foldes ud inde i den valgte måneds blok
   *  (fx månedens gøremål) — så år og gøremål er ÉN blok. */
  renderActive?: (month: number) => ReactNode
}

interface SaesonDef {
  navn: string
  months: number[]
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Fast sæson-palette (jf. de angivne paletter pr. sæson) */
  primary: string
  onPrimary: string
  tint: string
  ink: string
  accent: string
}

// Vertikal sæson-progression med navngivne sæson-farver:
// Forår = Fresh Sprout, Sommer = Tuscan Sun, Efterår = Sienna,
// Vinter = Sky Mist. Sienna er mørk (lys tekst); de øvrige er
// lyse/mellem (mørk tekst) for læsbar kontrast.
const SAESONER: SaesonDef[] = [
  { navn: 'Forår', months: [3, 4, 5], icon: Sprout,
    primary: '#CBD492', onPrimary: '#34401C', tint: '#EBF0D4', ink: '#34401C', accent: '#506834' },
  { navn: 'Sommer', months: [6, 7, 8], icon: Sun,
    primary: '#F1A805', onPrimary: '#3F2D04', tint: '#FBE7BD', ink: '#3F2D04', accent: '#882A0A' },
  { navn: 'Efterår', months: [9, 10, 11], icon: Leaf,
    primary: '#A3883A', onPrimary: '#F8F1DE', tint: '#EDE4CC', ink: '#3A2F12', accent: '#7A4A12' },
  { navn: 'Vinter', months: [12, 1, 2], icon: Snowflake,
    primary: '#C9DCE6', onPrimary: '#2D3A45', tint: '#E7EFF4', ink: '#2D3A45', accent: '#5E7081' },
]

/**
 * Sæson-navigation — året som lodret kapitel-system, ikke en
 * skjult horisontal chip-scroll. Fire sæson-kapitler (sticky
 * headere) med deres måneder som levende paneler i sæsonens
 * eget farveunivers. Man scroller vertikalt gennem naturens
 * progression og kan SE hvor i året man er. Samme props som før.
 */
export function Aarshjul({ active, onChange, tasks, generelle, renderActive }: Props) {
  const nu = aktuelMaaned()
  // Den valgte måned kan foldes sammen igen (klik på den aktive
  // måned). Et nyt månedsvalg åbner altid den måned.
  const [foldetSammen, setFoldetSammen] = useState(false)

  function antalFor(month: number): number {
    const t = tasks.filter(x => new Date(x.date).getMonth() + 1 === month).length
    const g = generelle.filter(x => x.month === month).length
    return t + g
  }

  return (
    <section className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Årshjul {aktuelAar()} · naturens gang
      </p>

      <div className="space-y-4">
        {SAESONER.map(sa => {
          const Icon = sa.icon
          return (
            <div key={sa.navn}>
              {/* Sticky sæson-kapitel-header — sæsonens farveunivers */}
              <div
                className="sticky top-2 z-10 flex items-center gap-2.5 rounded-tl-[1.5rem] rounded-br-[1.5rem] rounded-tr-md rounded-bl-md px-4 py-2.5"
                style={{ backgroundColor: sa.primary, color: sa.onPrimary }}
              >
                <Icon className="h-4 w-4 opacity-90" />
                <span className="font-sans text-lg font-bold tracking-tight">{sa.navn}</span>
                <span className="ml-auto text-[11px] uppercase tracking-[0.18em] opacity-65">
                  {sa.months.map(m => MONTHS_DA[m - 1].short).join(' · ')}
                </span>
              </div>

              {/* Måneder som lodrette levende paneler */}
              <div className="mt-2 space-y-2 pl-3">
                {sa.months.map((m, i) => {
                  const isActive = active === m
                  const isNow = m === nu
                  const navn = MONTHS_DA[m - 1].full
                  const tagline = MAANEDS_STEMNING[m]?.tagline ?? ''
                  const antal = antalFor(m)
                  const radius = i % 2 === 0
                    ? 'rounded-tl-[1.4rem] rounded-br-[1.4rem] rounded-tr-md rounded-bl-md'
                    : 'rounded-tr-[1.4rem] rounded-bl-[1.4rem] rounded-tl-md rounded-br-md'

                  return (
                    <div
                      key={m}
                      className={cn('overflow-hidden transition-all', radius, isActive && 'shadow-soft')}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (m === active) setFoldetSammen(c => !c)
                          else { onChange(m); setFoldetSammen(false) }
                        }}
                        aria-current={isActive ? 'true' : undefined}
                        aria-expanded={
                          isActive && !!renderActive ? !foldetSammen : undefined
                        }
                        className={cn(
                          'relative block w-full px-5 py-4 text-left',
                          isActive && renderActive && 'pr-12'
                        )}
                        style={
                          isActive
                            ? { backgroundColor: sa.primary, color: sa.onPrimary }
                            : { backgroundColor: sa.tint, color: sa.ink }
                        }
                      >
                        {isActive && renderActive && (
                          <ChevronDown
                            aria-hidden
                            className={cn(
                              'absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-70 transition-transform',
                              !foldetSammen && 'rotate-180'
                            )}
                          />
                        )}
                        {isNow && (
                          <span
                            className="absolute right-4 top-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                            style={{ color: isActive ? sa.onPrimary : sa.accent }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: sa.accent }}
                            />
                            Nu
                          </span>
                        )}
                        <p className="text-xs font-medium opacity-60">
                          {antal} ting, du kan gøre i
                        </p>
                        <span className="block font-sans text-2xl font-bold leading-tight tracking-tight">
                          {navn}
                        </span>
                        <p className="mt-0.5 text-sm font-medium opacity-80">{tagline}</p>
                      </button>

                      {/* Månedens gøremål foldet ud INDE i månedens blok.
                          Klik på den aktive måned folder sammen igen. */}
                      {isActive && renderActive && !foldetSammen && (
                        <div className="bg-card px-5 pb-5 pt-4 text-foreground">
                          {renderActive(m)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
