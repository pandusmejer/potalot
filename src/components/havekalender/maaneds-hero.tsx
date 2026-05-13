import { Card, CardContent } from '@/components/ui/card'
import { MONTHS_DA } from '@/lib/constants'
import { MAANEDS_STEMNING } from '@/lib/maaneds-stemning'
import { saeson } from '@/lib/datetime'
import { Sparkles } from 'lucide-react'

/**
 * Måneds-hero med stemnings-tekst. Står mellem årshjul (navigation)
 * og selve sektionerne, og giver hver måned karakter.
 */
export function MaanedsHero({ month, year }: { month: number; year: number }) {
  const monthName = MONTHS_DA[month - 1].full
  const stemning = MAANEDS_STEMNING[month]
  const sa = saeson(month)

  return (
    <Card className="bg-gradient-to-br from-secondary/40 via-card to-card border-secondary/50 overflow-hidden relative">
      {/* Subtilt botanisk mønster i baggrunden */}
      <div className="absolute inset-0 bg-pattern-botanical opacity-30 pointer-events-none" />
      <CardContent className="relative py-5 sm:py-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent-copper shrink-0 mt-1" style={{ color: 'var(--accent-copper)' }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground">
                {monthName} {year}
              </h2>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {sa}
              </span>
            </div>
            <p className="font-serif text-lg text-primary mt-1">
              {stemning.tagline}
            </p>
            <p className="text-sm text-foreground/80 mt-1 leading-relaxed max-w-xl">
              {stemning.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
