'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  NotebookText, Sprout, Package, CalendarDays, BookOpen,
} from 'lucide-react'

interface Props {
  criticalTaskCount: number
}

/**
 * Bundnavigations-palet (Annas spec) — dæmpet olivengrøn i Havebog-creme,
 * så navigationen ligner en diskret sokkel, ikke et dashboard.
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
 * Mobile bottom-nav. Navigationen svarer på ÉT spørgsmål: hvor står jeg nu?
 * - Fem ligestillede elementer, ingen center-FAB, ingen orange indikator.
 * - Præcis ÉN fremhævelse ad gangen = aktiv side (lys salvie-capsule).
 * - Ingen sekundær ny-bruger-tilstand: fokus på Frøbank for nye brugere
 *   håndteres af routing/tomtilstand/CTA, aldrig som pynt på et inaktivt
 *   menupunkt.
 * - Kompakt sokkel: lav capsule, tungere ikon-stroke (primært anker nu
 *   hvor capsule/streg er væk).
 */
export function BottomNav({ criticalTaskCount }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 safe-area-pb"
      style={{ background: NAV.bg, borderTop: `1px solid ${NAV.border}` }}
    >
      <div className="mx-auto flex w-full max-w-[390px] items-stretch justify-around px-1.5 py-1">
        {BASE_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          const showBadge = item.href === '/kalender' && criticalTaskCount > 0
          const color = active ? NAV.active : NAV.inactive

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-[3px] rounded-2xl py-1"
              style={{ background: active ? NAV.activeBg : 'transparent' }}
            >
              <Icon
                style={{ height: 21, width: 21, color }}
                strokeWidth={active ? 2.3 : 2.1}
              />
              <span
                className="whitespace-nowrap text-[10px]"
                style={{ color, fontWeight: active ? 600 : 500, letterSpacing: '0.01em' }}
              >
                {item.label}
              </span>
              {showBadge && (
                <span
                  className="absolute right-1.5 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold"
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
