'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { SeedForm } from '@/components/inventory/seed-form'
import { SeedUploadDialog } from '@/components/inventory/seed-upload-dialog'
import { BulkEditDialog } from '@/components/froebank/bulk-edit-dialog'
import { SEED_STATUSES, DEFAULT_SUBCATEGORIES, PRIMARY_CATEGORIES } from '@/lib/constants'
import type { Seed, PlantGuide, SeedSubcategory } from '@/lib/types'
import { formatDanishDate } from '@/lib/date-utils'
import { bulkDeleteSeeds, toggleFavorite, togglePin } from '@/actions/inventory'
import {
  Package, Plus, Upload, Search, X, CheckSquare, Square,
  Trash2, Edit3, ExternalLink, Star, Pin, Sprout, CircleDot,
  Droplets, TreePine, Trees, Flower, ShoppingCart
} from 'lucide-react'
import { useState, useMemo, useTransition } from 'react'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  froe: <Sprout className="h-4 w-4" />,
  loeg: <CircleDot className="h-4 w-4" />,
  knolde: <Droplets className="h-4 w-4" />,
  buske: <TreePine className="h-4 w-4" />,
  traeer: <Trees className="h-4 w-4" />,
  stauder: <Flower className="h-4 w-4" />,
  indkoebsliste: <ShoppingCart className="h-4 w-4" />,
  favoritter: <Star className="h-4 w-4" />,
}

interface SeedBankProps {
  seeds: Seed[]
  guides: PlantGuide[]
  customSubcategories: SeedSubcategory[]
}

