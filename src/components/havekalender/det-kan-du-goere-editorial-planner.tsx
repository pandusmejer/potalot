'use client'

/**
 * Locked component for "Det kan du gøre i [måned]".
 *
 * Status: implemented as the live monthly planner section.
 *
 * Product role:
 * - Universal monthly garden jobs curated by admin.
 * - Not the user's personal tasks.
 * - Editorial planner/checklist, not a card stack.
 *
 * Locked visual direction:
 * - Do not reintroduce item cards, pills, large green CTA buttons, or per-item images.
 * - Keep this as an open editorial planner preview on the front page.
 * - Use the detail dialog for larger actions.
 *
 * Data note:
 * - Existing `GeneralGardenTask.category` is mapped into planner groups until a
 *   real admin field exists. See `mapTaskToPlannerItem` below.
 */

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { GeneralGardenTask } from '@/lib/types'
import { MONTHS_DA } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const rust = '#B75C3E'
const gold = '#C99A24'

type PlannerGroupId = 'goer_nu' | 'hold_oeje_med' | 'hvis_du_har_tid'
type PlannerItemState = 'idle' | 'added' | 'hidden'

export interface EditorialPlannerItem {
  id: string
  title: string
  description: string
  month?: number
  group: PlannerGroupId
  category?: string
  guideHref?: string
  priority?: GeneralGardenTask['priority']
}

interface Props {
  month: number
  items: EditorialPlannerItem[]
  initialGroupLimits?: Partial<Record<PlannerGroupId, number>>
  onMonthChange?: (month: number) => void
  onAddToTasks?: (item: EditorialPlannerItem) => void | Promise<void>
  onHide?: (item: EditorialPlannerItem) => void | Promise<void>
  onOpenGuide?: (item: EditorialPlannerItem) => void
}

const GROUPS: Array<{ id: PlannerGroupId; label: string }> = [
  { id: 'goer_nu', label: 'Gør nu' },
  { id: 'hold_oeje_med', label: 'Hold øje med' },
  { id: 'hvis_du_har_tid', label: 'Hvis du har tid' },
]

const DEFAULT_GROUP_LIMITS: Record<PlannerGroupId, number> = {
  goer_nu: 3,
  hold_oeje_med: 1,
  hvis_du_har_tid: 0,
}

