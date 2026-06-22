'use client'

/**
 * "FroebankBrowser" — wrapper omkring filter/sortering-modul +
 * den nye InventoryArchiveStack.
 *
 * Filter-state lever lokalt her; den filtrerede inventory sendes ned
 * til ArchiveStack så det øverste hero-kort + stak-kort altid
 * matcher den valgte kategori/søgning/smart-filter.
 *
 * Filter-logikken er kopieret fra den oprindelige InventoryListView
 * (samme UX som før), men kort-rendering er flyttet til
 * InventoryArchiveStack med dens nye folder-baserede layout.
 */

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { InventoryArchiveStack } from './inventory-archive-stack'
import { SeedBankFolderPanel } from './seed-bank-folder-panel'
import {
  SlidersHorizontal,
  BookOpen,
  Clock,
  Image as ImageIcon,
  AlertTriangle,
  ArrowDownAZ,
  ArrowDownZA,
} from 'lucide-react'
import type {
  InventoryItem,
  PrimaryCategoryId,
  Subcategory,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  inventory: InventoryItem[]
  customSubcategories?: Subcategory[]
}

type SmartFilter =
  | 'mangler-guide'
  | 'udloeber-snart'
  | 'mangler-billede'
  | 'naesten-tom'

const VALID_SMART_FILTERS: SmartFilter[] = [
  'mangler-guide',
  'udloeber-snart',
  'mangler-billede',
  'naesten-tom',
]

