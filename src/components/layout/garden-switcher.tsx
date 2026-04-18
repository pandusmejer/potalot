'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, MapPin, Check } from 'lucide-react'
import { setDefaultGarden } from '@/actions/gardens'
import { useRouter } from 'next/navigation'
import type { Garden } from '@/lib/types'

export function GardenSwitcher({ gardens }: { gardens: Garden[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const active = gardens.find(g => g.is_default) ?? gardens[0]

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [open])

  if (!active) return null

  async function pickGarden(id: string) {
    setOpen(false)
    await setDefaultGarden(id)
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-muted transition-colors"
      >
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground max-w-[120px] truncate">{active.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[180px] bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {gardens.map(g => (
            <button
              key={g.id}
              onClick={() => pickGarden(g.id)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
            >
              <span className="flex-1">{g.name}</span>
              {g.id === active.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
