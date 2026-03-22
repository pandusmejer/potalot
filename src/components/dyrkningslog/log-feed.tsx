'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { LOG_TYPES, type LogType } from '@/lib/constants'
import type { Note } from '@/lib/types'
import {
  BookOpen, Plus, Search, X, Eye, Apple, AlertTriangle,
  Lightbulb, Flag, Cloud, PenLine, Sprout, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

const LOG_ICONS: Record<string, React.ReactNode> = {
  observation: <Eye className="h-3.5 w-3.5" />,
  harvest: <Apple className="h-3.5 w-3.5" />,
  problem: <AlertTriangle className="h-3.5 w-3.5" />,
  learning: <Lightbulb className="h-3.5 w-3.5" />,
  milestone: <Flag className="h-3.5 w-3.5" />,
  weather: <Cloud className="h-3.5 w-3.5" />,
  other: <PenLine className="h-3.5 w-3.5" />,
}

function getLogType(note: Note): LogType | null {
  if (!note.tags) return null
  for (const tag of note.tags) {
    if (tag in LOG_TYPES) return tag as LogType
  }
  return null
}

function formatDateDa(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

function getMonthYear(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })
}

interface LogFeedProps {
  notes: (Note & { plant?: { name: string } | null })[]
  plants: { id: string; name: string }[]
}

export function LogFeed({ notes, plants }: LogFeedProps) {
  const [search, setSearch] = useState('')
  const [plantFilter, setPlantFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<LogType | null>(null)

  // Filter notes
  const filtered = useMemo(() => {
    let result = [...notes]

    if (plantFilter) {
      result = result.filter(n => n.plant_id === plantFilter)
    }

    if (typeFilter) {
      result = result.filter(n => n.tags?.includes(typeFilter))
    }

    if (search.trim()) {
      const s = search.toLowerCase().trim()
      result = result.filter(n =>
        n.title.toLowerCase().includes(s) ||
        n.content.toLowerCase().includes(s)
      )
    }

    return result
  }, [notes, plantFilter, typeFilter, search])

  // Group by month
  const grouped = useMemo(() => {
    const groups: { month: string; entries: typeof filtered }[] = []
    let currentMonth = ''

    for (const note of filtered) {
      const month = getMonthYear(note.note_date)
      if (month !== currentMonth) {
        currentMonth = month
        groups.push({ month, entries: [] })
      }
      groups[groups.length - 1].entries.push(note)
    }

    return groups
  }, [filtered])

  // Stats
  const thisYear = new Date().getFullYear()
  const yearNotes = notes.filter(n => n.note_date.startsWith(String(thisYear)))
  const uniquePlants = new Set(notes.filter(n => n.plant_id).map(n => n.plant_id)).size

  const hasFilters = !!search || !!plantFilter || !!typeFilter

  return (
    <div className="space-y-6">
      {/* ========== Stats ========== */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
          <BookOpen className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-lg font-bold text-foreground">{yearNotes.length}</p>
            <p className="text-xs text-muted-foreground">Indlæg i {thisYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
          <Sprout className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-lg font-bold text-foreground">{uniquePlants}</p>
            <p className="text-xs text-muted-foreground">Planter logget</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-lg font-bold text-foreground">{notes.length}</p>
            <p className="text-xs text-muted-foreground">Total indlæg</p>
          </div>
        </div>
      </div>

      {/* ========== Filters ========== */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Søg i loggen..."
              className="pl-8 h-9 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {plants.length > 0 && (
            <select
              value={plantFilter ?? ''}
              onChange={e => setPlantFilter(e.target.value || null)}
              className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
            >
              <option value="">Alle planter</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <Link href="/dyrkningslog/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ny log
            </Button>
          </Link>
        </div>

        {/* Log type pills */}
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(LOG_TYPES).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(typeFilter === key ? null : key as LogType)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === key
                  ? meta.color
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {LOG_ICONS[key]}
              {meta.label}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setPlantFilter(null); setTypeFilter(null) }}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
            >
              Ryd filtre
            </button>
          )}
        </div>
      </div>

      {/* ========== Timeline Feed ========== */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title={hasFilters ? 'Ingen resultater' : 'Ingen log-indlæg endnu'}
          description={
            hasFilters
              ? 'Prøv at ændre dine filtre.'
              : 'Start med at dokumentere din dyrkning — observationer, høst, problemer og læring.'
          }
          action={
            <Link href="/dyrkningslog/new">
              <Button size="sm">Opret indlæg</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.month}>
              {/* Month header */}
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 sticky top-0 bg-background py-1 z-10">
                {group.month}
              </h2>

              {/* Timeline entries */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-1">
                  {group.entries.map((note) => {
                    const logType = getLogType(note)
                    const logMeta = logType ? LOG_TYPES[logType] : null
                    const otherTags = note.tags?.filter(t => !(t in LOG_TYPES)) ?? []

                    return (
                      <Link key={note.id} href={`/dyrkningslog/${note.id}`} className="block">
                        <div className="flex gap-3 group relative pl-1">
                          {/* Timeline dot */}
                          <div className={`w-[10px] h-[10px] rounded-full mt-[18px] shrink-0 z-10 ring-2 ring-background ${
                            logMeta ? logMeta.color.split(' ')[0] : 'bg-muted'
                          }`} />

                          {/* Card */}
                          <div className="flex-1 rounded-lg border border-border bg-card p-3.5 group-hover:border-primary/30 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {formatDateDa(note.note_date)}
                                  </span>
                                  {logMeta && (
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${logMeta.color}`}>
                                      {LOG_ICONS[logType!]}
                                      {logMeta.label}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-foreground line-clamp-1">{note.title}</p>
                              </div>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{note.content}</p>

                            {/* Meta row */}
                            {(note.plant || otherTags.length > 0) && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                {note.plant && (
                                  <Badge className="bg-green-100 text-green-800 text-[10px]">
                                    <Sprout className="h-2.5 w-2.5 mr-0.5" />
                                    {note.plant.name}
                                  </Badge>
                                )}
                                {otherTags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