export function DetKanDuGoereEditorialPlanner({
  month,
  items,
  initialGroupLimits,
  onMonthChange,
  onAddToTasks,
  onHide,
  onOpenGuide,
}: Props) {
  const [viewMonth, setViewMonth] = useState(month)
  const [showAll, setShowAll] = useState(false)
  const [selectedItem, setSelectedItem] = useState<EditorialPlannerItem | null>(null)
  const [itemStates, setItemStates] = useState<Record<string, PlannerItemState>>({})
  const groupLimits = { ...DEFAULT_GROUP_LIMITS, ...initialGroupLimits }

  const monthName = MONTHS_DA[viewMonth - 1]?.full ?? 'Juni'
  const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1
  const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1
  const prevLabel = MONTHS_DA[prevMonth - 1]?.full ?? 'Forrige'
  const nextLabel = MONTHS_DA[nextMonth - 1]?.full ?? 'Næste'

  const visibleItems = useMemo(
    () => items.filter(item => itemStates[item.id] !== 'hidden' && (!item.month || item.month === viewMonth)),
    [items, itemStates, viewMonth]
  )

  const totalHiddenByLimit = GROUPS.reduce((sum, group) => {
    const groupItems = visibleItems.filter(item => item.group === group.id)
    return sum + Math.max(0, groupItems.length - groupLimits[group.id])
  }, 0)

  const handleMonthChange = (next: number) => {
    setViewMonth(next)
    setShowAll(false)
    onMonthChange?.(next)
  }

  const markState = (item: EditorialPlannerItem, state: PlannerItemState) => {
    setItemStates(prev => ({ ...prev, [item.id]: state }))
  }

  const handleAdd = async (item: EditorialPlannerItem) => {
    await onAddToTasks?.(item)
    markState(item, 'added')
    setSelectedItem(null)
  }

  const handleHide = async (item: EditorialPlannerItem) => {
    await onHide?.(item)
    markState(item, 'hidden')
    setSelectedItem(null)
  }

  return (
    <section
      aria-labelledby="editorial-planner-title"
      style={{
        position: 'relative',
        overflow: 'hidden',
        marginTop: 8,
        // Samme hjørner + dropskygge som MINE OPGAVER-kortet (delt Card:
        // rounded-2xl = 16px + Card-skyggen), så sektionerne står som samme
        // familie i kalenderfeedet.
        borderRadius: 16,
        border: '1px solid rgba(64,58,42,0.08)',
        background:
          'linear-gradient(180deg, rgba(255,252,244,0.86) 0%, #F7F1E5 46%, #F3EBDD 100%)',
        boxShadow:
          '0 1px 2px rgba(60,65,40,0.05), 0 4px 14px -4px rgba(60,65,40,0.1)',
        color: '#24301F',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -24,
          bottom: 4,
          width: 184,
          height: 138,
          opacity: 0.18,
          pointerEvents: 'none',
        }}
      >
        <BotanicalLineArt />
      </div>
      <div style={{ maxWidth: 760, marginInline: 'auto' }}>
        <header style={{ marginBottom: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
              padding: '20px clamp(20px, 5vw, 38px) 14px',
              borderBottom: '1px solid rgba(64,58,42,0.08)',
              background: '#F7F1E5',
            }}
          >
            <p
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
                lineHeight: 1,
                margin: 0,
                textTransform: 'uppercase',
                color: '#46482F',
              }}
            >
              Det kan du gøre i
            </p>
          </div>

          <MonthLoopHeader
            activeLabel={monthName}
            prevLabel={prevLabel}
            nextLabel={nextLabel}
            onPrev={() => handleMonthChange(prevMonth)}
            onNext={() => handleMonthChange(nextMonth)}
          />

          <div
            style={{
              padding: '0 clamp(20px, 5vw, 24px)',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'block',
                width: 46,
                height: 3,
                margin: 'calc(16px - 4mm) auto 28px',
                borderRadius: 999,
                background: '#9F7A24',
              }}
            />
            <p
              style={{
                fontFamily: serif,
                fontSize: 'clamp(18px, 4.7vw, 21px)',
                fontStyle: 'italic',
                fontWeight: 600,
                lineHeight: 1.2,
                margin: '-3mm auto 48px',
                maxWidth: '34ch',
                color: 'rgba(35,56,43,0.84)',
              }}
            >
              Juli er haven i fuld vækst.
              <br />
              Nye skud tager fart, blomsterne folder sig ud, og de første afgrøder
              melder sig. Nu handler det om at hjælpe haven godt ind i sommeren.
            </p>
          </div>
        </header>

        <div style={{ display: 'grid', gap: 20, padding: '0 clamp(20px, 5vw, 38px)', marginTop: '-1cm' }}>
          {GROUPS.map(group => {
            const groupItems = visibleItems.filter(item => item.group === group.id)
            const shownItems = showAll ? groupItems : groupItems.slice(0, groupLimits[group.id])
            if (shownItems.length === 0) return null

            return (
              <PlannerGroup
                key={group.id}
                label={group.label}
                items={shownItems}
                startIndex={visibleItems.findIndex(item => item.id === shownItems[0]?.id) + 1}
                itemStates={itemStates}
                onSelect={setSelectedItem}
              />
            )
          })}
        </div>

        {totalHiddenByLimit > 0 && (
          <div
            style={{
              position: 'relative',
              marginTop: 30,
              padding: '28px clamp(24px, 7vw, 34px) 32px',
              background:
                'linear-gradient(90deg, rgba(214,219,190,0.72) 0%, rgba(229,214,162,0.62) 100%)',
              borderTop: '1px solid rgba(64,58,42,0.10)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setShowAll(value => !value)}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'grid',
                gridTemplateColumns: '64px minmax(0, 1fr)',
                alignItems: 'center',
                gap: 18,
                width: '100%',
                padding: 0,
                background: 'transparent',
                border: 0,
                color: '#2F4D2B',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  background: '#D2A11F',
                  color: '#FFF7E8',
                  boxShadow: '0 10px 22px rgba(153,111,22,0.18)',
                  fontFamily: sans,
                  fontSize: 30,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                →
              </span>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  lineHeight: 1.35,
                  textTransform: 'uppercase',
                  color: '#2F4D2B',
                }}
              >
                {showAll ? 'Vis kortere uddrag' : `Se alle gøremål i ${monthName.toLowerCase()}`}
              </span>
            </button>
          </div>
        )}
      </div>

      <PlannerDetailDialog
        item={selectedItem}
        state={selectedItem ? itemStates[selectedItem.id] : undefined}
        onOpenChange={open => !open && setSelectedItem(null)}
        onAdd={handleAdd}
        onHide={handleHide}
        onOpenGuide={onOpenGuide}
      />
    </section>
  )
}

