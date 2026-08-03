'use client'

/**
 * FilterBottomSheet — frøbankens filter/sortering i et mobilt bottom sheet.
 *
 * Erstatter det gamle inline-filterpanel under mappen (som brød arkiv-
 * illusionen og skubbede sortmapperne ned). Filterknappen ved søgefeltet
 * åbner dette sheet; aktive avancerede valg vises bagefter som små chips
 * inde i mappen (se SeedBankFolderPanel).
 *
 * Varm cremebaggrund, afrundede top-hjørner, rolig skygge — matcher
 * Potalot-papirstilen, ikke et standard hvidt app-panel. Portales til
 * <body> så fixed-positionering ikke fanges af transformede forældre.
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { PrimaryCategoryId } from '@/lib/types'

export type SmartFilter =
  | 'mangler-guide'
  | 'udloeber-snart'
  | 'mangler-billede'
  | 'naesten-tom'

export type SortOrder = 'standard' | 'az' | 'za' | 'recent' | 'expiry'

const VIS_OPTIONS: { id: SmartFilter; label: string }[] = [
  { id: 'udloeber-snart', label: 'Udløber snart' },
  { id: 'mangler-billede', label: 'Mangler billede' },
  { id: 'mangler-guide', label: 'Mangler guide' },
]

const TYPE_OPTIONS: { id: PrimaryCategoryId; label: string }[] = [
  { id: 'fro', label: 'Frø' },
  { id: 'loeg', label: 'Løg' },
  { id: 'knolde', label: 'Knolde' },
  { id: 'buske', label: 'Buske' },
  { id: 'traeer', label: 'Træer' },
  { id: 'stauder', label: 'Stauder' },
  { id: 'indkoebsliste', label: 'Ønskeliste' },
]

const SORT_OPTIONS: { id: SortOrder; label: string }[] = [
  { id: 'recent', label: 'Senest tilføjet' },
  { id: 'expiry', label: 'Udløber snart' },
  { id: 'az', label: 'Alfabetisk A–Å' },
  { id: 'za', label: 'Alfabetisk Å–A' },
]

interface Props {
  open: boolean
  onClose: () => void
  category: PrimaryCategoryId
  smartFilters: Set<SmartFilter>
  sortOrder: SortOrder
  /** Underkategorier der findes i den aktive hovedkategori (count > 0). */
  subcategoryOptions?: { id: string; label: string; count: number }[]
  activeSubcategory?: string
  onSelectSubcategory?: (id: string) => void
  onSelectCategory: (id: PrimaryCategoryId) => void
  onToggleSmart: (id: SmartFilter) => void
  onClearSmart: () => void
  onSelectSort: (order: SortOrder) => void
  onReset: () => void
}

export function FilterBottomSheet({
  open,
  onClose,
  category,
  smartFilters,
  sortOrder,
  subcategoryOptions,
  activeSubcategory,
  onSelectSubcategory,
  onSelectCategory,
  onToggleSmart,
  onClearSmart,
  onSelectSort,
  onReset,
}: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Lås body-scroll mens sheetet er åbent.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: 'rgba(40,46,32,0.42)',
          opacity: open ? 1 : 0,
          transition: 'opacity 250ms ease',
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filtrér frøbank"
        className="relative mx-auto w-full max-w-[440px] px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-[10px]"
        style={{
          maxHeight: '86vh',
          overflowY: 'auto',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          background:
            'linear-gradient(180deg, #F4EEE1 0%, #EFE8D9 46%, #EAE2D1 100%)',
          boxShadow:
            '0 -10px 30px rgba(48,42,28,0.22), 0 -2px 8px rgba(48,42,28,0.10), inset 0 1px 0 rgba(255,255,255,0.55)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Grabber */}
        <div className="mx-auto mb-[9px] h-[5px] w-[42px] rounded-full bg-[#C4BCA6]" aria-hidden />

        <div className="mb-[14px] flex items-center justify-between">
          <h2
            className="text-[18px] font-semibold leading-none text-[#2E3A23]"
            style={{ fontFamily: 'var(--font-manrope)' }}
          >
            Filtrér frøbank
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Luk"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5F6758]"
            style={{ background: 'rgba(255,255,255,0.45)' }}
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </div>

        <Section label="Vis">
          <SheetChip
            label="Alle"
            active={smartFilters.size === 0}
            onClick={onClearSmart}
          />
          {VIS_OPTIONS.map(o => (
            <SheetChip
              key={o.id}
              label={o.label}
              active={smartFilters.has(o.id)}
              onClick={() => onToggleSmart(o.id)}
            />
          ))}
        </Section>

        <Section label="Type">
          {TYPE_OPTIONS.map(o => (
            <SheetChip
              key={o.id}
              label={o.label}
              active={category === o.id}
              onClick={() => onSelectCategory(o.id)}
            />
          ))}
        </Section>

        {/* Indhold = underkategori (Grøntsager, Blomster …). Lever KUN her i
            filteret — ikke som hero-chip på niveau med Frø/Løg. Vises kun når den
            aktive hovedkategori faktisk indeholder underkategoriserede sorter. */}
        {subcategoryOptions && subcategoryOptions.length > 0 && (
          <Section label="Indhold">
            <SheetChip
              label="Alle"
              active={!activeSubcategory || activeSubcategory === 'alle'}
              onClick={() => onSelectSubcategory?.('alle')}
            />
            {subcategoryOptions.map(o => (
              <SheetChip
                key={o.id}
                label={o.label}
                active={activeSubcategory === o.id}
                onClick={() =>
                  onSelectSubcategory?.(activeSubcategory === o.id ? 'alle' : o.id)
                }
              />
            ))}
          </Section>
        )}

        <Section label="Sortér efter">
          {SORT_OPTIONS.map(o => (
            <SheetChip
              key={o.id}
              label={o.label}
              active={sortOrder === o.id}
              onClick={() => onSelectSort(sortOrder === o.id ? 'standard' : o.id)}
              compact
            />
          ))}
        </Section>

        <div className="mt-[14px] flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full px-5 py-3 text-[14px] font-medium text-[#566337]"
            style={{
              background: 'transparent',
              boxShadow: 'inset 0 0 0 1.5px rgba(86,99,55,0.35)',
            }}
          >
            Nulstil
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full px-5 py-3 text-[14px] font-semibold text-[#F7F3E8]"
            style={{
              background:
                'linear-gradient(180deg, #646F43 0%, #566337 55%, #46512B 100%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.18), 0 5px 12px rgba(54,69,32,0.26)',
            }}
          >
            Vis resultater
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-[14px]">
      <p className="mb-[7px] font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#6B7160]">
        {label}
      </p>
      <div className="flex flex-wrap gap-[8px]">{children}</div>
    </div>
  )
}

function SheetChip({
  label,
  active,
  onClick,
  compact = false,
}: {
  label: string
  active: boolean
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[13px] font-sans font-medium transition active:translate-y-px ${
        compact ? 'px-[13px] py-[7px] text-[12px]' : 'px-[15px] py-[10px] text-[13px]'
      }`}
      style={
        active
          ? {
              background:
                'linear-gradient(180deg, #646F43 0%, #566337 55%, #46512B 100%)',
              color: '#F7F3E8',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.16), 0 2px 5px rgba(54,69,32,0.20)',
            }
          : {
              background: '#E4DCC9',
              color: '#4E564B',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
            }
      }
    >
      {label}
    </button>
  )
}