export function SeedBank({ seeds, guides, customSubcategories }: SeedBankProps) {
  const [seedFormOpen, setSeedFormOpen] = useState(false)
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  // Niveau 1: Primary category
  const [selectedCategory, setSelectedCategory] = useState<string>('froe')

  // Filtering
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [nameSearch, setNameSearch] = useState<string>('')

  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Subcategories: defaults + custom for current category
  const subcategories = useMemo(() => {
    const customs = customSubcategories
      .filter(sc => sc.primary_category === selectedCategory)
      .map(sc => sc.name)
    return [...DEFAULT_SUBCATEGORIES, ...customs]
  }, [customSubcategories, selectedCategory])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of seeds) {
      counts[s.primary_category] = (counts[s.primary_category] || 0) + 1
    }
    counts['favoritter'] = seeds.filter(s => s.is_favorite).length
    return counts
  }, [seeds])

  // Seeds for current category (niveau 1 filter)
  const categorySeeds = useMemo(() => {
    if (selectedCategory === 'favoritter') {
      return seeds.filter(s => s.is_favorite)
    }
    return seeds.filter(s => s.primary_category === selectedCategory)
  }, [seeds, selectedCategory])

  // Filter seeds (niveau 2 + status + search)
  const filteredSeeds = useMemo(() => {
    let result = [...categorySeeds]

    // Pinned first
    result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return 0
    })

    if (selectedSubcategory) {
      result = result.filter(s => s.subcategory === selectedSubcategory)
    }

    if (selectedStatus) {
      result = result.filter(s => s.status === selectedStatus)
    }

    if (nameSearch.trim()) {
      const search = nameSearch.toLowerCase().trim()
      result = result.filter(s =>
        s.name.toLowerCase().includes(search) ||
        (s.variety && s.variety.toLowerCase().includes(search)) ||
        (s.botanical_name && s.botanical_name.toLowerCase().includes(search)) ||
        (s.brand && s.brand.toLowerCase().includes(search))
      )
    }

    return result
  }, [categorySeeds, selectedSubcategory, selectedStatus, nameSearch])

  // Status counts for current category
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of categorySeeds) {
      counts[s.status] = (counts[s.status] || 0) + 1
    }
    return counts
  }, [categorySeeds])

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredSeeds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredSeeds.map(s => s.id)))
    }
  }

  function exitBulkMode() {
    setBulkMode(false)
    setSelectedIds(new Set())
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Slet ${selectedIds.size} frø? Dette kan ikke fortrydes.`)) return
    startTransition(async () => {
      await bulkDeleteSeeds([...selectedIds])
      exitBulkMode()
    })
  }

  function handleToggleFavorite(e: React.MouseEvent, seed: Seed) {
    e.stopPropagation()
    startTransition(async () => {
      await toggleFavorite(seed.id, !seed.is_favorite)
    })
  }

  function handleTogglePin(e: React.MouseEvent, seed: Seed) {
    e.stopPropagation()
    startTransition(async () => {
      await togglePin(seed.id, !seed.is_pinned)
    })
  }

  function clearFilters() {
    setSelectedSubcategory(null)
    setSelectedStatus(null)
    setNameSearch('')
  }

  function handleCategoryChange(cat: string) {
    setSelectedCategory(cat)
    setSelectedSubcategory(null)
    setSelectedStatus(null)
    setNameSearch('')
    exitBulkMode()
  }

  const hasActiveFilters = !!selectedSubcategory || !!selectedStatus || !!nameSearch

  return (
    <div className="space-y-4">
      {/* ========== Niveau 1: Primary Categories ========== */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {Object.entries(PRIMARY_CATEGORIES).map(([key, { label }]) => {
          const count = categoryCounts[key] || 0
          const isActive = selectedCategory === key
          return (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {CATEGORY_ICONS[key]}
              <span>{label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1 rounded-full ${
                  isActive ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
        {/* Favoritter (dynamisk visning) */}
        <button
          onClick={() => handleCategoryChange('favoritter')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            selectedCategory === 'favoritter'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Star className={`h-4 w-4 ${selectedCategory === 'favoritter' ? 'fill-white' : ''}`} />
          <span>Favoritter</span>
          {(categoryCounts['favoritter'] || 0) > 0 && (
            <span className={`text-[10px] px-1 rounded-full ${
              selectedCategory === 'favoritter' ? 'bg-white/20' : 'bg-muted-foreground/20'
            }`}>
              {categoryCounts['favoritter']}
            </span>
          )}
        </button>
      </div>

      {/* ========== Status Filter Pills ========== */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedStatus(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            !selectedStatus
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          }`}
        >
          Alle ({categorySeeds.length})
        </button>
        {Object.entries(SEED_STATUSES).map(([key, { label, color }]) => {
          const count = statusCounts[key] || 0
          if (count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setSelectedStatus(selectedStatus === key ? null : key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedStatus === key
                  ? color
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* ========== Niveau 2: Subcategory Chips ========== */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {subcategories.map(sub => {
          const isActive = selectedSubcategory === sub
          return (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(isActive ? null : sub)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {sub}
            </button>
          )
        })}
      </div>

      {/* ========== Search ========== */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            placeholder="Søg på navn, sort, mærke..."
            className="pl-8 h-9 text-sm"
          />
          {nameSearch && (
            <button
              onClick={() => setNameSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap">
            Ryd filtre
          </button>
        )}
      </div>

      {/* ========== Action Bar ========== */}
      <div className="flex items-center gap-2">
        <div className="flex-1 text-xs text-muted-foreground">
          {filteredSeeds.length} {filteredSeeds.length === 1 ? 'element' : 'elementer'}
        </div>

        {bulkMode ? (
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="text-xs text-primary hover:underline">
              {selectedIds.size === filteredSeeds.length ? 'Fravælg alle' : 'Vælg alle'}
            </button>
            <span className="text-xs text-muted-foreground">{selectedIds.size} valgt</span>
            <Button size="sm" variant="secondary" disabled={selectedIds.size === 0} onClick={() => setBulkEditOpen(true)}>
              <Edit3 className="h-3.5 w-3.5 mr-1" />
              Rediger
            </Button>
            <Button size="sm" variant="destructive" disabled={selectedIds.size === 0 || isPending} onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Slet
            </Button>
            <Button size="sm" variant="ghost" onClick={exitBulkMode}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setBulkMode(true)}>
              <CheckSquare className="h-4 w-4 mr-1" />
              Vælg
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
            <Button size="sm" onClick={() => setSeedFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Tilføj
            </Button>
          </div>
        )}
      </div>

      {/* ========== Niveau 3: Seed List ========== */}
      {filteredSeeds.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title={hasActiveFilters ? 'Ingen resultater' : `Ingen elementer i ${
            selectedCategory === 'favoritter' ? 'Favoritter' :
            PRIMARY_CATEGORIES[selectedCategory as keyof typeof PRIMARY_CATEGORIES]?.label ?? selectedCategory
          }`}
          description={
            hasActiveFilters
              ? 'Prøv at ændre dine filtre.'
              : 'Tilføj elementer for at komme i gang.'
          }
          action={
            hasActiveFilters
              ? <Button size="sm" variant="secondary" onClick={clearFilters}>Ryd filtre</Button>
              : <Button size="sm" onClick={() => setSeedFormOpen(true)}>Tilføj</Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredSeeds.map(seed => {
            const statusMeta = SEED_STATUSES[seed.status as keyof typeof SEED_STATUSES]
            const remaining = seed.seeds_total != null && seed.seeds_sown != null
              ? seed.seeds_total - seed.seeds_sown
              : null
            const isSelected = selectedIds.has(seed.id)

            return (
              <Card
                key={seed.id}
                className={`cursor-pointer transition-colors ${
                  seed.is_pinned ? 'border-amber-300 bg-amber-50/30' :
                  isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/30'
                }`}
                onClick={() => {
                  if (bulkMode) toggleSelect(seed.id)
                  else { setEditingSeed(seed); setSeedFormOpen(true) }
                }}
              >
                <div className="flex items-start gap-2">
                  {bulkMode && (
                    <div className="mt-0.5 shrink-0">
                      {isSelected
                        ? <CheckSquare className="h-4 w-4 text-primary" />
                        : <Square className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          {seed.is_pinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                          <p className="text-sm font-medium text-foreground truncate">{seed.name}</p>
                        </div>
                        {seed.variety && <p className="text-xs text-muted-foreground truncate">{seed.variety}</p>}
                        {seed.botanical_name && <p className="text-xs text-muted-foreground/60 truncate italic">{seed.botanical_name}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Favorite toggle */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, seed)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title={seed.is_favorite ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
                        >
                          <Star className={`h-3.5 w-3.5 ${
                            seed.is_favorite ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40'
                          }`} />
                        </button>
                        {/* Pin toggle */}
                        <button
                          onClick={(e) => handleTogglePin(e, seed)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title={seed.is_pinned ? 'Fjern pin' : 'Fastgør'}
                        >
                          <Pin className={`h-3.5 w-3.5 ${
                            seed.is_pinned ? 'text-amber-500' : 'text-muted-foreground/40'
                          }`} />
                        </button>
                        {statusMeta && <Badge className={`${statusMeta.color}`}>{statusMeta.label}</Badge>}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {/* Quantity tracking */}
                      {remaining != null ? (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{remaining}</span>
                          <span>tilbage</span>
                          <span className="text-muted-foreground/60">({seed.seeds_sown}/{seed.seeds_total})</span>
                        </span>
                      ) : seed.seeds_total != null ? (
                        <span>{seed.seeds_total} stk</span>
                      ) : seed.quantity != null ? (
                        <span>{seed.quantity} stk</span>
                      ) : null}

                      {seed.brand && <span>{seed.brand}</span>}
                      {seed.location && <span>📍 {seed.location}</span>}

                      {seed.expiry_date ? (
                        <span>Udløb: {formatDanishDate(seed.expiry_date)}</span>
                      ) : seed.expiry_year ? (
                        <span>Udløb: {seed.expiry_year}</span>
                      ) : null}

                      {seed.germination_rate != null && (
                        <span>Spiring: {seed.germination_rate}%</span>
                      )}

                      {seed.purchase_url && (
                        <span className="flex items-center gap-0.5 text-primary">
                          <ExternalLink className="h-3 w-3" />
                          Link
                        </span>
                      )}

                      {seed.subcategory && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{seed.subcategory}</Badge>
                      )}
                    </div>

                    {/* Quantity progress bar */}
                    {remaining != null && seed.seeds_total != null && seed.seeds_total > 0 && (
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all"
                          style={{ width: `${Math.max(0, Math.min(100, (remaining / seed.seeds_total) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ========== Dialogs ========== */}
      <SeedForm
        open={seedFormOpen}
        onClose={() => { setSeedFormOpen(false); setEditingSeed(null) }}
        seed={editingSeed}
        guides={guides}
        defaultSubcategory={selectedSubcategory}
        defaultCategory={selectedCategory !== 'favoritter' ? selectedCategory : 'froe'}
      />
      <SeedUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        guides={guides}
      />
      <BulkEditDialog
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        selectedIds={[...selectedIds]}
        onSuccess={exitBulkMode}
      />
    </div>
  )
}
