import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { FavoritePinButtons } from './favorite-pin-buttons'
import { INVENTORY_STATUS_META, MONTHS_DA } from '@/lib/constants'
import type { InventoryItem } from '@/lib/types'
import { Package, Calendar } from 'lucide-react'

/**
 * Frøbank-element kort med klikbare favorit/pin-knapper.
 */
export function InventoryCard({ item }: { item: InventoryItem }) {
  const statusMeta = INVENTORY_STATUS_META[item.status]
  const sowingPeriod = formatMonths(item.sowingMonths)

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex relative">
        {/* Thumbnail */}
        <Link href={`/froebank/${item.id}`} className="w-24 sm:w-32 shrink-0 bg-secondary/40 flex items-center justify-center">
          {item.primaryImageId ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.primaryImageId} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-9 w-9 text-primary/30" />
          )}
        </Link>

        {/* Indhold */}
        <div className="flex-1 min-w-0 flex">
          <Link href={`/froebank/${item.id}`} className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{item.name}</p>
                {item.variety && (
                  <p className="text-sm italic text-muted-foreground truncate">
                    {item.variety}
                  </p>
                )}
              </div>
              <Badge variant={(statusMeta.badgeVariant as 'muted' | 'info' | 'success' | 'warning' | 'outline') ?? 'muted'}>
                {statusMeta.label}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {item.supplier && <span>{item.supplier}</span>}
              {item.quantity != null && (
                <>
                  {item.supplier && <span>·</span>}
                  <span>{item.quantity} stk</span>
                </>
              )}
              {sowingPeriod && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Sås {sowingPeriod}
                  </span>
                </>
              )}
            </div>
          </Link>

          {/* Favorit/pin knapper — separate links for at undgå nested link */}
          <div className="px-2 py-2 sm:py-3 flex items-start">
            <FavoritePinButtons
              id={item.id}
              isFavorite={item.isFavorite}
              isPinned={item.isPinned}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function formatMonths(months: number[]): string {
  if (!months.length) return ''
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].short
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
