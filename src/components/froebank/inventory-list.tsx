'use client'

import { useState, useMemo, useTransition, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CategoryTabs } from './category-tabs'
import { InventoryCard } from './inventory-card'
import { InventoryTab } from './inventory-tab'
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

  // Reagér hvis filter-query ændres mens komponenten lever (fx
  // fra notifikations-klik). setState sker i et microtask-callback
  // (ikke synkront i effekten) + cancel-guard, så vi undgår
  // cascading renders / opdatering efter unmount.
  useEffect(() => {
    const f = searchParams.get('filter')
    if (!f || !(VALID_SMART_FILTERS as string[]).includes(f)) return
    let active = true
    Promise.resolve().then(() => {
      if (!active) return
      setSmartFilters(prev => {
        if (prev.has(f as SmartFilter)) return prev
        const next = new Set(prev)
        next.add(f as SmartFilter)
        return next
      })
    })
    return () => { active = false }
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
            className="h-11 px-3 rounded-xl border border-input bg-card text-sm"
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
          title={search.trim() || smartFilters.size > 0 ? 'Ingen resultater' : 'Din frøbank er tom'}
          description={
            search.trim() || smartFilters.size > 0
              ? 'Prøv at justere søgning eller filtre.'
              : 'Læg dit første frø, knold eller stikling i banken — så bygger resten sig op af sig selv.'
          }
          action={
            !search.trim() && smartFilters.size === 0 ? (
              <Button asChild>
                <Link href="/froebank/tilfoej">
                  <Plus className="h-4 w-4" />
                  Tilføj dit første
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <StackedIndexList
          items={filtered}
          selectMode={selectMode}
          selectedSet={selected}
          onToggleSelect={toggleSelected}
        />
      )}
    </div>
  )
}

/**
 * "Stacked Index Card System" — frøbankens samling vises som
 * stablede arkivkort i stedet for en lineær feed. Ét kort er aktivt
 * (fuldt synligt); de øvrige er kollapsede så kun deres TOP-sektion
 * peeker frem (~18-26% af kortets højde) — nok til at vise eyebrow,
 * titel, sort og frø-tag, men ikke kortets fulde detalje.
 *
 * Reference-følelse:
 *   • indekskort i en kartoteksboks
 *   • vinyl-sleeves i en hylde
 *   • herbarium-arkiv
 *
 * IKKE: social feed, lineær liste, dashboard-grid.
 *
 * Interaktion:
 *   • Klik på et kollapset kort → det glider åbent og smelter
 *     ind i fokus. Det forrige aktive kort lukker.
 *   • Aktivt kort scrolles ind i view så det altid er synligt
 *     efter en åbning.
 *
 * Visuel behandling:
 *   • Aktivt kort: fuld saturation, ingen filter, fuld højde.
 *   • Inaktivt kort: let dæmpet (saturate 0.82, contrast 0.92,
 *     brightness 0.88) så det træder visuelt tilbage uden at
 *     miste sin farveidentitet.
 *   • Subtil "compression"-skygge over hver inaktiv kort-top
 *     skaber en groove-følelse mellem kortene — som om de er
 *     pressede sammen fysisk.
 */
function StackedIndexList({
  items,
  selectMode,
  selectedSet,
  onToggleSelect,
}: {
  items: InventoryItem[]
  selectMode: boolean
  selectedSet: Set<string>
  onToggleSelect: (id: string) => void
}) {
  const [openIdx, setOpenIdx] = useState(0)
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Hvis vi filtrerer og listen ændres, sørg for at openIdx er
  // gyldig (peg på et eksisterende element).
  useEffect(() => {
    if (openIdx >= items.length) setOpenIdx(0)
  }, [items.length, openIdx])

  // Når et kort bliver aktivt: scroll det ind i view så brugeren
  // ikke skal scrolle manuelt for at se det fulde indhold.
  const handleActivate = (idx: number) => {
    setOpenIdx(idx)
    // Vent på max-height-transition så scroll-positionen er korrekt
    requestAnimationFrame(() => {
      const el = cardRefs.current.get(idx)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

  // Split: aktivt kort står frit ovenfor; resten af mapperne sidder
  // i en warm-beige "archive frame" container — 1:1 efter spec.
  const activeItem = items[openIdx]
  const collapsedItems = items
    .map((item, i) => ({ item, i }))
    .filter(({ i }) => i !== openIdx)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Aktivt fuldt frøkort — låst design, sidder frit over arkivet. */}
      {activeItem && (
        <div
          ref={(el) => {
            if (el) cardRefs.current.set(openIdx, el)
            else cardRefs.current.delete(openIdx)
          }}
        >
          <InventoryCard
            item={activeItem}
            selectMode={selectMode}
            selected={selectedSet.has(activeItem.id)}
            onToggleSelect={() => onToggleSelect(activeItem.id)}
          />
        </div>
      )}

      {/* Archive frame — warm beige container med kollapsede mapper.
          Spec: 40 px radius, 24 px sideinset, 28 px top/bund-inset,
          14 px gap mellem mapper. */}
      {collapsedItems.length > 0 && (
        <div
          style={{
            background: '#FFFEF7',
            borderRadius: 40,
            paddingInline: 18,
            paddingTop: 28,
            paddingBottom: 28,
            boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {collapsedItems.map(({ item, i }) => (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(i, el)
                  else cardRefs.current.delete(i)
                }}
                onClick={() => {
                  if (selectMode) {
                    onToggleSelect(item.id)
                    return
                  }
                  handleActivate(i)
                }}
                style={{
                  position: 'relative',
                  cursor: selectMode ? 'default' : 'pointer',
                  transition: `transform 280ms ${EASING}`,
                }}
              >
                <InventoryTab item={item} />
              </div>
            ))}
          </div>
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
