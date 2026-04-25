import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { INVENTORY_STATUS_META, MONTHS_DA } from '@/lib/constants'
import type { InventoryItem } from '@/lib/types'
import { Star, Pin, Package, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Frøbank-element kort.
 */
export function InventoryCard({ item }: { item: InventoryItem }) {
  const statusMeta = INVENTORY_STATUS_META[item.status]
  const sowingPeriod = formatMonths(item.sowingMonths)

  return (
    <Link
      href={`/froebank/${item.id}`}
      className="block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex">
        {/* Thumbnail / placeholder */}
        <div className="w-24 sm:w-32 shrink-0 bg-secondary/40 flex items-center justify-center relative">
          {/* TODO (storage): faktisk billede fra MediaAsset */}
          <Package className="h-9 w-9 text-primary/30" />
          {item.isPinned && (
            <span className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center">
              <Pin className="h-3 w-3 text-accent-copper fill-accent-copper" style={{ color: 'var(--accent-copper)', fill: 'var(--accent-copper)' }} />
            </span>
          )}
          {item.isFavorite && (
            <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-1">
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
        </div>
      </div>
    </Link>
  )
}

function formatMonths(months: number[]): string {
  if (!months.length) return ''
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].short
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