export function FroebankBrowser({ inventory }: Props) {
  const searchParams = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<PrimaryCategoryId>('fro')
  const [search, setSearch] = useState('')
  const [subcat, setSubcat] = useState<string>('alle')
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Sorteringsorden: 'standard' (pinned→favorit→alfabetisk),
  // 'az' (A→Å) eller 'za' (Å→A).
  const [sortOrder, setSortOrder] = useState<'standard' | 'az' | 'za' | 'recent'>('standard')
  const [smartFilters, setSmartFilters] = useState<Set<SmartFilter>>(() => {
    const f = searchParams.get('filter')
    if (f && (VALID_SMART_FILTERS as string[]).includes(f))
      return new Set([f as SmartFilter])
    return new Set()
  })

  // Reagér hvis filter-query ændres mens komponenten lever (fx fra
  // notifikations-klik). setState i microtask + cancel-guard for at
  // undgå cascading renders / opdatering efter unmount.
  useEffect(() => {
    const f = searchParams.get('filter')
    if (!f || !(VALID_SMART_FILTERS as string[]).includes(f)) return
    let active = true
    Promise.resolve().then(() => {
      if (!active) return
      setSmartFilters((prev) => {
        if (prev.has(f as SmartFilter)) return prev
        const next = new Set(prev)
        next.add(f as SmartFilter)
        return next
      })
    })
    return () => {
      active = false
    }
  }, [searchParams])

  function toggleSmart(f: SmartFilter) {
    setSmartFilters((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  // Filter-logik: kategori → underkategori → smart-filtre → fritekst.
  // Sortér til sidst: pinned først, så favoritter, så alfabetisk på navn.
  const filtered = useMemo(() => {
    let list = inventory

    if (activeCategory === 'favoritter') {
      list = list.filter((i) => i.isFavorite)
    } else {
      list = list.filter((i) => i.primaryCategoryId === activeCategory)
    }

    if (subcat !== 'alle') {
      list = list.filter((i) => i.subcategoryId === subcat)
    }

    if (smartFilters.has('mangler-guide')) {
      list = list.filter((i) => !i.guideId)
    }
    if (smartFilters.has('mangler-billede')) {
      list = list.filter((i) => !i.primaryImageId)
    }
    if (smartFilters.has('udloeber-snart')) {
      // Heuristik: frø ældre end 2 år regnes "snart-udløbet".
      const now = new Date()
      list = list.filter((i) => {
        if (!i.purchaseYear) return false
        return now.getFullYear() - i.purchaseYear >= 2
      })
    }
    if (smartFilters.has('naesten-tom')) {
      list = list.filter((i) => {
        const remaining = i.seedsRemaining ?? i.seedCount ?? 0
        return remaining > 0 && remaining < 5
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) => {
        const hay = [i.name, i.latinName, i.variety, i.supplier, i.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }

    const byName = (a: InventoryItem, b: InventoryItem) =>
      a.name.localeCompare(b.name, 'da')
    const byCreatedAt = (a: InventoryItem, b: InventoryItem) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? '')

    if (sortOrder === 'recent') return [...list].sort(byCreatedAt)
    if (sortOrder === 'az') return [...list].sort(byName)
    if (sortOrder === 'za') return [...list].sort((a, b) => byName(b, a))

    // standard: pinned først, så favoritter, derefter alfabetisk
    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      return byName(a, b)
    })
  }, [inventory, activeCategory, subcat, search, smartFilters, sortOrder])

  const latestInventoryItem = useMemo(() => {
    const withDates = inventory.filter((i) => i.createdAt)
    if (withDates.length > 0) {
      return [...withDates].sort((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
      )[0]
    }
    return inventory[0] ?? null
  }, [inventory])

  const latestItemName = latestInventoryItem
    ? latestInventoryItem.variety
      ? `${latestInventoryItem.name} ${latestInventoryItem.variety}`
      : latestInventoryItem.name
    : 'Salat Crispy Mint'

  const latestItemTimeLabel = latestInventoryItem?.createdAt
    ? (() => {
        const days = Math.max(
          0,
          Math.floor((Date.now() - new Date(latestInventoryItem.createdAt).getTime()) / 86_400_000),
        )
        if (days === 0) return 'i dag'
        if (days === 1) return 'i går'
        return `${days} dage siden`
      })()
    : '2 dage siden'

  const categoryCounts = useMemo(() => {
    function count(id: PrimaryCategoryId) {
      return inventory.filter((item) => item.primaryCategoryId === id).length
    }
    return [
      { id: 'fro', label: 'Frø', count: count('fro') },
      { id: 'loeg', label: 'Løg', count: count('loeg') },
      { id: 'knolde', label: 'Knolde', count: count('knolde') },
      { id: 'buske', label: 'Buske', count: count('buske') },
      { id: 'traeer', label: 'Træer', count: count('traeer') },
      { id: 'stauder', label: 'Stauder', count: count('stauder') },
    ]
  }, [inventory])

  const totalSeeds = inventory.reduce((sum, item) => {
    const remaining = item.seedsRemaining ?? item.seedCount ?? 0
    return sum + remaining
  }, 0)
  const expiringSoonCount = inventory.filter((item) => {
    if (!item.purchaseYear) return false
    return new Date().getFullYear() - item.purchaseYear >= 2
  }).length

  const activeFolderFilter = smartFilters.has('udloeber-snart')
    ? 'udloeber-snart'
    : sortOrder === 'recent'
      ? 'senest-tilfoejet'
      : 'alle'

  function handleFolderFilterChange(filterId: string) {
    if (filterId === 'udloeber-snart') {
      setSortOrder('standard')
      setSmartFilters(new Set(['udloeber-snart']))
      return
    }
    if (filterId === 'senest-tilfoejet') {
      setSmartFilters(new Set())
      setSortOrder('recent')
      return
    }
    setSmartFilters(new Set())
    setSortOrder('standard')
  }

  return (
    // Bryd let ud af app'ens 16px-gutter, så mappe-stakken bliver bredere
    // (folder + kort følges ad). Beholder ~8px luft i hver side til
    // folder-skyggen — ingen forælder klipper vandret, og skygger er paint-only,
    // så intet skæres og der opstår ikke vandret scroll.
    <div className="space-y-4 -mx-1.5">
      <SeedBankFolderPanel
        totalSeeds={totalSeeds}
        totalVarieties={inventory.length}
        expiringSoonCount={expiringSoonCount}
        recentItemName={latestItemName}
        recentItemTimeLabel={latestItemTimeLabel}
        activeCategory={activeCategory}
        categories={categoryCounts}
        activeFilter={activeFolderFilter}
        searchValue={search}
        onSearchChange={setSearch}
        onFilterClick={() => setFiltersOpen((v) => !v)}
        onCategoryChange={(categoryId) => {
          setActiveCategory(categoryId as PrimaryCategoryId)
          setSubcat('alle')
        }}
        onFilterChange={handleFolderFilterChange}
      />

      {/* Filter-panel — 6 chips i et 3-kolonne grid (3 pr. linje).
          De 4 første er smart-filtre; de 2 sidste er sorterings-
          toggles (alfabetisk A–Å / Å–A, gensidigt udelukkende). */}
      {filtersOpen && (
        <div className="rounded-2xl border border-border bg-card/60 p-3">
          <div className="grid grid-cols-3 gap-2">
            <FilterChip
              icon={<BookOpen className="h-3 w-3" />}
              label="Mangler guide"
              active={smartFilters.has('mangler-guide')}
              onClick={() => toggleSmart('mangler-guide')}
              fullWidth
            />
            <FilterChip
              icon={<Clock className="h-3 w-3" />}
              label="Udløber snart"
              active={smartFilters.has('udloeber-snart')}
              onClick={() => toggleSmart('udloeber-snart')}
              fullWidth
            />
            <FilterChip
              icon={<ImageIcon className="h-3 w-3" />}
              label="Mangler billede"
              active={smartFilters.has('mangler-billede')}
              onClick={() => toggleSmart('mangler-billede')}
              fullWidth
            />
            <FilterChip
              icon={<AlertTriangle className="h-3 w-3" />}
              label="Næsten tom"
              active={smartFilters.has('naesten-tom')}
              onClick={() => toggleSmart('naesten-tom')}
              fullWidth
            />
            <FilterChip
              icon={<ArrowDownAZ className="h-3 w-3" />}
              label="Alfabetisk A–Å"
              active={sortOrder === 'az'}
              onClick={() =>
                setSortOrder((o) => (o === 'az' ? 'standard' : 'az'))
              }
              fullWidth
            />
            <FilterChip
              icon={<ArrowDownZA className="h-3 w-3" />}
              label="Alfabetisk Å–A"
              active={sortOrder === 'za'}
              onClick={() =>
                setSortOrder((o) => (o === 'za' ? 'standard' : 'za'))
              }
              fullWidth
            />
          </div>
        </div>
      )}

      {/* Den filtrerede inventory sendes ned til archive-stak. */}
      <InventoryArchiveStack inventory={filtered} />
    </div>
  )
}

function FilterChip({
  icon,
  label,
  active,
  onClick,
  fullWidth = false,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  fullWidth?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full text-xs font-medium border transition-colors',
        fullWidth && 'w-full',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}
