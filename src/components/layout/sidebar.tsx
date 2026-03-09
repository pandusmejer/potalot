'use client'

import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  StickyNote,
  Sparkles,
  Package,
  BookOpen,
  Settings,
  Sprout,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Overblik', icon: LayoutDashboard },
  { href: '/calendar', label: 'Kalender', icon: CalendarDays },
  { href: '/notes', label: 'Noter', icon: StickyNote },
  { href: '/ai', label: 'AI Assistent', icon: Sparkles },
  { href: '/inventory', label: 'Beholdning', icon: Package },
  { href: '/guides', label: 'Guides', icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:border-r lg:border-border lg:bg-card lg:h-screen lg:fixed lg:left-0 lg:top-0">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Sprout className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-foreground">PotAlot</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
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

      <div className="border-t border-border px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Indstillinger
        </Link>
      </div>
    </aside>
  )
}
