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
  FilterBottomSheet,
  type SmartFilter,
  type SortOrder,
} from './filter-bottom-sheet'
import type {
  InventoryItem,
  PrimaryCategoryId,
  Subcategory,
} from '@/lib/types'

interface Props {
  inventory: InventoryItem[]
  customSubcategories?: Subcategory[]
}

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
  const [sortOrder, setSortOrder] = useState<SortOrder>('standard')
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
    const byExpiry = (a: InventoryItem, b: InventoryItem) =>
      (a.purchaseYear ?? Infinity) - (b.purchaseYear ?? Infinity)

    if (sortOrder === 'recent') return [...list].sort(byCreatedAt)
    if (sortOrder === 'expiry') return [...list].sort(byExpiry)
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

  // Aktive AVANCEREDE filtre (dem der ikke allerede vises af den simple
  // chip-række Alle/Udløber snart/Senest tilføjet) → små chips i mappen.
  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string }[] = []
    if (smartFilters.has('mangler-billede'))
      chips.push({ id: 'mangler-billede', label: 'Mangler billede' })
    if (smartFilters.has('mangler-guide'))
      chips.push({ id: 'mangler-guide', label: 'Mangler guide' })
    if (smartFilters.has('naesten-tom'))
      chips.push({ id: 'naesten-tom', label: 'Næsten tom' })
    if (sortOrder === 'az') chips.push({ id: 'sort-az', label: 'A–Å' })
    if (sortOrder === 'za') chips.push({ id: 'sort-za', label: 'Å–A' })
    if (sortOrder === 'expiry')
      chips.push({ id: 'sort-expiry', label: 'Udløber snart' })
    return chips
  }, [smartFilters, sortOrder])

  function removeFilterChip(id: string) {
    if (id.startsWith('sort-')) {
      setSortOrder('standard')
      return
    }
    setSmartFilters((prev) => {
      const next = new Set(prev)
      next.delete(id as SmartFilter)
      return next
    })
  }

  function resetFilters() {
    setActiveCategory('fro')
    setSubcat('alle')
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
        activeFilterChips={activeFilterChips}
        onRemoveFilterChip={removeFilterChip}
      />

      {/* Den filtrerede inventory sendes ned til archive-stak. Trukket op så
          hero-kortet lægger sig oven på panelets creme-mappe (Anna): hero ~6mm
          under skulderens top, creme fortsætter ned bag kortet. */}
      <div style={{ marginTop: -145, position: 'relative', zIndex: 10 }}>
        <InventoryArchiveStack inventory={filtered} />
      </div>

      {/* Filterknappen i mappen åbner dette bottom sheet (ikke længere et
          inline-panel under mappen, som brød arkiv-illusionen). */}
      <FilterBottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        category={activeCategory}
        smartFilters={smartFilters}
        sortOrder={sortOrder}
        onSelectCategory={(id) => {
          setActiveCategory(id)
          setSubcat('alle')
        }}
        onToggleSmart={toggleSmart}
        onClearSmart={() => setSmartFilters(new Set())}
        onSelectSort={setSortOrder}
        onReset={resetFilters}
      />
    </div>
  )
}
