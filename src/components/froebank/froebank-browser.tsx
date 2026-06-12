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
import { CategoryTabs } from './category-tabs'
import { InventoryArchiveStack } from './inventory-archive-stack'
import {
  Search,
  SlidersHorizontal,
  BookOpen,
  Clock,
  Image as ImageIcon,
  AlertTriangle,
  ArrowDownAZ,
  ArrowDownZA,
} from 'lucide-react'
import { SYSTEM_SUBCATEGORIES } from '@/lib/constants'
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

export function FroebankBrowser({ inventory, customSubcategories = [] }: Props) {
  const searchParams = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<PrimaryCategoryId>('fro')
  const [search, setSearch] = useState('')
  const [subcat, setSubcat] = useState<string>('alle')
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Sorteringsorden: 'standard' (pinned→favorit→alfabetisk),
  // 'az' (A→Å) eller 'za' (Å→A).
  const [sortOrder, setSortOrder] = useState<'standard' | 'az' | 'za'>('standard')
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

  const tilgaengeligeSubs = useMemo(() => {
    const all: Subcategory[] = [...SYSTEM_SUBCATEGORIES, ...customSubcategories]
    return all.filter((s) => s.parentCategoryIds.includes(activeCategory))
  }, [activeCategory, customSubcategories])

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

    if (sortOrder === 'az') return [...list].sort(byName)
    if (sortOrder === 'za') return [...list].sort((a, b) => byName(b, a))

    // standard: pinned først, så favoritter, derefter alfabetisk
    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      return byName(a, b)
    })
  }, [inventory, activeCategory, subcat, search, smartFilters, sortOrder])

  // Mikro-activity — struktureret som label + objekt + handling, så
  // frøbanken føles levende og timeline-agtig frem for et passivt
  // katalog. Prioritet: 1) noget tilføjet for nylig, 2) sæson-kontekst.
  const activity = useMemo<{
    label: string
    title: string
    subtitle: string
  } | null>(() => {
    if (inventory.length === 0) return null

    // 1) Senest tilføjet inden for 14 dage.
    const withDates = inventory.filter((i) => i.createdAt)
    if (withDates.length > 0) {
      const recent = [...withDates].sort((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
      )[0]
      const days = Math.floor(
        (Date.now() - new Date(recent.createdAt!).getTime()) / 86_400_000,
      )
      if (days >= 0 && days <= 14) {
        const navn = recent.variety
          ? `${recent.name} ${recent.variety}`
          : recent.name
        const tid =
          days === 0 ? 'i dag' : days === 1 ? 'i går' : `for ${days} dage siden`
        return {
          label: 'Sidst aktiv',
          title: navn,
          subtitle: `Tilføjet ${tid}`,
        }
      }
    }

    // 2) Sæson: sorter hvis såvindue rammer denne måned.
    const maaned = new Date().getMonth() + 1
    const klarNu = inventory.filter((i) => i.sowingMonths?.includes(maaned))
    if (klarNu.length > 0) {
      return {
        label: 'Lige nu',
        title: `${klarNu.length} ${klarNu.length === 1 ? 'sort' : 'sorter'}`,
        subtitle: 'Klar til såning',
      }
    }
    return null
  }, [inventory])

  return (
    <div className="space-y-4">
      {/* Mikro-activity pill — smal, objektbaseret, timeline-agtig.
          Grøn dot + ultra-light uppercase label + objektnavn + handling. */}
      {activity && (
        <div
          className="inline-flex max-w-[280px] flex-col rounded-2xl border px-3.5 py-2.5"
          style={{
            fontFamily: 'var(--font-manrope)',
            borderColor: 'rgba(36,48,31,0.08)',
            background: 'rgba(255,255,255,0.45)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#6B8B4A',
                flexShrink: 0,
              }}
            />
            <span
              className="uppercase"
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: '0.16em',
                color: 'rgba(36,48,31,0.42)',
              }}
            >
              {activity.label}
            </span>
          </div>
          <span
            className="mt-1.5 truncate"
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: '#24301F',
            }}
          >
            {activity.title}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(36,48,31,0.50)',
              marginTop: 1,
            }}
          >
            {activity.subtitle}
          </span>
        </div>
      )}

      <CategoryTabs
        active={activeCategory}
        onChange={setActiveCategory}
        inventory={inventory}
      />

      {/* ÉN samlet toolbar: search ─ subkategori ─ filter-knap.
          Alt i én rounded container med dividere for at undgå
          visuel støj fra spredte blokke. */}
      <div
        className="flex items-center overflow-hidden rounded-2xl border border-input bg-card"
        style={{ height: 48 }}
      >
        {/* Søgefelt — borderløst, flex-1 */}
        <div className="relative flex flex-1 items-center min-w-0">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søg navn, latinsk, sort…"
            className="h-full w-full bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Subkategori — kun hvis der findes nogen */}
        {tilgaengeligeSubs.length > 0 && (
          <>
            <div className="h-6 w-px bg-border" />
            <select
              value={subcat}
              onChange={(e) => setSubcat(e.target.value)}
              className="h-full bg-transparent px-3 text-sm outline-none"
            >
              <option value="alle">Alle</option>
              {tilgaengeligeSubs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {!s.isSystem ? ' (egen)' : ''}
                </option>
              ))}
            </select>
          </>
        )}

        {/* Filter-knap — åbner/lukker smart-filter rækken */}
        <div className="h-6 w-px bg-border" />
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-pressed={filtersOpen}
          aria-label="Filtre"
          className={cn(
            'flex h-full items-center gap-1.5 px-4 text-sm font-medium transition-colors',
            filtersOpen || smartFilters.size > 0
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {smartFilters.size > 0 && (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {smartFilters.size}
            </span>
          )}
        </button>
      </div>

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
