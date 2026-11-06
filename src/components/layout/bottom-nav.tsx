'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getNavState } from '@/actions/nav-state'
import { harAuthCookie } from '@/lib/auth-cookie'
import {
  NotebookText, Sprout, Package, CalendarDays, BookOpen, ListChecks, MessageCircle,
} from 'lucide-react'
import { MVP_MODE, MVP_NAV, type MvpNavId } from '@/lib/mvp-config'

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

/** MVP 1.0: ikon pr. navigationspunkt (punkterne selv bor i mvp-config.ts). */
const MVP_IKONER: Record<MvpNavId, typeof Package> = {
  froebank: Package,
  planter: Sprout,
  opgaver: ListChecks,
  spoerg: MessageCircle,
}

/**
 * Hvilke punkter vises? MVP'en viser fire (mvp-config.ts); med
 * NEXT_PUBLIC_MVP_MODE=off vises de oprindelige fem (BASE_ITEMS) uændret.
 */
const NAV_ITEMS: readonly { href: string; label: string; icon: typeof Package }[] = MVP_MODE
  ? MVP_NAV.map((p) => ({ href: p.href, label: p.label, icon: MVP_IKONER[p.id] }))
  : BASE_ITEMS

/**
 * Trykflader og typografi. MVP'en bruger store, lige brede felter (accepttest
 * 6/11: de gamle var for tætte og svære at ramme); med MVP slået fra er
 * størrelserne præcis som før.
 */
const STIL = MVP_MODE
  ? {
      raekke: 'mx-auto flex w-full max-w-[390px] items-stretch gap-0.5 px-1.5 pb-1 pt-1.5',
      felt: 'relative flex min-h-[60px] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 no-underline',
      ikon: 24,
      ikonStreg: { aktiv: 2.3, inaktiv: 2.0 },
      tekst: 'whitespace-nowrap text-[12px] leading-none',
      vaegt: { aktiv: 700, inaktiv: 500 },
      badge: 'absolute right-3 top-1.5',
    }
  : {
      raekke: 'mx-auto flex w-full max-w-[390px] items-stretch justify-around px-1.5 py-1',
      felt: 'relative flex flex-1 flex-col items-center justify-center gap-[3px] rounded-2xl py-1',
      ikon: 21,
      ikonStreg: { aktiv: 2.3, inaktiv: 2.1 },
      tekst: 'whitespace-nowrap text-[10px]',
      vaegt: { aktiv: 600, inaktiv: 500 },
      badge: 'absolute right-1.5 top-0',
    }

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
export function BottomNav({ criticalTaskCount: initialCount }: Props) {
  const pathname = usePathname()
  const [criticalTaskCount, setCriticalTaskCount] = useState(initialCount)

  // Statiske sider bager 0 ind (build uden cookies) — hent det rigtige tal
  // efter mount, men kun for logget ind-brugere og kun når serveren gav 0.
  useEffect(() => {
    if (initialCount !== 0 || !harAuthCookie()) return
    let active = true
    getNavState()
      .then(nav => { if (active) setCriticalTaskCount(nav.criticalTaskCount) })
      .catch(() => {})
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 safe-area-pb"
      style={{ background: NAV.bg, borderTop: `1px solid ${NAV.border}` }}
    >
      <div className={STIL.raekke}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          const showBadge = item.href === '/kalender' && criticalTaskCount > 0
          const color = active ? NAV.active : NAV.inactive

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={STIL.felt}
              style={{ background: active ? NAV.activeBg : 'transparent' }}
            >
              <Icon
                style={{ height: STIL.ikon, width: STIL.ikon, color }}
                strokeWidth={active ? STIL.ikonStreg.aktiv : STIL.ikonStreg.inaktiv}
                aria-hidden
              />
              <span
                className={STIL.tekst}
                style={{ color, fontWeight: active ? STIL.vaegt.aktiv : STIL.vaegt.inaktiv, letterSpacing: '0.01em' }}
              >
                {item.label}
              </span>
              {showBadge && (
                <span
                  className={`${STIL.badge} inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold`}
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
