import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { DIFFICULTY_META, MONTHS_DA, PRIMARY_CATEGORIES } from '@/lib/constants'
import type { Guide } from '@/lib/types'
import { BookOpen, Star, ShieldCheck, User } from 'lucide-react'
import { DeleteGuideButton } from '@/components/guides/delete-guide-button'

/**
 * Guide-kort til oversigten.
 */
export function GuideCard({ guide, canDelete = false }: { guide: Guide; canDelete?: boolean }) {
  const cat = PRIMARY_CATEGORIES[guide.primaryCategoryId]
  const difficultyMeta = DIFFICULTY_META[guide.difficulty]
  const sowingPeriod = formatMonths(guide.quickFacts.sowingMonths.length ? guide.quickFacts.sowingMonths : guide.quickFacts.directSowingMonths)
  const isMaster = guide.visibility === 'public'

  return (
    <div className="relative">
      <Link
        href={`/guides/${guide.id}`}
        className={`block rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${
          isMaster ? 'border-green-200 bg-card' : 'border-border bg-card'
        }`}
      >
        <div className="flex">
          {/* Thumbnail / placeholder */}
          <div className={`w-24 sm:w-32 shrink-0 flex items-center justify-center ${
            isMaster ? 'bg-pattern-botanical bg-green-50' : 'bg-pattern-botanical bg-secondary/30'
          }`}>
            <BookOpen className={`h-8 w-8 ${isMaster ? 'text-green-700/60' : 'text-primary/40'}`} />
          </div>

          <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-1.5">
            <div className="flex items-start gap-1.5 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{guide.plantName}</p>
                {guide.variety && (
                  <p className="text-sm italic text-muted-foreground truncate">
                    {guide.variety}
                  </p>
                )}
              </div>
              {isMaster ? (
                <Badge variant="success" className="text-[10px] shrink-0 gap-0.5">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Master
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] shrink-0 gap-0.5">
                  <User className="h-2.5 w-2.5" />
                  Min
                </Badge>
              )}
              <Badge variant="muted" className="text-[10px] shrink-0">{cat.name}</Badge>
              {/* Plads-holder så Slet-knappen ikke overlapper badges */}
              {canDelete && <span className="block w-16 shrink-0" aria-hidden="true" />}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {guide.summary}
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-auto pt-1">
              <span className="inline-flex items-center gap-0.5">
                {Array.from({ length: difficultyMeta.stars }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
                {Array.from({ length: 3 - difficultyMeta.stars }).map((_, i) => (
                  <Star key={`e${i}`} className="h-3 w-3 text-muted-foreground/30" />
                ))}
              </span>
              <span>·</span>
              <span>{difficultyMeta.label}</span>
              {sowingPeriod && (
                <>
                  <span>·</span>
                  <span>Sås {sowingPeriod}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
      {canDelete && (
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DeleteGuideButton
            guideId={guide.id}
            guideTitle={guide.plantName}
            isMaster={isMaster}
          />
        </div>
      )}
    </div>
  )
}

function formatMonths(months: number[]): string {
  if (!months.length) return ''
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].short
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
