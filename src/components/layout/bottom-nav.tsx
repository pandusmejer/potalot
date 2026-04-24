'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Sprout, Package, CalendarDays, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Mobile bottom-nav. Frøbank centralt og visuelt dominerende (spec-krav).
 * 5 destinationer. Ingen "mere"-menu — profil findes i topbar.
 */

const ITEMS = [
  { href: '/', label: 'Overblik', icon: LayoutDashboard },
  { href: '/mine-planter', label: 'Planter', icon: Sprout },
  { href: '/froebank', label: 'Frøbank', icon: Package, isHero: true },
  { href: '/kalender', label: 'Kalender', icon: CalendarDays },
  { href: '/guides', label: 'Guides', icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-pb">
      <div className="flex items-stretch justify-around h-16 relative">
        {ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          if (item.isHero) {
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
                'flex flex-col items-center justify-center gap-0.5 flex-1 text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span className={cn('text-[11px]', active && 'font-medium')}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
