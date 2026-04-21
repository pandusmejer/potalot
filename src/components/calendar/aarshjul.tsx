'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { MAANED_FORKORTELSER, MAANED_FULD, maanedFraDato } from '@/lib/calendar/maanedsplan'

/**
 * Lineært årshjul — klikbar måneds-navigation.
 * Aktuel måned er fremhævet. Klik på en måned for at se planen for den.
 */
export function Aarshjul({ activeMonth }: { activeMonth?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = activeMonth ?? maanedFraDato(new Date())
  const currentIdx = MAANED_FORKORTELSER.indexOf(current)

  function velgMaaned(m: string) {
    const sp = new URLSearchParams(searchParams)
    sp.set('maaned', m)
    router.replace(`/calendar?${sp.toString()}`, { scroll: false })
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-2">
      <div className="flex gap-1 min-w-max">
        {MAANED_FORKORTELSER.map((m, i) => {
          const active = m === current
          const isPast = i < currentIdx
          return (
            <button
              key={m}
              onClick={() => velgMaaned(m)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : isPast
                  ? 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  : 'bg-card border border-border text-foreground hover:bg-accent/40'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                {m}
              </span>
              <span className="text-xs font-medium">{MAANED_FULD[m].slice(0, 3)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
