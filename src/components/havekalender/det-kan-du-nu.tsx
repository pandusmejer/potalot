'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MONTHS_DA, PRIMARY_CATEGORIES } from '@/lib/constants'
import type { InventoryItem, Guide } from '@/lib/types'
import { Sprout, Lightbulb, ArrowRight, Plus } from 'lucide-react'

interface Props {
  month: number
  inventory: InventoryItem[]
  guides: Guide[]
}

/**
 * "Det kan du så/plante nu" — månedsbaseret inspiration.
 *
 * To sektioner:
 * - Fra din frøbank: matchende elementer for valgte måned
 * - Inspiration: guides hvor måneden falder i en relevant periode
 */
export function DetKanDuNu({ month, inventory, guides }: Props) {
  const monthName = MONTHS_DA[month - 1].full

  // Fra din frøbank: items hvor måneden falder i sowing/plantingOut/harvest
  const fraFroebank = inventory.filter(i =>
    i.sowingMonths.includes(month) ||
    i.plantingOutMonths.includes(month) ||
    i.harvestMonths.includes(month)
  )

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
              Fra din frøbank <span className="ml-1.5 text-xs opacity-60">({fraFroebank.length})</span>
            </TabsTrigger>
            <TabsTrigger value="inspiration">
              Inspiration <span className="ml-1.5 text-xs opacity-60">({inspiration.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dine">
            {fraFroebank.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">
                Ingen elementer i din frøbank passer til {monthName} lige nu.
              </p>
            ) : (
              <div className="space-y-2">
                {fraFroebank.map(item => {
                  const cat = PRIMARY_CATEGORIES[item.primaryCategoryId]
                  const handling = decideHandling(item, month)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                    >
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
                      <Button asChild size="sm" variant="default">
                        <Link href={`/mine-planter?fromInventory=${item.id}`}>
                          <Sprout className="h-3.5 w-3.5" />
                          Så
                        </Link>
                      </Button>
                    </div>
                  )
                })}
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

function decideHandling(item: InventoryItem, month: number): string {
  if (item.sowingMonths.includes(month)) {
    return item.preCultivation ? 'Forspires denne måned' : 'Sås denne måned'
  }
  if (item.plantingOutMonths.includes(month)) return 'Plantes ud denne måned'
  if (item.harvestMonths.includes(month)) return 'Kan høstes denne måned'
  return ''
}
