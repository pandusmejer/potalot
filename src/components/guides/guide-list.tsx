'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GuideCard } from './guide-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PRIMARY_CATEGORIES } from '@/lib/constants'
import type { Guide, PrimaryCategoryId } from '@/lib/types'
import { Search, BookOpen, ShieldCheck, User } from 'lucide-react'

interface Props {
  guides: Guide[]
  /** Hvilke guide-IDer er linket til brugerens frøbank */
  inFroebank?: Set<string>
  /** Når true: vis Slet-knap på master-guides også */
  isAdmin?: boolean
  /** True hvis brugeren er logget ind (private guides ses kun af ejer pga RLS) */
  canDeleteOwnGuides?: boolean
}

export function GuideList({ guides, inFroebank, isAdmin = false, canDeleteOwnGuides = false }: Props) {
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

  const masters = useMemo(() => filtered.filter(g => g.visibility === 'public'), [filtered])
  const mine = useMemo(() => filtered.filter(g => g.visibility === 'private'), [filtered])
  const linkedToFroebank = useMemo(() => {
    if (!inFroebank) return []
    return filtered.filter(g => inFroebank.has(g.id))
  }, [filtered, inFroebank])

  function renderCards(list: Guide[]) {
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
        {list.map(g => {
          const isMaster = g.visibility === 'public'
          const canDelete = isMaster ? isAdmin : canDeleteOwnGuides
          return <GuideCard key={g.id} guide={g} canDelete={canDelete} />
        })}
      </div>
    )
  }

  function renderAlleSplit() {
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title={search ? 'Ingen resultater' : 'Ingen guides her'}
          description={search ? 'Prøv et andet søgeord.' : ''}
        />
      )
    }
    return (
      <div className="space-y-5">
        {masters.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-700" />
              <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
                Master-guides ({masters.length})
              </p>
              <span className="text-[10px] text-muted-foreground italic">– kuraterede af PotAlot</span>
            </div>
            {renderCards(masters)}
          </section>
        )}
        {mine.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Mine guides ({mine.length})
              </p>
            </div>
            {renderCards(mine)}
          </section>
        )}
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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="alle">
            Alle <span className="ml-1.5 text-xs opacity-60">({filtered.length})</span>
          </TabsTrigger>
          <TabsTrigger value="master">
            <ShieldCheck className="h-3.5 w-3.5" />
            Master <span className="ml-1.5 text-xs opacity-60">({masters.length})</span>
          </TabsTrigger>
          <TabsTrigger value="mine">
            <User className="h-3.5 w-3.5" />
            Mine <span className="ml-1.5 text-xs opacity-60">({mine.length})</span>
          </TabsTrigger>
          {inFroebank && (
            <TabsTrigger value="dine">
              Til min frøbank <span className="ml-1.5 text-xs opacity-60">({linkedToFroebank.length})</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="alle">{renderAlleSplit()}</TabsContent>
        <TabsContent value="master">{renderCards(masters)}</TabsContent>
        <TabsContent value="mine">{renderCards(mine)}</TabsContent>
        {inFroebank && <TabsContent value="dine">{renderCards(linkedToFroebank)}</TabsContent>}
      </Tabs>
    </div>
  )
}
