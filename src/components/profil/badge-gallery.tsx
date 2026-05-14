import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award } from 'lucide-react'
import { Emblem } from '@/components/ui/emblem'
import {
  BADGE_LIST, BADGE_CATEGORY_LABELS, type BadgeId, type BadgeMeta,
} from '@/lib/badges-shared'
import { cn } from '@/lib/utils'

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

  // Filtrer hemmelige badges fra det synlige katalog medmindre de er optjent.
  // Det er hele charmen ved hemmelige badges — de skal dukke op som overraskelser.
  const visibleBadges = BADGE_LIST.filter(b => !b.secret || earnedMap.has(b.id))
  const earnedCount = earnedMap.size
  const totalCount = visibleBadges.length

  // Gruppér badges efter kategori
  const byCategory: Record<string, BadgeMeta[]> = {}
  for (const b of visibleBadges) {
    if (!byCategory[b.category]) byCategory[b.category] = []
    byCategory[b.category].push(b)
  }
  const categoryOrder: BadgeMeta['category'][] = ['saeson', 'dyrkning', 'samler', 'laering', 'social']

  // Velkomst-tilstand for nye brugere uden optjent badges
  if (earnedCount === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6 text-center space-y-2">
          <Award className="h-7 w-7 text-amber-700/60 mx-auto" />
          <p className="font-medium text-foreground">
            Dit galleri venter på sit første mærke
          </p>
          <p className="text-sm text-muted-foreground italic max-w-md mx-auto">
            Når du sår dit første frø, tilføjer din første frøpose
            eller logger den første handling — vil dine badges begynde
            at samle sig her.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-700" />
            Mit badge-galleri
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
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs uppercase tracking-wider font-semibold text-foreground">
                  {BADGE_CATEGORY_LABELS[cat]}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {earnedInCat}/{list.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
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
          Genindlæs siden for at køre baggrundstjek igen.
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
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        isEarned
          ? 'bg-card border-border'
          : 'bg-muted/30 border-dashed border-border'
      )}
    >
      <Emblem
        icon={badge.icon}
        category={badge.category}
        size="md"
        locked={!isEarned}
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', isEarned ? 'text-foreground' : 'text-muted-foreground')}>
          {badge.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
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
