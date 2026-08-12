'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { GuideCard } from './guide-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PRIMARY_CATEGORIES } from '@/lib/constants'
import type { Guide, PrimaryCategoryId } from '@/lib/types'
import { Search, BookOpen, ShieldCheck, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  guides: Guide[]
  /** Hvilke guide-IDer er linket til brugerens frøbank */
  inFroebank?: Set<string>
  /** Når true: vis Slet-knap på master-guides også */
  isAdmin?: boolean
  /** True hvis brugeren er logget ind (private guides ses kun af ejer pga RLS) */
  canDeleteOwnGuides?: boolean
}

type TabId = 'alle' | 'master' | 'mine' | 'dine'

/** Nøgle til at matche master + brugerkopi (case-insensitivt, trimmet). */
function dedupKey(g: Guide): string {
  return `${g.plantName.toLowerCase().trim()}|${(g.variety ?? '').toLowerCase().trim()}`
}

export function GuideList({ guides, inFroebank, isAdmin = false, canDeleteOwnGuides = false }: Props) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<PrimaryCategoryId | 'alle'>('alle')
  const [tab, setTab] = useState<TabId>('alle')

  const cloneOfMaster = useMemo(() => {
    const mastersByKey = new Map<string, string>()
    for (const g of guides) {
      if (g.visibility === 'public') mastersByKey.set(dedupKey(g), g.id)
    }
    const map = new Map<string, string>()
    for (const g of guides) {
      if (g.visibility === 'private') {
        const masterId = mastersByKey.get(dedupKey(g))
        if (masterId) map.set(g.id, masterId)
      }
    }
    return map
  }, [guides])

  const hiddenMasterIds = useMemo(() => new Set(cloneOfMaster.values()), [cloneOfMaster])

  const filtered = useMemo(() => {
    let list = guides.filter(g =>
      !(g.visibility === 'public' && hiddenMasterIds.has(g.id))
    )
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
  }, [guides, search, filterCat, hiddenMasterIds])

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
          const tilpasningOf = cloneOfMaster.get(g.id) ?? null
          return (
            <GuideCard
              key={g.id}
              guide={g}
              canDelete={canDelete}
              tilpasningOfMasterId={tilpasningOf}
            />
          )
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
              <span className="text-[10px] text-muted-foreground italic">– kuraterede af Potalot</span>
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

  // Side-faner: forskellige palettefarver, stikker ud, overlapper.
  // "Bryd boksen" — navigationen er fysiske mapper, ikke en tab-bar.
  const FANER: { id: TabId; label: string; count: number; bg: string; fg: string }[] = [
    { id: 'alle', label: 'Alle', count: filtered.length, bg: 'var(--primary)', fg: 'var(--primary-foreground)' },
    { id: 'master', label: 'Master', count: masters.length, bg: 'var(--block-fresh)', fg: 'var(--foreground)' },
    { id: 'mine', label: 'Mine', count: mine.length, bg: 'var(--block-sun)', fg: 'var(--foreground)' },
    ...(inFroebank
      ? [{ id: 'dine' as TabId, label: 'I frøbank', count: linkedToFroebank.length, bg: 'var(--accent)', fg: 'var(--accent-foreground)' }]
      : []),
  ]

  return (
    <div className="flex items-stretch gap-0">
      {/* Lodret fane-skinne — faner i forskellige farver der stikker ud */}
      <div className="relative z-10 flex flex-col pt-3 pr-0">
        {FANER.map((f, i) => {
          const active = tab === f.id
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(f.id)}
              style={{
                backgroundColor: f.bg,
                color: f.fg,
                marginTop: i === 0 ? 0 : -10,
                // varierede radii + organisk: aldrig ens hjørner
                borderTopLeftRadius: i % 2 === 0 ? 22 : 14,
                borderBottomLeftRadius: i % 2 === 0 ? 14 : 22,
                boxShadow: active ? '-6px 6px 18px -8px rgba(40,50,30,0.45)' : 'none',
              }}
              className={cn(
                'relative flex w-[50px] flex-col items-center gap-2 py-5 transition-all',
                active
                  ? 'z-20 translate-x-[1px]'
                  : 'z-0 -translate-x-1.5 opacity-60 hover:opacity-85 hover:translate-x-0'
              )}
            >
              <span
                className="font-bold tracking-wide text-[13px] leading-none"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                {f.label}
              </span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black/10 px-1 text-[10px] font-semibold leading-none">
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Indholdspanel — organisk: hjørner varierer, fane smelter ind */}
      <div className="min-w-0 flex-1 rounded-r-[1.75rem] rounded-bl-2xl rounded-tl-none border border-border bg-card px-4 py-4 shadow-soft -ml-px">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Søg navn, sort, latinsk"
              className="pl-9"
            />
          </div>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value as PrimaryCategoryId | 'alle')}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="alle">Alle kategorier</option>
            {Object.entries(PRIMARY_CATEGORIES)
              .filter(([id]) => id !== 'favoritter')
              .map(([id, cat]) => (
                <option key={id} value={id}>{cat.name}</option>
              ))}
          </select>
        </div>

        <div className="mt-4">
          {tab === 'alle' && renderAlleSplit()}
          {tab === 'master' && renderCards(masters)}
          {tab === 'mine' && renderCards(mine)}
          {tab === 'dine' && renderCards(linkedToFroebank)}
        </div>
      </div>
    </div>
  )
}
