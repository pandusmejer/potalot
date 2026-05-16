import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Sprout, TreePine, Wheat, Droplets, Scissors, Leaf, ArrowRight } from 'lucide-react'
import type { WeekSuggestion } from '@/lib/denne-uge'
import type { ComponentType, SVGProps } from 'react'

const ICON_MAP: Record<WeekSuggestion['icon'], ComponentType<SVGProps<SVGSVGElement>>> = {
  Sprout, TreePine, Wheat, Droplets, Scissors, Leaf,
}

const KIND_ACCENT: Record<WeekSuggestion['kind'], string> = {
  sow: 'bg-green-100 text-green-800 border-green-200',
  plant_out: 'bg-lime-100 text-lime-800 border-lime-200',
  harvest: 'bg-amber-100 text-amber-900 border-amber-200',
  tend: 'bg-blue-100 text-blue-800 border-blue-200',
}

interface Props {
  suggestions: WeekSuggestion[]
  monthName: string
}

/**
 * "Denne uge i haven" — det vigtigste lag på Kalender-siden.
 *
 * Personaliserede anbefalinger udledt af brugerens frøbank + aktive
 * planter + aktuel måned. Står ØVERST fordi det er svar på spørgsmålet
 * 'hvad skal jeg gøre nu?'.
 */
export function DenneUge({ suggestions, monthName }: Props) {
  return (
    <Card className="bg-gradient-to-br from-primary/8 via-secondary/20 to-card border-primary/20 overflow-hidden relative">
      <div className="absolute inset-0 bg-pattern-botanical opacity-25 pointer-events-none" />
      <CardContent className="relative py-5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
          <h2 className="font-serif text-xl text-foreground">Denne uge i haven</h2>
          <span className="text-xs text-muted-foreground">
            Ud fra din frøbank og dine planter i {monthName.toLowerCase()}
          </span>
        </div>

        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-2">
            Ingen presserende handlinger lige nu. Tjek dine gøremål nedenfor
            — eller nyd en kop kaffe blandt planterne.
          </p>
        ) : (
          <div className="space-y-2">
            {suggestions.map(s => {
              const Icon = ICON_MAP[s.icon] ?? Sprout
              return (
                <Link
                  key={s.id}
                  href={s.href}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3 hover:bg-card hover:shadow-sm transition-all group"
                >
                  <span
                    className={`h-9 w-9 rounded-full border flex items-center justify-center shrink-0 ${KIND_ACCENT[s.kind]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
