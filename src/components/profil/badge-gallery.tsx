import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sparkles, Award, Gift, Users, Sprout, BookOpen, Leaf, Wheat, Flag,
  Package, GitFork, Lock,
} from 'lucide-react'
import {
  BADGES, BADGE_LIST, BADGE_CATEGORY_LABELS, type BadgeId, type BadgeMeta,
} from '@/lib/badges-shared'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  Sparkles, Award, Gift, Users, Sprout, BookOpen, Leaf, Wheat, Flag,
  Package, GitFork,
}

const COLOR_CLASS = {
  green: 'bg-green-100 text-green-800 border-green-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
}

interface Props {
  /** ID'er + datoer for badges brugeren har optjent */
  earned: Array<{ badgeId: BadgeId; awardedAt: string }>
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function BadgeGallery({ earned }: Props) {
  const earnedMap = new Map(earned.map(e => [e.badgeId, e.awardedAt]))
  const earnedCount = earnedMap.size
  const totalCount = BADGE_LIST.length

  // Gruppér badges efter kategori
  const byCategory: Record<string, BadgeMeta[]> = {}
  for (const b of BADGE_LIST) {
    if (!byCategory[b.category]) byCategory[b.category] = []
    byCategory[b.category].push(b)
  }
  const categoryOrder: BadgeMeta['category'][] = ['dyrkning', 'samler', 'laering', 'social']

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-600" />
            Mine badges
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {earnedCount} af {totalCount} optjent
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {categoryOrder.map(cat => {
          const list = byCategory[cat]
          if (!list || list.length === 0) return null
          const earnedInCat = list.filter(b => earnedMap.has(b.id)).length
          return (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-foreground">
                  {BADGE_CATEGORY_LABELS[cat]}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {earnedInCat}/{list.length}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {list.map(b => {
                  const isEarned = earnedMap.has(b.id)
                  const awardedAt = earnedMap.get(b.id)
                  return (
                    <BadgeRow
                      key={b.id}
                      badge={b}
                      isEarned={isEarned}
                      awardedAt={awardedAt}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
        <p className="text-[10px] text-muted-foreground italic pt-2 border-t border-border">
          Badges tildeles automatisk når du gør det relevante i appen.
          Hvis du allerede har gjort noget men ikke ser badge, så genindlæs siden — bagrundsjekket kører ved hvert besøg.
        </p>
      </CardContent>
    </Card>
  )
}

function BadgeRow({
  badge, isEarned, awardedAt,
}: {
  badge: BadgeMeta
  isEarned: boolean
  awardedAt: string | undefined
}) {
  const Icon = ICON_MAP[badge.icon]
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        isEarned
          ? 'bg-card border-border'
          : 'bg-muted/30 border-dashed border-border'
      )}
    >
      <div
        className={cn(
          'h-9 w-9 rounded-full flex items-center justify-center shrink-0 border',
          isEarned ? COLOR_CLASS[badge.color] : 'bg-muted text-muted-foreground border-border'
        )}
      >
        {isEarned ? <Icon className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', isEarned ? 'text-foreground' : 'text-muted-foreground')}>
          {badge.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isEarned ? badge.description : (badge.hint ?? badge.description)}
        </p>
        {isEarned && awardedAt && (
          <p className="text-[10px] text-muted-foreground/80 mt-1 italic">
            Optjent {formatDate(awardedAt)}
          </p>
        )}
      </div>
    </div>
  )
}
