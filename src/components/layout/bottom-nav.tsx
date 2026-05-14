'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Notebook, Sprout, Package, CalendarDays, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  heroHref: '/froebank' | '/mine-planter'
  criticalTaskCount: number
}

const BASE_ITEMS = [
  { href: '/', label: 'Min havebog', icon: Notebook },
  { href: '/froebank', label: 'Frøbank', icon: Package },
  { href: '/mine-planter', label: 'Mine planter', icon: Sprout },
  { href: '/kalender', label: 'Kalender', icon: CalendarDays },
  { href: '/guides', label: 'Dyrkningsguides', icon: BookOpen },
] as const

/**
 * Mobile bottom-nav. Hero-item bestemmes dynamisk: nye brugere uden planter
 * får Frøbank fremhævet, brugere med aktive planter får Mine planter.
 * Kalender får badge med antal kritiske/forsinkede opgaver.
 */
export function BottomNav({ heroHref, criticalTaskCount }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-pb">
      <div className="flex items-stretch justify-around h-16 relative">
        {BASE_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          const isHero = item.href === heroHref
          const showBadge = item.href === '/kalender' && criticalTaskCount > 0

          if (isHero) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 relative z-10"
              >
                <span
                  className={cn(
                    'absolute -top-4 flex items-center justify-center h-14 w-14 rounded-full shadow-lg transition-all',
                    active
                      ? 'bg-primary text-primary-foreground scale-105'
                      : 'bg-accent-copper text-white hover:scale-105'
                  )}
                  style={{ backgroundColor: active ? 'var(--primary)' : 'var(--accent-copper)' }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span
                  className={cn(
                    'text-[10px] mt-10 font-medium uppercase tracking-wider',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 text-xs transition-colors relative',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full bg-primary" />
              )}
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span className={cn('text-[11px]', active && 'font-semibold')}>{item.label}</span>
              {showBadge && (
                <span className="absolute top-1 right-2 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[9px] font-medium rounded-full bg-destructive text-destructive-foreground">
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
