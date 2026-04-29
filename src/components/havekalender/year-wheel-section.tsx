'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Check, ChevronRight, X, Filter } from 'lucide-react'
import { saeson } from '@/lib/datetime'
import { MONTHS_DA } from '@/lib/constants'
import {
  YEAR_WHEEL_TASKS, CATEGORY_LABELS, TIME_WINDOW_LABELS, PRIORITY_LABELS,
  type YearWheelCategory, type YearWheelPriority,
} from '@/lib/year-wheel-library'
import { addYearWheelTasks } from '@/actions/year-wheel'
import type { CalendarTask } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  /** Eksisterende calendar_tasks fra DB — bruges til at vise hvilke der allerede er tilføjet */
  existingTasks: CalendarTask[]
  /** Nuværende år (typisk new Date().getFullYear()) */
  year: number
}

export function YearWheelSection({ existingTasks, year }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [openMonth, setOpenMonth] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState<YearWheelCategory | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<YearWheelPriority | 'all'>('all')
  const [confirmStep, setConfirmStep] = useState(false)
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null)

  // Map af templates der allerede er tilføjet til Mine opgaver (i indeværende år)
  const addedTemplateIds = useMemo(() => {
    return new Set(
      existingTasks
        .filter(t => t.source === 'general' && t.sourceId)
        .map(t => t.sourceId as string)
    )
  }, [existingTasks])

  const monthTasks = useMemo(() => {
    if (openMonth == null) return []
    return YEAR_WHEEL_TASKS
      .filter(t => t.month === openMonth)
      .filter(t => categoryFilter === 'all' || t.category === categoryFilter)
      .filter(t => priorityFilter === 'all' || t.priority === priorityFilter)
  }, [openMonth, categoryFilter, priorityFilter])

  const monthCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (let m = 1; m <= 12; m++) {
      counts.set(m, YEAR_WHEEL_TASKS.filter(t => t.month === m).length)
    }
    return counts
  }, [])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    const visibleIds = monthTasks.filter(t => !addedTemplateIds.has(t.id)).map(t => t.id)
    setSelected(new Set(visibleIds))
  }

  function clearSelection() {
    setSelected(new Set())
    setConfirmStep(false)
  }

  function handleAdd() {
    if (selected.size === 0) return
    startTransition(async () => {
      const res = await addYearWheelTasks({ templateIds: Array.from(selected), year })
      if ('error' in res) {
        // TODO: vis fejl
        return
      }
      setResult(res)
      setSelected(new Set())
      setConfirmStep(false)
      router.refresh()
    })
  }

  const categories = Array.from(new Set(YEAR_WHEEL_TASKS.map(t => t.category)))

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-serif text-xl text-foreground">Havens årshjul</h2>
            <p className="text-xs text-muted-foreground">
              Generelle haveopgaver pr. måned. Tilføj dem du vil til Mine opgaver.
            </p>
          </div>
        </div>

        {/* 12 månedskort */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const total = monthCounts.get(m) ?? 0
            const added = YEAR_WHEEL_TASKS.filter(t => t.month === m && addedTemplateIds.has(t.id)).length
            const isOpen = openMonth === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => { setOpenMonth(isOpen ? null : m); clearSelection() }}
                className={cn(
                  'flex flex-col gap-0.5 p-2 rounded-xl border transition-all text-left',
                  isOpen
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border text-foreground hover:bg-accent/40'
                )}
              >
                <span className={cn('text-[10px] uppercase tracking-wider', isOpen ? 'opacity-80' : 'text-muted-foreground')}>
                  {saeson(m)}
                </span>
                <span className="text-sm font-medium">
                  {(MONTHS_DA[m - 1].short.charAt(0).toUpperCase() + MONTHS_DA[m - 1].short.slice(1))}
                </span>
                <span className={cn('text-[10px]', isOpen ? 'opacity-80' : 'text-muted-foreground')}>
                  ({total}{added > 0 && ` · ${added}✓`})
                </span>
              </button>
            )
          })}
        </div>

        {/* Resultat-toast */}
        {result && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>
              {result.added} tilføjet til Mine opgaver
              {result.skipped > 0 && `, ${result.skipped} sprunget over (allerede tilføjet)`}.
            </span>
            <button onClick={() => setResult(null)} className="ml-auto"><X className="h-3 w-3" /></button>
          </div>
        )}

        {/* Måneds-detalje */}
        {openMonth != null && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-serif text-lg">
                {saeson(openMonth)} — {MONTHS_DA[openMonth - 1].full}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as YearWheelCategory | 'all')}
                  className="h-8 px-2 rounded-md border border-input bg-card text-xs"
                >
                  <option value="all">Alle kategorier</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value as YearWheelPriority | 'all')}
                  className="h-8 px-2 rounded-md border border-input bg-card text-xs"
                >
                  <option value="all">Alle prioriteter</option>
                  <option value="high">Høj</option>
                  <option value="medium">Middel</option>
                  <option value="low">Lav</option>
                </select>
              </div>
            </div>

            {/* Bulk-handlinger */}
            {monthTasks.some(t => !addedTemplateIds.has(t.id)) && (
              <div className="flex items-center gap-2 text-xs">
                <Button variant="ghost" size="sm" onClick={selectAllVisible}>
                  Vælg alle synlige
                </Button>
                {selected.size > 0 && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                      Ryd valg
                    </Button>
                    <span className="text-muted-foreground">{selected.size} valgt</span>
                  </>
                )}
              </div>
            )}

            {/* Confirm-step */}
            {confirmStep && selected.size > 0 ? (
              <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
                <p className="font-medium text-foreground">
                  Tilføj {selected.size} {selected.size === 1 ? 'opgave' : 'opgaver'} til Mine opgaver?
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {YEAR_WHEEL_TASKS
                    .filter(t => selected.has(t.id))
                    .map(t => <li key={t.id}>• {t.title}</li>)}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Standard-dato: {MONTHS_DA[openMonth - 1].full} {year}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleAdd} disabled={pending}>
                    {pending ? 'Tilføjer…' : `Bekræft ${selected.size}`}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmStep(false)} disabled={pending}>
                    Tilbage
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Liste */}
                <div className="space-y-2">
                  {monthTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      Ingen gøremål matcher filtrene.
                    </p>
                  ) : (
                    monthTasks.map(t => {
                      const isAdded = addedTemplateIds.has(t.id)
                      const isSelected = selected.has(t.id)
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border',
                            isAdded ? 'bg-muted/40 border-border' : 'bg-card border-border',
                            isSelected && 'border-primary bg-primary/5'
                          )}
                        >
                          {!isAdded && (
                            <button
                              type="button"
                              onClick={() => toggleSelect(t.id)}
                              className={cn(
                                'h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5',
                                isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                              )}
                              aria-label="Vælg"
                            >
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          {isAdded && (
                            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <p className="font-medium text-foreground">{t.title}</p>
                              {t.priority === 'high' && <Badge variant="warning" className="text-[9px]">Høj</Badge>}
                              {t.priority === 'low' && <Badge variant="muted" className="text-[9px]">Lav</Badge>}
                              {isAdded && <Badge variant="success" className="text-[9px]">Tilføjet</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                              <Badge variant="outline" className="text-[9px]">{CATEGORY_LABELS[t.category]}</Badge>
                              <span>{TIME_WINDOW_LABELS[t.timeWindow]}</span>
                            </div>
                            {t.tip && (
                              <p className="text-xs italic text-muted-foreground mt-1.5">💡 {t.tip}</p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {selected.size > 0 && (
                  <div className="sticky bottom-0 -mx-4 -mb-4 px-4 py-3 bg-card/95 backdrop-blur border-t border-border flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{selected.size} valgt</span>
                    <Button onClick={() => setConfirmStep(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Tilføj til Mine opgaver
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
