'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { GUIDE_CATEGORIES } from '@/lib/constants'
import type { PlantGuide } from '@/lib/types'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Search, Plus, Sparkles } from 'lucide-react'
import { GuideForm } from './guide-form'

interface Props {
  guides: PlantGuide[]
}

export function GuideLibrary({ guides }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [growFilter, setGrowFilter] = useState<string>('')
  const [showForm, setShowForm] = useState(false)

  // Unique seed types across all guides
  const seedTypes = useMemo(() => {
    const types = new Set<string>()
    for (const g of guides) {
      if (g.seed_type) types.add(g.seed_type)
    }
    return Array.from(types).sort()
  }, [guides])

  // Unique sun requirements
  const sunOptions = useMemo(() => {
    const opts = new Set<string>()
    for (const g of guides) {
      if (g.sun_requirement) opts.add(g.sun_requirement)
    }
    return Array.from(opts)
  }, [guides])

  const SUN_LABELS: Record<string, string> = { full_sun: 'Fuld sol', partial_shade: 'Halvskygge', shade: 'Skygge' }

  const GROW_KEYWORDS: Record<string, string[]> = {
    friland: ['friland', 'udendørs', 'direkte såning'],
    drivhus: ['drivhus'],
    krukke: ['krukke', 'potte', 'altan', 'balkon'],
    indendørs: ['indendørs', 'vindueskarm'],
  }
  const GROW_LABELS: Record<string, string> = {
    friland: 'Friland',
    drivhus: 'Drivhus',
    krukke: 'Krukke / altan',
    indendørs: 'Indendørs',
  }

  function guideMatchesGrow(g: PlantGuide, grow: string): boolean {
    const keywords = GROW_KEYWORDS[grow]
    if (!keywords) return false
    const text = [g.environment_info, g.care_info, g.description].filter(Boolean).join(' ').toLowerCase()
    return keywords.some(kw => text.includes(kw))
  }

  const filtered = useMemo(() => {
    let result = guides

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(g =>
        g.name_da.toLowerCase().includes(q) ||
        (g.name_en?.toLowerCase().includes(q)) ||
        (g.botanical_name?.toLowerCase().includes(q)) ||
        (g.description?.toLowerCase().includes(q))
      )
    }

    if (categoryFilter) {
      result = result.filter(g => g.category === categoryFilter)
    }

    if (typeFilter === 'auto') {
      result = result.filter(g => g.created_automatically)
    } else if (typeFilter === 'manual') {
      result = result.filter(g => !g.created_automatically)
    } else if (typeFilter) {
      result = result.filter(g => g.seed_type === typeFilter)
    }

    if (growFilter) {
      result = result.filter(g => guideMatchesGrow(g, growFilter))
    }

    return result
  }, [guides, search, categoryFilter, typeFilter, growFilter])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, PlantGuide[]>()
    for (const g of filtered) {
      if (!map.has(g.category)) map.set(g.category, [])
      map.get(g.category)!.push(g)
    }
    return map
  }, [filtered])

  return (
    <div className="space-y-6">
      {/* Header + Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dyrkningsguides</h1>
            <p className="text-sm text-muted-foreground">
              {guides.length} guides — lær at dyrke dine planter optimalt
            </p>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Ny guide
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søg i guides..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
            className="sm:w-40"
          >
            <option value="">Alle kategorier</option>
            {Object.entries(GUIDE_CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
          <Select
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
            className="sm:w-40"
          >
            <option value="">Alle typer</option>
            <option value="auto">AI-genereret</option>
            <option value="manual">Manuelt oprettet</option>
            {seedTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Select
            value={growFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGrowFilter(e.target.value)}
            className="sm:w-40"
          >
            <option value="">Dyrkningstype</option>
            {Object.entries(GROW_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Ingen guides fundet</p>
          {search && <p className="text-xs mt-1">Prøv et andet søgeord</p>}
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, catGuides]) => {
          const catMeta = GUIDE_CATEGORIES[category as keyof typeof GUIDE_CATEGORIES]
          return (
            <div key={category}>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                {catMeta && <Badge className={catMeta.color}>{catMeta.label}</Badge>}
                <span className="text-xs text-muted-foreground">({catGuides.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {catGuides.map(guide => (
                  <Link key={guide.id} href={`/guides/${guide.slug}`}>
                    <Card className="hover:border-primary/30 transition-colors h-full">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{guide.name_da}</p>
                          {guide.botanical_name && (
                            <p className="text-xs text-muted-foreground italic">{guide.botanical_name}</p>
                          )}
                          {!guide.botanical_name && guide.name_en && (
                            <p className="text-xs text-muted-foreground italic">{guide.name_en}</p>
                          )}
                        </div>
                        {guide.created_automatically && (
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{guide.description}</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {guide.sow_indoor_start && <span>Så: {guide.sow_indoor_start}</span>}
                        {guide.harvest_start && <span>Høst: {guide.harvest_start}–{guide.harvest_end}</span>}
                        {guide.sun_requirement && (
                          <span>{SUN_LABELS[guide.sun_requirement]}</span>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Create form */}
      <GuideForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  )
}
