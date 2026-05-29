'use client'

import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS } from '@/lib/constants'
import type { PrimaryCategoryId, InventoryItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

interface Props {
  active: PrimaryCategoryId
  onChange: (id: PrimaryCategoryId) => void
  inventory: InventoryItem[]
}

/**
 * Niveau 1: Primære kategorier som horisontale tabs.
 */
export function CategoryTabs({ active, onChange, inventory }: Props) {
  function count(id: PrimaryCategoryId): number {
    if (id === 'favoritter') return inventory.filter(i => i.isFavorite).length
    return inventory.filter(i => i.primaryCategoryId === id).length
  }

  return (
    // Swipebar — IKKE en overflow-container med synlig scrollbar.
    //   • scrollbar-hide: skjuler scrollbaren 100 %
    //   • mask-image: bløde fade-kanter i venstre/højre side, så
    //     "der er mere → swipe" kommunikeres intuitivt
    //   • scroll-snap: kortene snapper på plads
    //   • -webkit-overflow-scrolling: touch → inertial momentum
    //   • kortene har fast bredde, så det næste kort peeker ind
    <div
      className="scrollbar-hide -mx-4 flex gap-[14px] overflow-x-auto px-6 pb-2"
      style={{
        scrollSnapType: 'x proximity',
        WebkitOverflowScrolling: 'touch',
        maskImage:
          'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
      }}
    >
      {PRIMARY_CATEGORY_IDS.map(id => {
        const cat = PRIMARY_CATEGORIES[id]
        const Icon = ((LucideIcons as unknown) as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[cat.icon]
        const isActive = active === id
        const c = count(id)

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{ scrollSnapAlign: 'start', flex: '0 0 auto' }}
            className={cn(
              'flex min-w-[88px] flex-col items-center gap-1 rounded-2xl border px-4 py-3 transition-all',
              isActive
                ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                : 'border-border bg-card text-foreground hover:bg-secondary'
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
            <span className="text-xs font-medium leading-tight text-center">
              {cat.name}
            </span>
            <span className={cn('text-[10px]', isActive ? 'opacity-80' : 'text-muted-foreground')}>
              {c}
            </span>
          </button>
        )
      })}
    </div>
  )
}