function MonthLoopHeader({
  activeLabel,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
}: {
  activeLabel: string
  prevLabel: string
  nextLabel: string
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div
      id="editorial-planner-title"
      aria-label={`Månedsvælger: ${activeLabel}`}
      className="grid items-center"
      style={{
        position: 'relative',
        gridTemplateColumns: '1fr auto 1fr',
        columnGap: 0,
        margin: 0,
        marginTop: '-4mm',
        marginBottom: 18,
        height: 136,
        maxHeight: 136,
        minHeight: 136,
        width: '100%',
        overflow: 'hidden',
        // Terracotta-feltet fylder nu HELE headeren som ét rektangel, kant til
        // kant i siderne (samme højde) — ikke længere et indskudt centerfelt.
        background: 'linear-gradient(180deg, #C56B48 0%, #B75A3A 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
      }}
    >
      {/* Nederste tier: to lavere sand-firkanter der stikker 5mm længere ind mod
          midten end de øverste. Halv højde, bund-justeret, BAG JULI (zIndex 1).
          Bredde = eksisterende firkant (99px @ JULI) + 5mm. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          bottom: '-10mm',
          zIndex: 5,
          width: 'calc(99px + 5mm)',
          height: 'calc((136px - 5mm) / 2)',
          // Matcher sektionsgradientens renderede farve PRÆCIS ved firkantens
          // bund-søm (fraktion ~0.20 → rgba(255,252,244,.86)→#F7F1E5 blendet
          // over app-canvas), så cremen smelter usynligt sammen med baggrunden
          // i stedet for en fast #F7F1E5 der er en anelse mørkere end gradienten.
          background: 'rgb(251,247,236)',
          borderRadius: '0 28px 28px 0',
          pointerEvents: 'none',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: 0,
          bottom: '-10mm',
          zIndex: 5,
          width: 'calc(99px + 5mm)',
          height: 'calc((136px - 5mm) / 2)',
          background: 'rgb(251,247,236)',
          borderRadius: '28px 0 0 28px',
          pointerEvents: 'none',
        }}
      />
      <button
        type="button"
        onClick={onPrev}
        aria-label={`Forrige måned: ${prevLabel}`}
        className="inline-flex items-center justify-start"
        style={{
          position: 'relative',
          zIndex: 3,
          gap: 0,
          minWidth: 0,
          height: 'calc(136px - 5mm)',
          minHeight: 'calc(136px - 5mm)',
          alignSelf: 'start',
          padding: '0 8px',
          background: 'transparent',
          border: 0,
          borderRadius: 0,
          color: '#46482F',
          cursor: 'pointer',
          fontFamily: serif,
          fontSize: 21,
          fontWeight: 600,
          letterSpacing: '0.01em',
          lineHeight: 1,
          textTransform: 'lowercase',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 0,
            background: 'rgba(255,247,232,0.35)',
            boxShadow: '0 2px 11px rgba(64,26,15,0.30)',
            borderRadius: '0 28px 28px 0',
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'calc(8px - 1mm)',
            minWidth: 0,
          }}
        >
          <ChevronLeft
            width={20}
            height={20}
            strokeWidth={1.8}
            aria-hidden
            style={{ color: '#46482F', flex: '0 0 auto' }}
          />
          <span>{prevLabel.toLowerCase()}</span>
        </span>
      </button>

      <span
        aria-current="date"
        data-active-month="true"
        style={{
          position: 'relative',
          zIndex: 2,
          alignSelf: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'auto',
          height: 136,
          padding: '0 5mm',
          overflow: 'visible',
          background: 'transparent',
          color: '#FFF7E8',
          fontFamily: serif,
          fontSize: 60,
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 0.9,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ position: 'relative', zIndex: 1, marginTop: 2, transform: 'translateY(-1mm)' }}>
          {activeLabel.toUpperCase()}
        </span>
        <span
          aria-hidden
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 18.9,
            marginTop: 'calc(16px + 3mm)',
            pointerEvents: 'none',
          }}
        >
          <span style={{ width: 10.08, height: 10.08, borderRadius: 999, background: 'rgba(255,247,232,0.35)' }} />
          <span style={{ width: 10.08, height: 10.08, borderRadius: 999, background: '#FFF7E8' }} />
          <span style={{ width: 10.08, height: 10.08, borderRadius: 999, background: 'rgba(255,247,232,0.35)' }} />
        </span>
      </span>

      <button
        type="button"
        onClick={onNext}
        aria-label={`Næste måned: ${nextLabel}`}
        className="inline-flex items-center justify-end"
        style={{
          position: 'relative',
          zIndex: 3,
          gap: 0,
          minWidth: 0,
          height: 'calc(136px - 5mm)',
          minHeight: 'calc(136px - 5mm)',
          alignSelf: 'start',
          padding: '0 8px',
          background: 'transparent',
          border: 0,
          borderRadius: 0,
          color: '#46482F',
          cursor: 'pointer',
          fontFamily: serif,
          fontSize: 21,
          fontWeight: 600,
          letterSpacing: '0.01em',
          lineHeight: 1,
          textTransform: 'lowercase',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 0,
            background: 'rgba(255,247,232,0.35)',
            boxShadow: '0 2px 11px rgba(64,26,15,0.30)',
            borderRadius: '28px 0 0 28px',
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'calc(8px - 1mm)',
            minWidth: 0,
          }}
        >
          <span>{nextLabel.toLowerCase()}</span>
          <ChevronRight
            width={20}
            height={20}
            strokeWidth={1.8}
            aria-hidden
            style={{ color: '#46482F', flex: '0 0 auto' }}
          />
        </span>
      </button>
    </div>
  )
}

function PlannerGroup({
  label,
  items,
  startIndex,
  itemStates,
  onSelect,
}: {
  label: string
  items: EditorialPlannerItem[]
  startIndex: number
  itemStates: Record<string, PlannerItemState>
  onSelect: (item: EditorialPlannerItem) => void
}) {
  const showGroupLabel = label.toLowerCase() !== 'gør nu'

  return (
    <section aria-labelledby={`planner-group-${slugify(label)}`}>
      {showGroupLabel ? (
        <div style={{ marginBottom: 8 }}>
          <h3
            id={`planner-group-${slugify(label)}`}
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 850,
              letterSpacing: '0.19em',
              lineHeight: 1.2,
              margin: 0,
              textTransform: 'uppercase',
              color: 'rgba(36,48,31,0.58)',
            }}
          >
            {label}
          </h3>
          <span
            aria-hidden
            style={{
              display: 'block',
              width: 22,
              height: 1,
              marginTop: 9,
              background: 'rgba(36,48,31,0.30)',
            }}
          />
        </div>
      ) : (
        <h3 id={`planner-group-${slugify(label)}`} className="sr-only">
          {label}
        </h3>
      )}

      <div>
        {items.map((item, index) => (
          <PlannerRow
            key={item.id}
            item={item}
            index={startIndex + index}
            state={itemStates[item.id] ?? 'idle'}
            onClick={() => onSelect(item)}
          />
        ))}
      </div>
    </section>
  )
}

function PlannerRow({
  item,
  index,
  state,
  onClick,
}: {
  item: EditorialPlannerItem
  index: number
  state: PlannerItemState
  onClick: () => void
}) {
  const isAdded = state === 'added'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full text-left"
      style={{
        gridTemplateColumns: '64px minmax(0, 1fr) 48px',
        columnGap: 16,
        alignItems: 'center',
        minHeight: 98,
        padding: '14px 0',
        background: 'transparent',
        border: 0,
        borderBottom: '1px solid rgba(64,58,42,0.13)',
        color: 'inherit',
        cursor: 'pointer',
        opacity: isAdded ? 0.66 : 1,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5px',
          alignItems: 'center',
          gap: 14,
          minHeight: 54,
        }}
      >
        <span
          style={{
            color: rust,
            fontFamily: serif,
            fontSize: 'clamp(33px, 9vw, 40px)',
            fontWeight: 800,
            letterSpacing: '0.01em',
            lineHeight: 1,
          }}
        >
          {String(index).padStart(2, '0')}
        </span>
        <span
          style={{
            width: 1.5,
            height: 52,
            background: gold,
            opacity: 0.75,
            transform: 'translateX(-3mm)',
          }}
        />
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: sans,
            fontSize: 15.5,
            fontWeight: 750,
            lineHeight: 1.18,
            color: '#203024',
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 5,
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.25,
            color: 'rgba(35,56,43,0.66)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.description}
        </span>
      </span>

      <span
        aria-hidden
        className="inline-flex items-center justify-center"
        style={{
          alignSelf: 'center',
          width: 42,
          height: 42,
          borderRadius: 999,
          border: '1px solid rgba(184,91,61,0.25)',
          marginTop: 0,
          color: isAdded ? 'rgba(98,125,78,0.80)' : '#A95137',
          fontFamily: sans,
          fontSize: isAdded ? 13 : 16,
          fontWeight: 800,
          lineHeight: 1,
          background: 'rgba(255,247,232,0.35)',
        }}
      >
        {isAdded ? '✓' : <Plus width={20} height={20} strokeWidth={1.8} />}
      </span>
    </button>
  )
}

function BotanicalLineArt() {
  return (
    <svg viewBox="0 0 184 138" width="100%" height="100%" fill="none" aria-hidden>
      <path d="M48 132C75 92 87 58 82 22" stroke="#F3E8D2" strokeWidth="2" />
      <path d="M91 134C106 93 126 65 164 39" stroke="#F3E8D2" strokeWidth="2" />
      <path d="M74 52c-24-8-42-2-54 19 23 6 42-1 54-19Z" stroke="#F3E8D2" strokeWidth="2" />
      <path d="M82 35c15-20 30-27 47-24-5 21-21 31-47 24Z" stroke="#F3E8D2" strokeWidth="2" />
      <path d="M112 86c17-19 35-25 54-19-8 19-25 28-54 19Z" stroke="#F3E8D2" strokeWidth="2" />
      <path d="M101 105c-20-8-35-3-45 14 18 7 33 3 45-14Z" stroke="#F3E8D2" strokeWidth="2" />
    </svg>
  )
}

function PlannerDetailDialog({
  item,
  state,
  onOpenChange,
  onAdd,
  onHide,
  onOpenGuide,
}: {
  item: EditorialPlannerItem | null
  state?: PlannerItemState
  onOpenChange: (open: boolean) => void
  onAdd: (item: EditorialPlannerItem) => void | Promise<void>
  onHide: (item: EditorialPlannerItem) => void | Promise<void>
  onOpenGuide?: (item: EditorialPlannerItem) => void
}) {
  const [pendingAction, setPendingAction] = useState<'add' | 'hide' | null>(null)

  if (!item) return null

  const runAction = async (action: 'add' | 'hide') => {
    setPendingAction(action)
    try {
      if (action === 'add') await onAdd(item)
      if (action === 'hide') await onHide(item)
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          fixed bottom-0 left-0 top-auto mx-0 w-full max-w-none translate-x-0 translate-y-0
          rounded-b-none rounded-t-[22px] border-x-0 border-b-0 p-0
          sm:left-1/2 sm:top-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:rounded-2xl sm:border sm:p-0
        "
        style={{
          background: '#F7F3EA',
          borderColor: 'rgba(36,48,31,0.12)',
          color: '#24301F',
        }}
      >
        <div style={{ padding: '28px 24px 24px' }}>
          <DialogTitle
            style={{
              fontFamily: serif,
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '0',
              margin: 0,
              paddingRight: 24,
              color: '#24301F',
            }}
          >
            {item.title}
          </DialogTitle>
          <DialogDescription
            style={{
              fontFamily: sans,
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.55,
              marginTop: 14,
              color: 'rgba(36,48,31,0.68)',
            }}
          >
            {item.description}
          </DialogDescription>

          {item.category && (
            <div style={{ marginTop: 22 }}>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 10.5,
                  fontWeight: 850,
                  letterSpacing: '0.15em',
                  margin: '0 0 7px',
                  textTransform: 'uppercase',
                  color: 'rgba(36,48,31,0.52)',
                }}
              >
                Kategori
              </p>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 15,
                  fontWeight: 650,
                  margin: 0,
                  color: '#3E4F30',
                }}
              >
                {item.category}
              </p>
            </div>
          )}
        </div>

        <DialogFooter
          style={{
            display: 'grid',
            gap: 9,
            padding: '0 24px 24px',
          }}
        >
          <DetailActionButton
            variant="primary"
            disabled={state === 'added' || pendingAction !== null}
            onClick={() => runAction('add')}
          >
            {state === 'added' ? 'Tilføjet til mine opgaver' : 'Tilføj til mine opgaver'}
          </DetailActionButton>
          {item.guideHref && (
            <DetailActionButton
              variant="secondary"
              disabled={pendingAction !== null}
              onClick={() => onOpenGuide?.(item)}
            >
              Gå til guide
            </DetailActionButton>
          )}
          <DetailActionButton
            variant="ghost"
            disabled={pendingAction !== null}
            onClick={() => runAction('hide')}
          >
            Skjul dette gøremål
          </DetailActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailActionButton({
  variant,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: 'primary' | 'secondary' | 'ghost'
}) {
  const styleByVariant =
    variant === 'primary'
      ? {
          background: '#3F5232',
          border: '1px solid #3F5232',
          color: '#FEFCF6',
        }
      : variant === 'secondary'
        ? {
            background: 'transparent',
            border: '1px solid rgba(36,48,31,0.22)',
            color: '#2F3D28',
          }
        : {
            background: 'transparent',
            border: '1px solid transparent',
            color: 'rgba(36,48,31,0.62)',
          }

  return (
    <button
      type="button"
      {...props}
      style={{
        minHeight: 46,
        padding: '0 16px',
        borderRadius: 8,
        cursor: props.disabled ? 'default' : 'pointer',
        fontFamily: sans,
        fontSize: 14,
        fontWeight: 780,
        opacity: props.disabled ? 0.55 : 1,
        ...styleByVariant,
      }}
    >
      {children}
    </button>
  )
}

export function mapTaskToPlannerItem(task: GeneralGardenTask): EditorialPlannerItem {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    month: task.month,
    group: plannerGroupFromTask(task),
    category: humanCategory(task.category),
    priority: task.priority,
    guideHref: task.linkedGuideIds[0] ? `/guides/${task.linkedGuideIds[0]}` : undefined,
  }
}

function plannerGroupFromTask(task: GeneralGardenTask): PlannerGroupId {
  const category = task.category.toLowerCase()

  if (
    category.includes('skadedyr') ||
    category.includes('sygdom') ||
    category.includes('tørke') ||
    category.includes('toerke')
  ) {
    return 'hold_oeje_med'
  }

  if (task.priority === 'low') return 'hvis_du_har_tid'

  return 'goer_nu'
}

function humanCategory(category: string): string {
  return category
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/^\w/, letter => letter.toUpperCase())
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll('ø', 'oe')
    .replaceAll('å', 'aa')
    .replaceAll('æ', 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const EDITORIAL_PLANNER_DEMO_ITEMS: EditorialPlannerItem[] = [
  {
    id: 'demo-toerke-varme',
    title: 'Hold øje med tørke og varme',
    description: 'Krukker og nyplantede bede tørrer først ud.',
    month: 6,
    group: 'goer_nu',
    category: 'Vanding',
  },
  {
    id: 'demo-bind-tomater',
    title: 'Bind tomater op løbende',
    description: 'Væksten tager fart nu, og støtte i tide gør resten lettere.',
    month: 6,
    group: 'goer_nu',
    category: 'Drivhus',
  },
  {
    id: 'demo-nip-sideskud',
    title: 'Nip sideskud på stangtomater',
    description: 'Giver bedre luft og stærkere planter.',
    month: 6,
    group: 'goer_nu',
    category: 'Beskæring',
  },
  {
    id: 'demo-bladlus',
    title: 'Bladlus på nye skud',
    description: 'Tjek regelmæssigt - de spreder sig hurtigt.',
    month: 6,
    group: 'hold_oeje_med',
    category: 'Skadedyr',
  },
  {
    id: 'demo-snegle',
    title: 'Snegle i fugtige hjørner',
    description: 'Særligt efter regn og i tæt beplantning.',
    month: 6,
    group: 'hold_oeje_med',
    category: 'Skadedyr',
  },
  {
    id: 'demo-krukker-sol',
    title: 'Krukker der tørrer i solen',
    description: 'Vand grundigt og helst om morgenen.',
    month: 6,
    group: 'hold_oeje_med',
    category: 'Vanding',
  },
  {
    id: 'demo-jorddaekke',
    title: 'Læg jorddække omkring tørstige planter',
    description: 'Holder på fugten og dæmper ukrudt.',
    month: 6,
    group: 'hvis_du_har_tid',
    category: 'Jord',
  },
  {
    id: 'demo-kompost',
    title: 'Vend komposten',
    description: 'Sætter gang i omsætningen og giver bedre jord.',
    month: 6,
    group: 'hvis_du_har_tid',
    category: 'Kompost',
  },
  {
    id: 'demo-staudestoette',
    title: 'Giv høje stauder støtte',
    description: 'Regn og vind kan få dem til at vælte.',
    month: 6,
    group: 'hvis_du_har_tid',
    category: 'Prydhave',
  },
]
