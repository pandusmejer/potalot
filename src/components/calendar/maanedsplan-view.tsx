import Link from 'next/link'
import { genererMaanedsplan, AKTIVITET_LABEL, MAANED_FULD, type MaanedsAktivitet } from '@/lib/calendar/maanedsplan'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Sprout, Package, TreePine, Wheat } from 'lucide-react'
import type { PlantGuide } from '@/lib/types'

const AKTIVITET_IKON = {
  so_inde: Sprout,
  so_ude: Package,
  plant_ud: TreePine,
  host: Wheat,
} as const

const AKTIVITET_FARVE = {
  so_inde: 'text-green-600 bg-green-50 border-green-200',
  so_ude: 'text-lime-600 bg-lime-50 border-lime-200',
  plant_ud: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  host: 'text-amber-600 bg-amber-50 border-amber-200',
} as const

export function MaanedsplanView({ guides, maaned }: { guides: PlantGuide[]; maaned: string }) {
  const plan = genererMaanedsplan(guides, maaned)

  // Grupper efter aktivitet
  const grupperet: Record<string, MaanedsAktivitet[]> = {}
  for (const p of plan) {
    if (!grupperet[p.aktivitet]) grupperet[p.aktivitet] = []
    grupperet[p.aktivitet].push(p)
  }

  const orden: Array<MaanedsAktivitet['aktivitet']> = ['so_inde', 'so_ude', 'plant_ud', 'host']

  return (
    <Card>
      <CardHeader>
        <CardTitle>Det kan du i {MAANED_FULD[maaned] ?? maaned}</CardTitle>
      </CardHeader>

      {plan.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Intet bestemt planlagt denne måned — en god tid at hvile jorden eller læse lidt.
        </p>
      ) : (
        <div className="space-y-4">
          {orden.map(akt => {
            const items = grupperet[akt]
            if (!items || items.length === 0) return null
            const Icon = AKTIVITET_IKON[akt]
            return (
              <div key={akt}>
                <h3 className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border mb-2 ${AKTIVITET_FARVE[akt]}`}>
                  <Icon className="h-3 w-3" />
                  {AKTIVITET_LABEL[akt]}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(item => (
                    <Link
                      key={`${akt}-${item.guide.id}`}
                      href={`/guides/${item.guide.slug}`}
                      className="px-2.5 py-1 rounded-full text-sm bg-card border border-border text-foreground hover:bg-accent/50 transition-colors"
                    >
                      {item.guide.name_da}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
