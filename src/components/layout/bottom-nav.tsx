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
  { href: '/', label: 'Havebog', icon: Notebook },
  { href: '/froebank', label: 'Frøbank', icon: Package },
  { href: '/mine-planter', label: 'Planter', icon: Sprout },
  { href: '/kalender', label: 'Kalender', icon: CalendarDays },
  { href: '/guides', label: 'Guides', icon: BookOpen },
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color-mix(in_oklab,var(--primary)_22%,var(--border))] backdrop-blur-md safe-area-pb"
      style={{ background: 'color-mix(in oklab, var(--card) 86%, var(--primary))' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--deco-gold), transparent)' }}
      />
      <div className="mx-auto flex w-full max-w-[480px] items-stretch justify-around h-16 relative">
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
                    'absolute flex items-center justify-center rounded-full transition-all',
                    // Aktiv = solid grøn FAB (tydeligt "du er her").
                    // Ikke-aktiv = rolig ghost-grøn, så hero-ikonet aldrig
                    // dominerer hierarkiet på en side det ikke hører til.
                    active
                      ? 'bg-primary text-primary-foreground shadow-lift scale-105'
                      : 'bg-[color-mix(in_oklab,var(--primary)_15%,var(--card))] text-primary shadow-soft ring-1 ring-[color-mix(in_oklab,var(--primary)_22%,transparent)] hover:scale-105'
                  )}
                  // ~11 % mindre end før (56 → 50 px) så hero-knappen ikke
                  // stjæler fokus fra indholdet.
                  style={{ top: -14, height: 50, width: 50 }}
                >
                  <Icon style={{ height: 21, width: 21 }} />
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium uppercase tracking-wider',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                  style={{ marginTop: 36 }}
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
