'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Sprout, Wheat, TreePine, ListFilter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LIVSCYKLUS_LABEL } from '@/lib/livscyklus/state-machine'
import type { Seed, Plant, Variety, Placering, Garden, PlantGuide, Livscyklus } from '@/lib/types'

type Filter = 'alle' | 'froebank' | 'planlagt' | 'i_jord' | 'i_vaekst' | 'afsluttet'

interface Props {
  seeds: Seed[]
  plants: Plant[]
  varieties: Variety[]
  placeringer: Placering[]
  gardens: Garden[]
  guides: PlantGuide[]
  initialFilter?: string
  initialPlacering?: string
  initialSort?: string
}

const FILTER_LABELS: Record<Filter, string> = {
  alle: 'Alle',
  froebank: 'Frøbank',
  planlagt: 'Planlagt',
  i_jord: 'I jord',
  i_vaekst: 'I vækst',
  afsluttet: 'Afsluttet',
}

export function HaveView({
  seeds,
  plants,
  placeringer,
  guides,
  initialFilter = 'alle',
  initialPlacering,
  initialSort,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>(initialFilter as Filter)
  const [placeringFilter, setPlaceringFilter] = useState<string | undefined>(initialPlacering)
  const [sortFilter, setSortFilter] = useState<string | undefined>(initialSort)

  function updateFilter(newFilter: Filter) {
    setFilter(newFilter)
    const sp = new URLSearchParams(searchParams)
    sp.set('filter', newFilter)
    router.replace(`/have?${sp.toString()}`, { scroll: false })
  }

  // Tæl pr. status
  const counts = useMemo(() => {
    const inFroebank = seeds.filter(s => s.status === 'in_stock').length
    const planlagt = plants.filter(p => p.livscyklus === 'planlagt').length
    const iJord = plants.filter(p => ['soet', 'spiret', 'priklet'].includes(p.livscyklus)).length
    const iVaekst = plants.filter(p => ['udplantet', 'i_vaekst'].includes(p.livscyklus)).length
    const afsluttet = plants.filter(p => p.livscyklus === 'afsluttet').length
    return {
      alle: inFroebank + plants.length,
      froebank: inFroebank,
      planlagt,
      i_jord: iJord,
      i_vaekst: iVaekst,
      afsluttet,
    }
  }, [seeds, plants])

  // Filter logic
  const filteredItems = useMemo(() => {
    let items: Array<{ kind: 'seed' | 'plant'; data: Seed | Plant }> = []

    if (filter === 'alle') {
      items = [
        ...seeds.filter(s => s.status === 'in_stock').map(s => ({ kind: 'seed' as const, data: s })),
        ...plants.filter(p => p.livscyklus !== 'afsluttet').map(p => ({ kind: 'plant' as const, data: p })),
      ]
    } else if (filter === 'froebank') {
      items = seeds.filter(s => s.status === 'in_stock').map(s => ({ kind: 'seed' as const, data: s }))
    } else if (filter === 'planlagt') {
      items = plants.filter(p => p.livscyklus === 'planlagt').map(p => ({ kind: 'plant' as const, data: p }))
    } else if (filter === 'i_jord') {
      items = plants.filter(p => ['soet', 'spiret', 'priklet'].includes(p.livscyklus)).map(p => ({ kind: 'plant' as const, data: p }))
    } else if (filter === 'i_vaekst') {
      items = plants.filter(p => ['udplantet', 'i_vaekst'].includes(p.livscyklus)).map(p => ({ kind: 'plant' as const, data: p }))
    } else if (filter === 'afsluttet') {
      items = plants.filter(p => p.livscyklus === 'afsluttet').map(p => ({ kind: 'plant' as const, data: p }))
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(item => {
        const name = item.data.name?.toLowerCase() ?? ''
        const variety = item.data.variety?.toLowerCase() ?? ''
        return name.includes(q) || variety.includes(q)
      })
    }

    if (placeringFilter) {
      items = items.filter(item => {
        if (item.kind === 'plant') {
          return (item.data as Plant).placering_id === placeringFilter
        }
        return false
      })
    }

    if (sortFilter) {
      items = items.filter(item => item.data.name === sortFilter)
    }

    return items
  }, [seeds, plants, filter, search, placeringFilter, sortFilter])

  // Unik liste af sort-navne til filter
  const uniqueSortNames = useMemo(() => {
    const names = new Set<string>()
    seeds.forEach(s => s.name && names.add(s.name))
    plants.forEach(p => p.name && names.add(p.name))
    return [...names].sort()
  }, [seeds, plants])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Have</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alt fra frøbank til høst — samlet ét sted.
        </p>
      </div>

      {/* Filter-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => updateFilter(f)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {FILTER_LABELS[f]} <span className="opacity-60">({counts[f] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Søg + sub-filtre */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg navn eller sort"
            className="pl-9"
          />
        </div>

        {placeringer.length > 0 && (
          <select
            value={placeringFilter ?? ''}
            onChange={e => setPlaceringFilter(e.target.value || undefined)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">Alle placeringer</option>
            {placeringer.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {uniqueSortNames.length > 0 && (
          <select
            value={sortFilter ?? ''}
            onChange={e => setSortFilter(e.target.value || undefined)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">Alle sorter</option>
            {uniqueSortNames.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}
      </div>

      {/* Liste */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ListFilter className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Intet at vise her.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map(item => {
            if (item.kind === 'seed') {
              const s = item.data as Seed
              return (
                <Link
                  key={`s-${s.id}`}
                  href={`/inventory/${s.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Wheat className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {s.name}{s.variety ? ` — ${s.variety}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.brand ?? 'Frøpose'} · {s.seeds_total ? `${(s.seeds_total ?? 0) - (s.seeds_sown ?? 0)}/${s.seeds_total} tilbage` : 'Antal ukendt'}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">I frøbank</Badge>
                </Link>
              )
            }

            const p = item.data as Plant
            const guide = guides.find(g => g.id === p.guide_id)
            const placering = placeringer.find(pl => pl.id === p.placering_id)
            return (
              <Link
                key={`p-${p.id}`}
                href={`/vaekst/${p.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                {p.livscyklus === 'i_vaekst' || p.livscyklus === 'udplantet' ? (
                  <TreePine className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <Sprout className="h-5 w-5 text-green-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.name}{p.variety ? ` — ${p.variety}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {placering?.name ?? 'Ingen placering'}
                    {guide && ` · ${guide.name_da}`}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {LIVSCYKLUS_LABEL[p.livscyklus as Livscyklus] ?? p.livscyklus}
                </Badge>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
