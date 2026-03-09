'use client'

import { Sprout } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-30">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Sprout className="h-5 w-5 text-primary" />
        <span className="font-bold text-foreground">PotAlot</span>
      </Link>
    </header>
  )
}
