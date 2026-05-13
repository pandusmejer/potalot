'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MONTHS_DA, PRIMARY_CATEGORIES } from '@/lib/constants'
import type { InventoryItem, Guide, Plant } from '@/lib/types'
import { Sprout, Lightbulb, ArrowRight, Plus, X, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

interface Props {
  month: number
  inventory: InventoryItem[]
  guides: Guide[]
  plants: Plant[]
}

/**
 * "Det kan du så/plante nu" — månedsbaseret inspiration.
 *
 * Tre sektioner / filter-logikker:
 * - Auto-filter: items hvor brugeren allerede har en aktiv plante med
 *   sourceElementId pegende tilbage på item bliver skjult (du har
 *   allerede startet dyrkningen i år)
 * - Manuel skip: brugeren kan klikke ✕ for at skjule et item resten af
 *   måneden (gemmes i localStorage pr. måned/år, ingen DB)
 * - Vis skjulte: toggle hvis brugeren har skippet noget hun fortryder
 */
export function DetKanDuNu({ month, inventory, guides, plants }: Props) {
  const monthName = MONTHS_DA[month - 1].full
  const year = new Date().getFullYear()
  const dismissKey = `potalot-dismissed-${year}-${month}`

  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [visSkjulte, setVisSkjulte] = useState(false)

  // Læs dismissed fra localStorage ved mount
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

  // ID-set over inventory-items hvor brugeren allerede har en aktiv plante.
  // En 'aktiv plante' = !isArchived og sowDate i indeværende år (så vi ikke
  // permanent skjuler items fordi de blev sået sidste år).
  const activeFromItem = new Set(
    plants
      .filter(p => !p.isArchived && p.sourceElementId)
      .filter(p => !p.sowDate || p.sowDate.startsWith(String(year)))
      .map(p => p.sourceElementId as string)
  )

  // Items i frøbank der matcher måneden
  const allRelevant = inventory.filter(i =>
    i.sowingMonths.includes(month) ||
    i.plantingOutMonths.includes(month) ||
    i.harvestMonths.includes(month)
  )

  // Synlige = ikke aktivt sået + ikke manuelt skippet
  const synlige = allRelevant.filter(i =>
    !activeFromItem.has(i.id) && !dismissed.has(i.id)
  )
  const skjulteFraSkip = allRelevant.filter(i => dismissed.has(i.id))
  const aktivIAar = allRelevant.filter(i => activeFromItem.has(i.id))

  // Inspiration fra guides (filtrer dem hvor brugeren ikke allerede har det i frøbank)
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
              <div className="space-y-2">
                {synlige.map(item => (
                  <SuggestionRow
                    key={item.id}
                    item={item}
                    month={month}
                    onSkip={() => skipItem(item.id)}
                  />
                ))}

                {/* Allerede aktiv dyrkning: stadig synlig, men nedtonet med 'Sået'-mærke */}
                {aktivIAar.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-border space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Allerede i gang i år ({aktivIAar.length})
                    </p>
                    {aktivIAar.map(item => (
                      <AlreadyActiveRow key={item.id} item={item} />
                    ))}
                  </div>
                )}

                {/* Skjulte */}
                {skjulteFraSkip.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-border">
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
                      <div className="space-y-2 mt-2 opacity-60">
                        {skjulteFraSkip.map(item => (
                          <SuggestionRow
                            key={item.id}
                            item={item}
                            month={month}
                            onUnskip={() => unskipItem(item.id)}
                            skipped
                          />
                        ))}
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
              <div className="space-y-2">
                {inspiration.slice(0, 8).map(g => (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground truncate">{g.plantName}</p>
                        {g.variety && (
                          <span className="text-sm italic text-muted-foreground truncate">
                            {g.variety}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {g.summary}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/guides/${g.id}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" disabled>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SuggestionRow({
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
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground truncate">{item.name}</p>
          {item.variety && (
            <span className="text-sm italic text-muted-foreground truncate">
              {item.variety}
            </span>
          )}
          <Badge variant="muted" className="text-[10px]">{cat.name}</Badge>
        </div>
        <p className="text-xs text-primary mt-0.5">{handling}</p>
      </div>
      {skipped ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onUnskip}
          title="Vis forslaget igen"
        >
          <Eye className="h-3.5 w-3.5" />
          Fortryd skip
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="default">
            <Link href={`/mine-planter?fromInventory=${item.id}`}>
              <Sprout className="h-3.5 w-3.5" />
              Så
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onSkip}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Skip — vis ikke dette forslag i denne måned"
            aria-label="Skip forslag"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

function AlreadyActiveRow({ item }: { item: InventoryItem }) {
  const cat = PRIMARY_CATEGORIES[item.primaryCategoryId]
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 opacity-80">
      <CheckCircle2 className="h-4 w-4 text-green-700 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground truncate">{item.name}</p>
          {item.variety && (
            <span className="text-sm italic text-muted-foreground truncate">
              {item.variety}
            </span>
          )}
          <Badge variant="muted" className="text-[10px]">{cat.name}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Du har allerede en aktiv dyrkning af denne i {new Date().getFullYear()}.
        </p>
      </div>
    </div>
  )
}

function decideHandling(item: InventoryItem, month: number): string {
  if (item.sowingMonths.includes(month)) {
    return item.preCultivation ? 'Forspires denne måned' : 'Sås denne måned'
  }
  if (item.plantingOutMonths.includes(month)) return 'Plantes ud denne måned'
  if (item.harvestMonths.includes(month)) return 'Kan høstes denne måned'
  return ''
}
