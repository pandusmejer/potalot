'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CategoryTabs } from './category-tabs'
import { InventoryCard } from './inventory-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Search, Filter, Star, Plus, Package, X, Trash2, CheckSquare,
  Image as ImageIcon, BookOpen, Clock, AlertTriangle,
} from 'lucide-react'
import { SYSTEM_SUBCATEGORIES } from '@/lib/constants'
import type { InventoryItem, PrimaryCategoryId, Subcategory } from '@/lib/types'
import { bulkDeleteInventoryItems, bulkUpdateInventoryItems } from '@/actions/froebank'
import { cn } from '@/lib/utils'

interface Props {
  inventory: InventoryItem[]
  customSubcategories?: Subcategory[]
}

type SmartFilter = 'mangler-guide' | 'udloeber-snart' | 'mangler-billede' | 'naesten-tom'

const VALID_SMART_FILTERS: SmartFilter[] = ['mangler-guide', 'udloeber-snart', 'mangler-billede', 'naesten-tom']

export function InventoryListView({ inventory, customSubcategories = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [activeCategory, setActiveCategory] = useState<PrimaryCategoryId>('fro')
  const [search, setSearch] = useState('')
  const [subcat, setSubcat] = useState<string>('alle')
  const [smartFilters, setSmartFilters] = useState<Set<SmartFilter>>(() => {
    const f = searchParams.get('filter')
    if (f && (VALID_SMART_FILTERS as string[]).includes(f)) return new Set([f as SmartFilter])
    return new Set()
  })
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Reagér hvis filter-query ændres mens komponenten lever (fx fra notifikations-klik)
  useEffect(() => {
    const f = searchParams.get('filter')
    if (f && (VALID_SMART_FILTERS as string[]).includes(f)) {
      setSmartFilters(prev => {
        if (prev.has(f as SmartFilter)) return prev
        const next = new Set(prev)
        next.add(f as SmartFilter)
        return next
      })
    }
  }, [searchParams])

  const tilgaengeligeSubs = useMemo(() => {
    const all: Subcategory[] = [...SYSTEM_SUBCATEGORIES, ...customSubcategories]
    return all.filter(s => s.parentCategoryIds.includes(activeCategory))
  }, [activeCategory, customSubcategories])

  function toggleSmart(f: SmartFilter) {
    setSmartFilters(prev => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  function toggleSelected(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
  }

  const filtered = useMemo(() => {
    let list = inventory

    if (activeCategory === 'favoritter') {
      list = list.filter(i => i.isFavorite)
    } else {
      list = list.filter(i => i.primaryCategoryId === activeCategory)
    }

    if (subcat !== 'alle') list = list.filter(i => i.subcategoryId === subcat)

    // Smart filters
    if (smartFilters.has('mangler-guide')) list = list.filter(i => !i.guideId)
    if (smartFilters.has('mangler-billede')) list = list.filter(i => i.imageIds.length === 0)
    if (smartFilters.has('udloeber-snart')) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() + 90)
      const cutoffStr = cutoff.toISOString().split('T')[0]
      list = list.filter(i => i.expiryDate && i.expiryDate <= cutoffStr)
    }
    if (smartFilters.has('naesten-tom')) {
      list = list.filter(i =>
        i.seedCount != null && (i.seedsRemaining ?? i.seedCount) <= 5
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.latinName?.toLowerCase().includes(q) ||
        i.variety?.toLowerCase().includes(q) ||
        i.supplier?.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      return a.name.localeCompare(b.name, 'da')
    })
  }, [inventory, activeCategory, subcat, search, smartFilters])

  const allFilteredSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id))

  function selectAll() {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(i => next.delete(i.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(i => next.add(i.id))
        return next
      })
    }
  }

  function handleBulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`Slet ${selected.size} elementer? Dette kan ikke fortrydes.`)) return
    startTransition(async () => {
      await bulkDeleteInventoryItems(Array.from(selected))
      exitSelectMode()
      router.refresh()
    })
  }

  function handleBulkFavorite(value: boolean) {
    if (selected.size === 0) return
    startTransition(async () => {
      await bulkUpdateInventoryItems(Array.from(selected), { isFavorite: value })
      exitSelectMode()
      router.refresh()
    })
  }

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
            placeholder="Søg navn, latinsk, sort, leverandør, noter"
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
          variant={selectMode ? 'default' : 'outline'}
          size="default"
          onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
          aria-label="Vælg flere"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>

        {!selectMode && (
          <Button asChild>
            <Link href="/froebank/tilfoej">
              <Plus className="h-4 w-4" />
              Tilføj
            </Link>
          </Button>
        )}
      </div>

      {/* Smart-filter chips */}
      <div className="flex gap-2 flex-wrap">
        <FilterChip
          icon={<BookOpen className="h-3 w-3" />}
          label="Mangler guide"
          active={smartFilters.has('mangler-guide')}
          onClick={() => toggleSmart('mangler-guide')}
        />
        <FilterChip
          icon={<Clock className="h-3 w-3" />}
          label="Udløber snart"
          active={smartFilters.has('udloeber-snart')}
          onClick={() => toggleSmart('udloeber-snart')}
        />
        <FilterChip
          icon={<ImageIcon className="h-3 w-3" />}
          label="Mangler billede"
          active={smartFilters.has('mangler-billede')}
          onClick={() => toggleSmart('mangler-billede')}
        />
        <FilterChip
          icon={<AlertTriangle className="h-3 w-3" />}
          label="Næsten tom"
          active={smartFilters.has('naesten-tom')}
          onClick={() => toggleSmart('naesten-tom')}
        />
        {smartFilters.size > 0 && (
          <button
            type="button"
            onClick={() => setSmartFilters(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Ryd
          </button>
        )}
      </div>

      {/* Bulk action-bar */}
      {selectMode && (
        <div className="flex items-center gap-2 flex-wrap p-3 bg-secondary/40 rounded-xl border border-border">
          <span className="text-sm font-medium">
            {selected.size} valgt
          </span>
          <Button variant="ghost" size="sm" onClick={selectAll}>
            {allFilteredSelected ? 'Fjern valg' : 'Vælg alle synlige'}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" disabled={selected.size === 0 || pending} onClick={() => handleBulkFavorite(true)}>
            <Star className="h-3.5 w-3.5" />
            Favorit
          </Button>
          <Button variant="outline" size="sm" disabled={selected.size === 0 || pending} onClick={() => handleBulkFavorite(false)}>
            Fjern favorit
          </Button>
          <Button variant="destructive" size="sm" disabled={selected.size === 0 || pending} onClick={handleBulkDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            Slet
          </Button>
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={search.trim() || smartFilters.size > 0 ? <Filter className="h-8 w-8" /> : <Package className="h-8 w-8" />}
          title={search.trim() || smartFilters.size > 0 ? 'Ingen resultater' : 'Ingen elementer her endnu'}
          description={
            search.trim() || smartFilters.size > 0
              ? 'Prøv at justere søgning eller filtre.'
              : 'Brug "Tilføj" knappen for at lægge noget i frøbanken.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              {selectMode && (
                <button
                  type="button"
                  onClick={() => toggleSelected(item.id)}
                  className={cn(
                    'h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    selected.has(item.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                  )}
                  aria-label={selected.has(item.id) ? 'Fjern fra valg' : 'Vælg'}
                >
                  {selected.has(item.id) && <CheckSquare className="h-3.5 w-3.5" />}
                </button>
              )}
              <div className="flex-1 min-w-0">
                <InventoryCard item={item} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
      )}
    >
      {icon}
      {label}
    </button>
  )
}
