'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Sprout, Package, CalendarDays, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  heroHref: '/froebank' | '/mine-planter'
  criticalTaskCount: number
}

const BASE_ITEMS = [
  { href: '/', label: 'Overblik', icon: LayoutDashboard },
  { href: '/froebank', label: 'Frøbank', icon: Package },
  { href: '/mine-planter', label: 'Mine planter', icon: Sprout },
  { href: '/kalender', label: 'Havekalender', icon: CalendarDays },
  { href: '/guides', label: 'Dyrkningsguides', icon: BookOpen },
] as const

export function Sidebar({ heroHref, criticalTaskCount }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border lg:bg-card lg:h-screen lg:fixed lg:left-0 lg:top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Sprout className="h-6 w-6 text-primary" />
        <span className="font-serif text-2xl text-foreground">PotAlot</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
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
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 my-2 text-base font-medium border transition-all',
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-accent/40 border-border text-foreground hover:bg-accent hover:shadow-sm'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
              )}
              <Icon className={cn('h-4 w-4', active && 'stroke-[2.5]')} />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-medium rounded-full bg-destructive text-destructive-foreground">
                  {criticalTaskCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground italic">
          Frøbank = det du har.<br />
          Mine planter = det du dyrker.<br />
          Kalender = det du skal gøre.<br />
          Guides = hvordan og hvorfor.
        </p>
      </div>
    </aside>
  )
}
