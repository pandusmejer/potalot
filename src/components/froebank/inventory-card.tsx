import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { FavoritePinButtons } from './favorite-pin-buttons'
import { INVENTORY_STATUS_META, MONTHS_DA } from '@/lib/constants'
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
 * Frøbank-element som botanisk samlekort / frøpose:
 * plante-komplementær farveflade med fritlagt motiv, papir-krop
 * med rolig metadata. Funktion/data uændret — kun udseende.
 */
export function InventoryCard({ item, selectMode = false, selected = false, onToggleSelect }: Props) {
  const statusMeta = INVENTORY_STATUS_META[item.status]
  const sowingPeriod = formatMonths(item.sowingMonths)
  const { field, fieldSoft } = plantColor(item.name, item.variety)

  const remaining = item.seedCount != null ? (item.seedsRemaining ?? item.seedCount) : null
  const countLabel =
    remaining != null ? `${remaining} frø tilbage`
    : item.quantity != null ? `${item.quantity} stk`
    : null

  return (
    <Card variant={item.isPinned ? 'elevated' : 'default'} className="relative overflow-hidden">
      <Link href={`/froebank/${item.id}`} className="block">
        {/* Plante-farveflade m. fritlagt motiv */}
        <div
          className="relative h-28 w-full"
          style={{ backgroundImage: `linear-gradient(155deg, ${fieldSoft}, ${field})` }}
        >
          {/* Sæson-modulation: tyndt token-overlay ovenpå plantens tone */}
          <div className="absolute inset-0 bg-[var(--hero-to)] opacity-[0.16] mix-blend-soft-light" />
          {item.primaryImageId ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.primaryImageId}
              alt={item.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf className="h-10 w-10 text-white/55" strokeWidth={1.5} />
            </div>
          )}
          {/* Status — læsbar på enhver farveflade */}
          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-card/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            {statusMeta.label}
          </span>
        </div>

        {/* Papir-krop */}
        <div className="p-4">
          <p className="truncate font-serif text-lg leading-tight text-foreground">{item.name}</p>
          {item.variety && (
            <p className="truncate text-sm italic text-muted-foreground">{item.variety}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
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

      {/* Favorit/pin — overlay uden for Link (ingen nested anchor) */}
      <div className="absolute right-2 top-2 flex rounded-full bg-card/80 backdrop-blur-sm">
        <FavoritePinButtons
          id={item.id}
          isFavorite={item.isFavorite}
          isPinned={item.isPinned}
          compact
        />
      </div>

      {/* Vælg-tilstand — overlay */}
      {selectMode && (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? 'Fjern fra valg' : 'Vælg'}
          className={cn(
            'absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-soft transition-colors',
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-white/70 bg-card/85 backdrop-blur-sm'
          )}
        >
          {selected && <Check className="h-4 w-4" />}
        </button>
      )}
    </Card>
  )
}

function formatMonths(months: number[]): string {
  if (!months.length) return ''
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].short
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
