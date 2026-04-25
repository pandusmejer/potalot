'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GuideCard } from './guide-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PRIMARY_CATEGORIES } from '@/lib/constants'
import type { Guide, PrimaryCategoryId } from '@/lib/types'
import { Search, BookOpen } from 'lucide-react'

interface Props {
  guides: Guide[]
  /** Hvilke guide-IDer er linket til brugerens frøbank */
  inFroebank?: Set<string>
}

export function GuideList({ guides, inFroebank }: Props) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<PrimaryCategoryId | 'alle'>('alle')

  const filtered = useMemo(() => {
    let list = guides

    if (filterCat !== 'alle') {
      list = list.filter(g => g.primaryCategoryId === filterCat)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(g =>
        g.plantName.toLowerCase().includes(q) ||
        g.variety?.toLowerCase().includes(q) ||
        g.latinName?.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    return list.sort((a, b) => a.plantName.localeCompare(b.plantName, 'da'))
  }, [guides, search, filterCat])

  const linkedToFroebank = useMemo(() => {
    if (!inFroebank) return []
    return filtered.filter(g => inFroebank.has(g.id))
  }, [filtered, inFroebank])

  function renderList(list: Guide[]) {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title={search ? 'Ingen resultater' : 'Ingen guides her'}
          description={search ? 'Prøv et andet søgeord.' : ''}
        />
      )
    }
    return (
      <div className="space-y-3">
        {list.map(g => <GuideCard key={g.id} guide={g} />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg navn, sort, latinsk navn"
            className="pl-9"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value as PrimaryCategoryId | 'alle')}
          className="h-10 px-3 rounded-lg border border-input bg-card text-sm"
        >
          <option value="alle">Alle kategorier</option>
          {Object.entries(PRIMARY_CATEGORIES)
            .filter(([id]) => id !== 'favoritter')
            .map(([id, cat]) => (
              <option key={id} value={id}>{cat.name}</option>
            ))}
        </select>
      </div>

      <Tabs defaultValue="alle">
        <TabsList>
          <TabsTrigger value="alle">
            Alle <span className="ml-1.5 text-xs opacity-60">({filtered.length})</span>
          </TabsTrigger>
          {inFroebank && (
            <TabsTrigger value="dine">
              Til din frøbank <span className="ml-1.5 text-xs opacity-60">({linkedToFroebank.length})</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="alle">{renderList(filtered)}</TabsContent>
        {inFroebank && <TabsContent value="dine">{renderList(linkedToFroebank)}</TabsContent>}
      </Tabs>
    </div>
  )
}
