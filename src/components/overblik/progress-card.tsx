import { Card } from '@/components/ui/card'
import { ShoppingBasket, Sprout } from 'lucide-react'
import type { ProgressState } from '@/lib/types'
import { maanedNavn, aktuelMaaned } from '@/lib/datetime'

/**
 * Diskret gamification — ingen points eller badges.
 * Visuel fremgang: kurv fyldes, plante vokser.
 */
export function ProgressCard({ progress }: { progress: ProgressState }) {
  const procent = progress.totalTasks > 0
    ? Math.round((progress.completedTasks / progress.totalTasks) * 100)
    : 0

  const maaned = maanedNavn(aktuelMaaned())

  return (
    <Card className="p-5 bg-gradient-to-br from-secondary/40 to-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Din fremgang i {maaned}
          </p>
          <p className="font-serif text-3xl text-foreground mt-1">
            {progress.completedTasks}<span className="text-muted-foreground text-xl">/{progress.totalTasks}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            opgaver fuldført
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="relative h-14 w-14 flex items-center justify-center">
            {procent >= 50 ? (
              <ShoppingBasket className="h-10 w-10 text-accent-copper" style={{ color: 'var(--accent-copper)' }} />
            ) : (
              <Sprout className="h-10 w-10 text-primary" />
            )}
          </div>
          <span className="text-xs font-medium text-foreground">{procent}%</span>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${procent}%` }}
        />
      </div>
    </Card>
  )
}
