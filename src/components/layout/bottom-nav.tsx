'use client'

import { cn } from '@/lib/utils'
import {
  Home,
  Sprout,
  CalendarDays,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 4 destinationer i bottom-nav (relaunch fase 3)
const navItems = [
  { href: '/dashboard', label: 'Hjem', icon: Home, alias: ['/dashboard', '/'] },
  { href: '/have', label: 'Have', icon: Sprout, alias: ['/have', '/froebank', '/vaekst', '/inventory', '/dyrkningslog'] },
  { href: '/calendar', label: 'Kalender', icon: CalendarDays, alias: ['/calendar'] },
  { href: '/viden', label: 'Viden', icon: BookOpen, alias: ['/viden', '/guides', '/community', '/ai'] },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(item: typeof navItems[number]) {
    return item.alias.some(a => pathname === a || pathname.startsWith(a + '/'))
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors flex-1',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
