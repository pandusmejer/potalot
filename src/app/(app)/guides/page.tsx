export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GUIDE_CATEGORIES } from '@/lib/constants'
import Link from 'next/link'

export default async function GuidesPage() {
  const supabase = await createClient()

  const { data: guides } = await supabase
    .from('plant_guides')
    .select('*')
    .order('category')
    .order('name_da')

  const grouped = new Map<string, typeof guides>()
  for (const guide of guides ?? []) {
    if (!grouped.has(guide.category)) grouped.set(guide.category, [])
    grouped.get(guide.category)!.push(guide)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dyrkningsguides</h1>
        <p className="text-sm text-muted-foreground">Lær at dyrke dine planter optimalt i Danmark</p>
      </div>

      {Array.from(grouped.entries()).map(([category, catGuides]) => {
        const catMeta = GUIDE_CATEGORIES[category as keyof typeof GUIDE_CATEGORIES]
        return (
          <div key={category}>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              {catMeta && <Badge className={catMeta.color}>{catMeta.label}</Badge>}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catGuides!.map((guide) => (
                <Link key={guide.id} href={`/guides/${guide.slug}`}>
                  <Card className="hover:border-primary/30 transition-colors h-full">
                    <p className="text-sm font-medium text-foreground">{guide.name_da}</p>
                    {guide.name_en && (
                      <p className="text-xs text-muted-foreground italic">{guide.name_en}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{guide.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      {guide.sow_indoor_start && <span>Så: {guide.sow_indoor_start}</span>}
                      {guide.harvest_start && <span>Høst: {guide.harvest_start}–{guide.harvest_end}</span>}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}