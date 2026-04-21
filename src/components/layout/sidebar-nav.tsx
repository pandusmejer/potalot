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

const navItems = [
  { href: '/dashboard', label: 'Hjem', icon: Home, alias: ['/dashboard', '/'] },
  { href: '/have', label: 'Mine planter', icon: Sprout, alias: ['/have', '/froebank', '/vaekst', '/inventory', '/dyrkningslog'] },
  { href: '/calendar', label: 'Kalender', icon: CalendarDays, alias: ['/calendar'] },
  { href: '/viden', label: 'Viden', icon: BookOpen, alias: ['/viden', '/guides', '/community', '/ai'] },
]

export function SidebarNav() {
  const pathname = usePathname()

  function isActive(item: typeof navItems[number]) {
    return item.alias.some(a => pathname === a || pathname.startsWith(a + '/'))
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const active = isActive(item)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
