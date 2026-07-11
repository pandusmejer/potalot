'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  NotebookText, Sprout, Package, CalendarDays, BookOpen,
} from 'lucide-react'

interface Props {
  heroHref: '/froebank' | '/mine-planter'
  criticalTaskCount: number
}

/**
 * Bundnavigations-palet (Annas spec, 11/7) — dæmpet olivengrøn i Havebog-
 * creme, så navigationen ligner resten af appen i stedet for at råbe.
 */
const NAV = {
  bg: '#F4F1E6',
  border: '#DDD6C7',
  activeBg: '#E1E5D6',
  active: '#556240',
  inactive: '#7D8372',
} as const

/** Havebog og Guides må ALDRIG dele ikon — journal vs. opslagsværk.
 *  NotebookText (linjeret journal) ≠ BookOpen (åbent opslagsværk). */
const BASE_ITEMS = [
  { href: '/', label: 'Havebog', icon: NotebookText },
  { href: '/froebank', label: 'Frøbank', icon: Package },
  { href: '/mine-planter', label: 'Planter', icon: Sprout },
  { href: '/kalender', label: 'Kalender', icon: CalendarDays },
  { href: '/guides', label: 'Guides', icon: BookOpen },
] as const

/**
 * Mobile bottom-nav. Redesign 11/7 (Annas retning):
 * - Ingen center-FAB, ingen orange indikator — 5 lige elementer.
 * - Aktiv side = lys salvie-capsule (ikke top-streg, ikke løftet knap).
 * - Ens typografi (Title Case, ingen uppercase-blanding).
 * - Frøbank prioriteres for NYE brugere (heroHref === '/froebank'): en
 *   diskret salvie-ring + mid-sage farve trækker øjet dertil uden at
 *   efterligne den fyldte aktiv-capsule. Forsvinder når brugeren er
 *   etableret (så bliver heroHref '/mine-planter').
 */
export function BottomNav({ heroHref, criticalTaskCount }: Props) {
  const pathname = usePathname()
  const froebankPriority = heroHref === '/froebank'

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 safe-area-pb"
      style={{ background: NAV.bg, borderTop: `1px solid ${NAV.border}` }}
    >
      <div className="mx-auto flex w-full max-w-[390px] items-stretch justify-around px-1.5 pt-1.5 pb-1">
        {BASE_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          const showBadge = item.href === '/kalender' && criticalTaskCount > 0
          // Ny-bruger-hint: kun på Frøbank, kun når den ikke allerede er aktiv.
          const hint = froebankPriority && item.href === '/froebank' && !active
          const color = active || hint ? NAV.active : NAV.inactive

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5"
              style={{
                background: active ? NAV.activeBg : 'transparent',
                boxShadow: hint ? `inset 0 0 0 1px rgba(85,98,64,0.28)` : 'none',
              }}
            >
              <Icon
                style={{ height: 21, width: 21, color }}
                strokeWidth={active ? 2.1 : 1.8}
              />
              <span
                className="whitespace-nowrap text-[10px]"
                style={{ color, fontWeight: active ? 600 : 500, letterSpacing: '0.01em' }}
              >
                {item.label}
              </span>
              {showBadge && (
                <span
                  className="absolute right-1.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold"
                  style={{ background: '#B4694A', color: '#FBF3E7' }}
                >
                  {criticalTaskCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
