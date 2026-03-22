'use client'

import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wheat,
  Sprout,
  CalendarDays,
  MoreHorizontal,
  BookOpen,
  Users,
  Lightbulb,
  ClipboardList,
  Sparkles,
  Settings,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

const primaryItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/froebank', label: 'Frøbank', icon: Wheat },
  { href: '/vaekst', label: 'Vækst', icon: Sprout },
  { href: '/calendar', label: 'Kalender', icon: CalendarDays },
]

const moreItems = [
  { href: '/guides', label: 'Guides', icon: BookOpen },
  { href: '/dyrkningslog', label: 'Dyrkningslog', icon: ClipboardList },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/idetavle', label: 'Idétavle', icon: Lightbulb },
  { href: '/ai', label: 'AI Assistent', icon: Sparkles },
  { href: '/settings', label: 'Indstillinger', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [moreOpen])

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm safe-area-pb">
      {moreOpen && (
        <div ref={menuRef} className="absolute bottom-full left-0 right-0 border-t border-border bg-card shadow-lg">
          <div className="grid grid-cols-3 gap-1 p-3">
            {moreItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-xs transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-around h-16">
        {primaryItems.map((item) => {
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
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
            isMoreActive || moreOpen ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {moreOpen ? (
            <X className="h-5 w-5 stroke-[2.5]" />
          ) : (
            <MoreHorizontal className={cn('h-5 w-5', isMoreActive && 'stroke-[2.5]')} />
          )}
          <span>Mere</span>
        </button>
      </div>
    </nav>
  )
}
