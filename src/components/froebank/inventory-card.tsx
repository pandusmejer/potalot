'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { FavoritePinButtons } from './favorite-pin-buttons'
import { INVENTORY_STATUS_META, MONTHS_DA, PRIMARY_CATEGORIES } from '@/lib/constants'
import { plantColor } from '@/lib/plant-color'
import { useImageColor } from '@/lib/use-image-color'
import type { InventoryItem } from '@/lib/types'
import { Leaf, Check, ChevronDown, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  item: InventoryItem
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

const SOWN_STATUSES = new Set(['saaet', 'i_jord', 'i_vaekst'])

/**
 * Frøbank-element som "chartek": flad plante-farveblok med
 * fritlagt motiv, fed sans-navn og ÉN nøglelinje (Sås mdr. /
 * Sået). Organisk blad-underkant. Resten foldes ud på stedet.
 */
export function InventoryCard({ item, selectMode = false, selected = false, onToggleSelect }: Props) {
  const [open, setOpen] = useState(false)
  const statusMeta = INVENTORY_STATUS_META[item.status]
  const sowingPeriod = formatMonths(item.sowingMonths)
  const photoColor = useImageColor(item.primaryImageId)
  const { field: nameField } = plantColor(item.name, item.variety)
  const field = photoColor ?? nameField
  const kicker = PRIMARY_CATEGORIES[item.primaryCategoryId]?.name ?? 'Frøbank'

  const remaining = item.seedCount != null ? (item.seedsRemaining ?? item.seedCount) : null
  const countLabel =
    remaining != null ? `${remaining} frø tilbage`
    : item.quantity != null ? `${item.quantity} stk`
    : null

  // Én nøglelinje: enten "Sås mar–aug" eller "Sået"
  const keyLine = SOWN_STATUSES.has(item.status)
    ? 'Sået'
    : sowingPeriod ? `Sås ${sowingPeriod}` : statusMeta.label

  function handleActivate() {
    if (selectMode) onToggleSelect?.()
    else setOpen(o => !o)
  }

  return (
    <Card variant={item.isPinned ? 'elevated' : 'default'} className="relative overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!selectMode && open}
        onClick={handleActivate}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleActivate() }
        }}
        className="leaf-edge relative h-44 cursor-pointer px-5 pt-5 pb-9 select-none"
        style={{ backgroundColor: field }}
      >
        {/* Kicker + navn + nøglelinje */}
        <div className="relative max-w-[62%]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
            {kicker}
          </p>
          <h3 className="mt-1 truncate font-sans text-2xl font-bold leading-tight text-white">
            {item.name}
          </h3>
          {item.variety && (
            <p className="truncate text-sm text-white/80">{item.variety}</p>
          )}
          <p className="mt-3 truncate text-sm font-semibold text-white">
            {keyLine}
          </p>
          {countLabel && (
            <p className="truncate text-xs text-white/70">{countLabel}</p>
          )}
        </div>

        {/* Fritlagt motiv — højre side */}
        <div className="pointer-events-none absolute bottom-7 right-4 top-5 flex w-[40%] items-center justify-center">
          <div className="absolute bottom-2 h-4 w-24 rounded-[50%] bg-black/15 blur-md" />
          {item.primaryImageId ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.primaryImageId}
              alt={item.name}
              className="relative max-h-full w-auto object-contain drop-shadow-xl"
            />
          ) : (
            <Leaf className="relative h-16 w-16 text-white/55" strokeWidth={1.25} />
          )}
        </div>

        {/* Favorit/pin — eller vælg i select-mode */}
        {selectMode ? (
          <span
            aria-hidden
            className={cn(
              'absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-white/70 bg-card/85 backdrop-blur-sm'
            )}
          >
            {selected && <Check className="h-4 w-4" />}
          </span>
        ) : (
          <div
            className="absolute right-3 top-3 z-10 flex rounded-full bg-card/80 backdrop-blur-sm"
            onClick={e => e.stopPropagation()}
          >
            <FavoritePinButtons
              id={item.id}
              isFavorite={item.isFavorite}
              isPinned={item.isPinned}
              compact
            />
          </div>
        )}

        {/* Fold-ud-indikator */}
        {!selectMode && (
          <ChevronDown
            className={cn(
              'absolute bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 text-white/70 transition-transform',
              open && 'rotate-180'
            )}
          />
        )}
      </div>

      {/* Udfoldet: resten af informationen */}
      {!selectMode && open && (
        <div className="bg-card px-5 pb-5 pt-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Row label="Status" value={statusMeta.label} />
            {sowingPeriod && <Row label="Sås" value={sowingPeriod} />}
            {countLabel && <Row label="Beholdning" value={countLabel} />}
            {item.supplier && <Row label="Leverandør" value={item.supplier} />}
            {item.latinName && <Row label="Latinsk" value={item.latinName} />}
          </dl>
          <Link
            href={`/froebank/${item.id}`}
            onClick={e => e.stopPropagation()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Åbn frøkort <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground">{value}</dd>
    </div>
  )
}

function formatMonths(months: number[]): string {
  if (!months.length) return ''
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].short
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
