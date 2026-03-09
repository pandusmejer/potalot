'use client'

import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  StickyNote,
  Sparkles,
  Package,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Overblik', icon: LayoutDashboard },
  { href: '/calendar', label: 'Kalender', icon: CalendarDays },
  { href: '/notes', label: 'Noter', icon: StickyNote },
  { href: '/ai', label: 'AI', icon: Sparkles },
  { href: '/inventory', label: 'Beholdning', icon: Package },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
