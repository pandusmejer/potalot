'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, Lightbulb, Settings, Sparkles } from 'lucide-react'

export function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Profil"
        className="flex items-center justify-center h-9 w-9 rounded-full bg-muted hover:bg-muted/80 transition-colors"
      >
        <User className="h-4 w-4 text-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[180px] bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <Link
            href="/idetavle"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            Idétavle
          </Link>
          <Link
            href="/ai"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            AI-rådgiver
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors border-t border-border"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Indstillinger
          </Link>
        </div>
      )}
    </div>
  )
}
