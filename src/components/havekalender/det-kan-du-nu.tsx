'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MONTHS_DA, PRIMARY_CATEGORIES } from '@/lib/constants'
import type { InventoryItem, Guide, Plant } from '@/lib/types'
import { Sprout, Lightbulb, ArrowRight, X, Eye, EyeOff, CheckCircle2, Leaf } from 'lucide-react'

interface Props {
  month: number
  inventory: InventoryItem[]
  guides: Guide[]
  plants: Plant[]
}

/**
 * "Det kan du så/plante nu" — visuel carousel-inspiration.
 *
 * Anna's brainstorm: 'Du vil have: uh jeg får lyst til at dyrke den.
 * Ikke: database-hit fundet.' Derfor billed-cards i horisontal
 * carousel frem for tabel-rækker.
 *
 * Logik bevaret: auto-filter af aktive dyrkninger, manuel skip
 * (localStorage pr. måned/år), vis-skjulte-toggle.
 */
export function DetKanDuNu({ month, inventory, guides, plants }: Props) {
  const monthName = MONTHS_DA[month - 1].full
  const year = new Date().getFullYear()
  const dismissKey = `potalot-dismissed-${year}-${month}`

  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [visSkjulte, setVisSkjulte] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(dismissKey)
      if (raw) setDismissed(new Set(JSON.parse(raw)))
    } catch { /* localStorage utilgængelig */ }
  }, [dismissKey])

  function persist(next: Set<string>) {
    try {
      localStorage.setItem(dismissKey, JSON.stringify(Array.from(next)))
    } catch { /* ignorér */ }
  }

  function skipItem(itemId: string) {
    const next = new Set(dismissed)
    next.add(itemId)
    setDismissed(next)
    persist(next)
  }

  function unskipItem(itemId: string) {
    const next = new Set(dismissed)
    next.delete(itemId)
    setDismissed(next)
    persist(next)
  }

  const activeFromItem = new Set(
    plants
      .filter(p => !p.isArchived && p.sourceElementId)
      .filter(p => !p.sowDate || p.sowDate.startsWith(String(year)))
      .map(p => p.sourceElementId as string)
  )

  const allRelevant = inventory.filter(i =>
    i.sowingMonths.includes(month) ||
    i.plantingOutMonths.includes(month) ||
    i.harvestMonths.includes(month)
  )

  const synlige = allRelevant.filter(i =>
    !activeFromItem.has(i.id) && !dismissed.has(i.id)
  )
  const skjulteFraSkip = allRelevant.filter(i => dismissed.has(i.id))
  const aktivIAar = allRelevant.filter(i => activeFromItem.has(i.id))

  const navnIFroebank = new Set(inventory.map(i => `${i.name}|${i.variety ?? ''}`))
  const inspiration = guides.filter(g => {
    const key = `${g.plantName}|${g.variety ?? ''}`
    if (navnIFroebank.has(key)) return false
    const allMonths = [
      ...g.quickFacts.sowingMonths,
      ...g.quickFacts.directSowingMonths,
      ...g.quickFacts.plantingOutMonths,
      ...g.quickFacts.harvestMonths,
    ]
    return allMonths.includes(month)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent-copper" style={{ color: 'var(--accent-copper)' }} />
          Det kan du så eller plante i {monthName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dine">
          <TabsList>
            <TabsTrigger value="dine">
              Fra din frøbank <span className="ml-1.5 text-xs opacity-60">({synlige.length})</span>
            </TabsTrigger>
            <TabsTrigger value="inspiration">
              Inspiration <span className="ml-1.5 text-xs opacity-60">({inspiration.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dine">
            {synlige.length === 0 && aktivIAar.length === 0 && skjulteFraSkip.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">
                Ingen elementer i din frøbank passer til {monthName} lige nu.
              </p>
            ) : (
              <div className="space-y-4">
                {synlige.length > 0 && (
                  <Carousel>
                    {synlige.map(item => (
                      <FroeCard
                        key={item.id}
                        item={item}
                        month={month}
                        onSkip={() => skipItem(item.id)}
                      />
                    ))}
                  </Carousel>
                )}

                {/* Allerede aktiv dyrkning */}
                {aktivIAar.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      Allerede i gang i år ({aktivIAar.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {aktivIAar.map(item => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted/50 border border-border text-muted-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3 text-green-700" />
                          {item.name}{item.variety ? ` — ${item.variety}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skjulte */}
                {skjulteFraSkip.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisSkjulte(v => !v)}
                      className="text-xs text-muted-foreground"
                    >
                      {visSkjulte ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {visSkjulte ? 'Skjul' : `Vis ${skjulteFraSkip.length} skippet`}
                    </Button>
                    {visSkjulte && (
                      <div className="opacity-60 mt-2">
                        <Carousel>
                          {skjulteFraSkip.map(item => (
                            <FroeCard
                              key={item.id}
                              item={item}
                              month={month}
                              onUnskip={() => unskipItem(item.id)}
                              skipped
                            />
                          ))}
                        </Carousel>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inspiration">
            {inspiration.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">
                Ingen inspiration til denne måned.
              </p>
            ) : (
              <Carousel>
                {inspiration.slice(0, 12).map(g => (
                  <GuideCard key={g.id} guide={g} />
                ))}
              </Carousel>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/** Horisontal scroll-snap container. */
function Carousel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-hide">
      {children}
    </div>
  )
}

/** Billed-thumbnail eller botanisk placeholder. */
function Thumb({ url }: { url?: string | null }) {
  if (url) {
    return (
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
    )
  }
  return (
    <div className="aspect-[4/3] w-full bg-pattern-botanical bg-secondary/40 flex items-center justify-center">
      <Leaf className="h-7 w-7 text-primary/30" />
    </div>
  )
}

function FroeCard({
  item, month, onSkip, onUnskip, skipped = false,
}: {
  item: InventoryItem
  month: number
  onSkip?: () => void
  onUnskip?: () => void
  skipped?: boolean
}) {
  const cat = PRIMARY_CATEGORIES[item.primaryCategoryId]
  const handling = decideHandling(item, month)
  return (
    <div className="snap-start shrink-0 w-44 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="relative">
        <Thumb url={item.primaryImageId} />
        {!skipped && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition"
            title="Skip — vis ikke i denne måned"
            aria-label="Skip forslag"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="p-2.5 flex-1 flex flex-col">
        <p className="text-sm font-medium text-foreground leading-tight line-clamp-1">
          {item.name}
        </p>
        {item.variety && (
          <p className="text-xs italic text-muted-foreground line-clamp-1">{item.variety}</p>
        )}
        <p className="text-[11px] text-primary mt-1">{handling}</p>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground mt-0.5">
          {cat?.name ?? item.primaryCategoryId}
        </span>
        <div className="mt-2 pt-2 border-t border-border/60">
          {skipped ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onUnskip}
              className="w-full text-xs h-7"
            >
              <Eye className="h-3 w-3" />
              Fortryd skip
            </Button>
          ) : (
            <Button asChild size="sm" className="w-full text-xs h-7">
              <Link href={`/mine-planter?fromInventory=${item.id}`}>
                <Sprout className="h-3 w-3" />
                Så
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link
      href={`/guides/${guide.id}`}
      className="snap-start shrink-0 w-44 rounded-xl border border-border bg-card overflow-hidden flex flex-col hover:shadow-sm transition-shadow group"
    >
      <Thumb url={guide.primaryImageId} />
      <div className="p-2.5 flex-1 flex flex-col">
        <p className="text-sm font-medium text-foreground leading-tight line-clamp-1">
          {guide.plantName}
        </p>
        {guide.variety && (
          <p className="text-xs italic text-muted-foreground line-clamp-1">{guide.variety}</p>
        )}
        {guide.summary && (
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 flex-1">
            {guide.summary}
          </p>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-primary mt-2 pt-2 border-t border-border/60 group-hover:gap-1.5 transition-all">
          Se guide <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}

function decideHandling(item: InventoryItem, month: number): string {
  if (item.sowingMonths.includes(month)) {
    return item.preCultivation ? 'Forspires nu' : 'Sås nu'
  }
  if (item.plantingOutMonths.includes(month)) return 'Plantes ud nu'
  if (item.harvestMonths.includes(month)) return 'Kan høstes nu'
  return ''
}
