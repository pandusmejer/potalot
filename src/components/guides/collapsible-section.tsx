'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({ icon, title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left text-base font-semibold text-foreground border-b border-border pb-2 hover:text-primary transition-colors"
      >
        {icon}
        <span className="flex-1">{title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">{children}</div>}
    </section>
  )
}
