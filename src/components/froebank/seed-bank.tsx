'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { SeedForm } from '@/components/inventory/seed-form'
import { SeedUploadDialog } from '@/components/inventory/seed-upload-dialog'
import { BulkEditDialog } from '@/components/froebank/bulk-edit-dialog'
import { SEED_STATUSES, PRIMARY_CATEGORIES, DEFAULT_SUBCATEGORIES } from '@/lib/constants'
import type { Seed, PlantGuide, SeedSubcategory } from '@/lib/types'
import { formatDanishDate } from '@/lib/date-utils'
import { bulkDeleteSeeds } from '@/actions/inventory'
import {
  Package, Plus, Upload, Search, X, CheckSquare, Square,
  Trash2, Edit3, Sprout, Flower2, CircleDot, Droplets,
  TreePine, Trees, Flower, ShoppingCart
} from 'lucide-react'
import { useState, useMemo, useTransition } from 'react'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  froe: <Sprout className="h-4 w-4" />,
  aktive_planter: <Flower2 className="h-4 w-4" />,
  loeg: <CircleDot className="h-4 w-4" />,
  knolde: <Droplets className="h-4 w-4" />,
  buske: <TreePine className="h-4 w-4" />,
  traeer: <Trees className="h-4 w-4" />,
  stauder: <Flower className="h-4 w-4" />,
  indkoebsliste: <ShoppingCart className="h-4 w-4" />,
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

  // Hierarchy state
  const [selectedCategory, setSelectedCategory] = useState<string>('froe')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)

  // Filtering state (Level 3)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [nameSearch, setNameSearch] = useState<string>('')

  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Compute subcategories for current category (defaults + custom)
  const subcategories = useMemo(() => {
    const customs = customSubcategories
      .filter(sc => sc.primary_category === selectedCategory)
      .map(sc => sc.name)
    return [...DEFAULT_SUBCATEGORIES, ...customs]
  }, [selectedCategory, customSubcategories])

  // Get unique plant_type values for L3 type filter dropdown
  const availableTypes = useMemo(() => {
    const types = seeds
      .filter(s => s.primary_category === selectedCategory)
      .map(s => s.plant_type)
      .filter((t): t is string => !!t)
    return [...new Set(types)].sort()
  }, [seeds, selectedCategory])

  // Filter seeds through all 3 levels
  const filteredSeeds = useMemo(() => {
    let result = seeds.filter(s => s.primary_category === selectedCategory)

    if (selectedSubcategory) {
      result = result.filter(s => s.subcategory === selectedSubcategory)
    }

    if (typeFilter) {
      result = result.filter(s => s.plant_type === typeFilter)
    }

    if (nameSearch.trim()) {
      const search = nameSearch.toLowerCase().trim()
      result = result.filter(s =>
        s.name.toLowerCase().includes(search) ||
        (s.variety && s.variety.toLowerCase().includes(search))
      )
    }

    return result
  }, [seeds, selectedCategory, selectedSubcategory, typeFilter, nameSearch])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of seeds) {
      counts[s.primary_category] = (counts[s.primary_category] || 0) + 1
    }
    return counts
  }, [seeds])

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

  function clearFilters() {
    setSelectedSubcategory(null)
    setTypeFilter('')
    setNameSearch('')
  }

  const hasActiveFilters = !!selectedSubcategory || !!typeFilter || !!nameSearch

  return (
    <div className="space-y-4">
      {/* ========== Level 1: Primary Categories ========== */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {Object.entries(PRIMARY_CATEGORIES).map(([key, { label }]) => {
          const count = categoryCounts[key] || 0
          const isActive = selectedCategory === key
          return (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(key)
                clearFilters()
                exitBulkMode()
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {CATEGORY_ICONS[key]}
              {label}
              {count > 0 && (
                <span className={`text-xs ml-1 ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                  ({count})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ========== Level 2: Subcategories ========== */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => setSelectedSubcategory(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            !selectedSubcategory
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          }`}
        >
          Alle
        </button>
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

      {/* ========== Level 3: Search & Type Filter ========== */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            placeholder="Søg på navn eller sort..."
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
        {availableTypes.length > 0 && (
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
          >
            <option value="">Alle typer</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
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
            <Button
              size="sm"
              variant="secondary"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkEditOpen(true)}
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" />
              Rediger
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={selectedIds.size === 0 || isPending}
              onClick={handleBulkDelete}
            >
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

      {/* ========== Seed Grid ========== */}
      {filteredSeeds.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title={hasActiveFilters ? 'Ingen resultater' : 'Ingen elementer endnu'}
          description={
            hasActiveFilters
              ? 'Prøv at ændre dine filtre.'
              : `Tilføj dine ${PRIMARY_CATEGORIES[selectedCategory as keyof typeof PRIMARY_CATEGORIES]?.label.toLowerCase() ?? 'elementer'} for at komme i gang.`
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
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/30'
                }`}
                onClick={() => {
                  if (bulkMode) {
                    toggleSelect(seed.id)
                  } else {
                    setEditingSeed(seed)
                    setSeedFormOpen(true)
                  }
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
                        <p className="text-sm font-medium text-foreground truncate">{seed.name}</p>
                        {seed.variety && (
                          <p className="text-xs text-muted-foreground truncate">{seed.variety}</p>
                        )}
                      </div>
                      {statusMeta && <Badge className={`shrink-0 ${statusMeta.color}`}>{statusMeta.label}</Badge>}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {/* Seed quantity tracking */}
                      {remaining != null ? (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{remaining}</span>
                          <span>tilbage</span>
                          <span className="text-muted-foreground/60">
                            ({seed.seeds_sown}/{seed.seeds_total} sået)
                          </span>
                        </span>
                      ) : seed.seeds_total != null ? (
                        <span>{seed.seeds_total} stk</span>
                      ) : seed.quantity != null ? (
                        <span>{seed.quantity} stk</span>
                      ) : null}

                      {seed.brand && <span>{seed.brand}</span>}

                      {seed.expiry_date ? (
                        <span>Udløb: {formatDanishDate(seed.expiry_date)}</span>
                      ) : seed.expiry_year ? (
                        <span>Udløb: {seed.expiry_year}</span>
                      ) : null}

                      {seed.subcategory && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {seed.subcategory}
                        </Badge>
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
        defaultCategory={selectedCategory}
        defaultSubcategory={selectedSubcategory}
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
