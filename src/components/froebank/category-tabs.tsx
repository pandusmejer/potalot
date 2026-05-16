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
    <div className="overflow-x-auto -mx-4 px-4 pb-2">
      <div className="flex gap-2 min-w-max">
        {PRIMARY_CATEGORY_IDS.map(id => {
          const cat = PRIMARY_CATEGORIES[id]
          const Icon = ((LucideIcons as unknown) as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[cat.icon]
          const isActive = active === id
          const c = count(id)

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
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
    </div>
  )
}
