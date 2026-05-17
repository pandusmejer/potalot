import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { FavoritePinButtons } from './favorite-pin-buttons'
import { INVENTORY_STATUS_META, MONTHS_DA, PRIMARY_CATEGORIES } from '@/lib/constants'
import { plantColor } from '@/lib/plant-color'
import type { InventoryItem } from '@/lib/types'
import { Leaf, Calendar, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  item: InventoryItem
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

/**
 * Frøbank-element: flad mættet plante-farveblok med fritlagt
 * motiv + fed sans-navn, skarp kant ned til en hvid datasektion.
 */
export function InventoryCard({ item, selectMode = false, selected = false, onToggleSelect }: Props) {
  const statusMeta = INVENTORY_STATUS_META[item.status]
  const sowingPeriod = formatMonths(item.sowingMonths)
  const { field } = plantColor(item.name, item.variety)
  const kicker = PRIMARY_CATEGORIES[item.primaryCategoryId]?.name ?? 'Frøbank'

  const remaining = item.seedCount != null ? (item.seedsRemaining ?? item.seedCount) : null
  const countLabel =
    remaining != null ? `${remaining} frø tilbage`
    : item.quantity != null ? `${item.quantity} stk`
    : null

  return (
    <Card variant={item.isPinned ? 'elevated' : 'default'} className="relative overflow-hidden">
      <Link href={`/froebank/${item.id}`} className="block">
        {/* Flad plante-farveblok — én mættet farve, ingen gradient */}
        <div
          className="relative h-72 overflow-hidden px-5 pt-5"
          style={{ backgroundColor: field }}
        >
          {/* Kicker + navn */}
          <div className="relative max-w-[78%]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
              {kicker}
            </p>
            <h3 className="mt-1 truncate font-sans text-2xl font-bold leading-tight text-white">
              {item.name}
            </h3>
            {item.variety && (
              <p className="truncate text-sm text-white/80">{item.variety}</p>
            )}
          </div>

          {/* Fritlagt motiv */}
          <div className="absolute inset-x-0 bottom-0 top-24 flex items-end justify-center pb-3">
            <div className="absolute bottom-5 h-5 w-32 rounded-[50%] bg-black/20 blur-md" />
            {item.primaryImageId ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.primaryImageId}
                alt={item.name}
                className="relative max-h-full w-auto object-contain drop-shadow-xl"
              />
            ) : (
              <Leaf className="relative h-20 w-20 text-white/55" strokeWidth={1.25} />
            )}
          </div>

          {/* Favorit/pin — eller vælg i select-mode */}
          {selectMode ? (
            <button
              type="button"
              onClick={onToggleSelect}
              aria-label={selected ? 'Fjern fra valg' : 'Vælg'}
              className={cn(
                'absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-white/70 bg-card/85 backdrop-blur-sm'
              )}
            >
              {selected && <Check className="h-4 w-4" />}
            </button>
          ) : (
            <div className="absolute right-3 top-3 flex rounded-full bg-card/80 backdrop-blur-sm">
              <FavoritePinButtons
                id={item.id}
                isFavorite={item.isFavorite}
                isPinned={item.isPinned}
                compact
              />
            </div>
          )}
        </div>

        {/* Hvid sektion — skarp kant mod farveblokken */}
        <div className="bg-card px-4 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {statusMeta.label}
            </span>
            {sowingPeriod && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" /> Sås {sowingPeriod}
              </span>
            )}
            {countLabel && (
              <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
                {countLabel}
              </span>
            )}
            {item.supplier && (
              <span className="inline-flex max-w-[45%] items-center truncate rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
                {item.supplier}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  )
}

function formatMonths(months: number[]): string {
  if (!months.length) return ''
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].short
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
