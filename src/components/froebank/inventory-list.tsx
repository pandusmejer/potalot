'use client'

import { useState, useMemo } from 'react'
import { CategoryTabs } from './category-tabs'
import { InventoryCard } from './inventory-card'
import { AddInventoryDialog } from './add-inventory-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, Filter, Star, Pin, Plus, Package } from 'lucide-react'
import { SYSTEM_SUBCATEGORIES } from '@/lib/constants'
import { MOCK_CUSTOM_SUBCATEGORIES } from '@/lib/mock-data'
import type { InventoryItem, PrimaryCategoryId, Subcategory } from '@/lib/types'

interface Props {
  inventory: InventoryItem[]
  customSubcategories?: Subcategory[]
}

export function InventoryListView({ inventory, customSubcategories = MOCK_CUSTOM_SUBCATEGORIES }: Props) {
  const [activeCategory, setActiveCategory] = useState<PrimaryCategoryId>('fro')
  const [search, setSearch] = useState('')
  const [subcat, setSubcat] = useState<string>('alle')
  const [favoritFilter, setFavoritFilter] = useState(false)
  const [pinFilter, setPinFilter] = useState(false)

  // Vis underkategorier kun for valgte primær (system + brugerskabte)
  const tilgaengeligeSubs = useMemo(() => {
    const all: Subcategory[] = [...SYSTEM_SUBCATEGORIES, ...customSubcategories]
    return all.filter(s => s.parentCategoryIds.includes(activeCategory))
  }, [activeCategory, customSubcategories])

  const filtered = useMemo(() => {
    let list = inventory

    // Niveau 1
    if (activeCategory === 'favoritter') {
      list = list.filter(i => i.isFavorite)
    } else {
      list = list.filter(i => i.primaryCategoryId === activeCategory)
    }

    // Niveau 2
    if (subcat !== 'alle') {
      list = list.filter(i => i.subcategoryId === subcat)
    }

    if (favoritFilter) list = list.filter(i => i.isFavorite)
    if (pinFilter) list = list.filter(i => i.isPinned)

    // Søgning
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.variety?.toLowerCase().includes(q) ||
        i.supplier?.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      )
    }

    // Sortering: pinnede først, så favoritter, så alfabetisk
    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      return a.name.localeCompare(b.name, 'da')
    })
  }, [inventory, activeCategory, subcat, search, favoritFilter, pinFilter])

  return (
    <div className="space-y-4">
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} inventory={inventory} />

      {/* Søg + filter-bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg navn, sort eller leverandør"
            className="pl-9"
          />
        </div>

        {tilgaengeligeSubs.length > 0 && (
          <select
            value={subcat}
            onChange={e => setSubcat(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-card text-sm"
          >
            <option value="alle">Alle underkategorier</option>
            {tilgaengeligeSubs.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}{!s.isSystem ? ' (egen)' : ''}
              </option>
            ))}
          </select>
        )}

        <Button
          variant={favoritFilter ? 'default' : 'outline'}
          size="default"
          onClick={() => setFavoritFilter(v => !v)}
          aria-label="Vis kun favoritter"
        >
          <Star className="h-4 w-4" />
        </Button>
        <Button
          variant={pinFilter ? 'default' : 'outline'}
          size="default"
          onClick={() => setPinFilter(v => !v)}
          aria-label="Vis kun fastgjorte"
        >
          <Pin className="h-4 w-4" />
        </Button>

        <AddInventoryDialog>
          <Button>
            <Plus className="h-4 w-4" />
            Tilføj
          </Button>
        </AddInventoryDialog>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={search.trim() ? <Filter className="h-8 w-8" /> : <Package className="h-8 w-8" />}
          title={search.trim() ? 'Ingen resultater' : 'Ingen elementer her endnu'}
          description={
            search.trim()
              ? 'Prøv et andet søgeord.'
              : 'Brug "Tilføj" knappen for at lægge noget i frøbanken.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => <InventoryCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
