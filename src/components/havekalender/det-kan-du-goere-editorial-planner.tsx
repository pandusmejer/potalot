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
        marginTop: 8,
        padding: 'clamp(26px, 6vw, 42px) clamp(20px, 5vw, 38px) 64px',
        background: '#F4F0E6',
        color: '#24301F',
      }}
    >
      <div style={{ maxWidth: 760, marginInline: 'auto' }}>
        <header style={{ marginBottom: 18 }}>
          <p
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.18em',
              lineHeight: 1.2,
              margin: 0,
              textTransform: 'uppercase',
              color: 'rgba(36,48,31,0.58)',
            }}
          >
            Det kan du gøre i
          </p>

          <MonthLoopHeader
            activeLabel={monthName}
            prevLabel={prevLabel}
            nextLabel={nextLabel}
            onPrev={() => handleMonthChange(prevMonth)}
            onNext={() => handleMonthChange(nextMonth)}
          />

          <div
            style={{
              borderBottom: '1px solid rgba(36,48,31,0.16)',
              padding: '8px 0 13px',
            }}
          >
            <p
              style={{
                fontFamily: sans,
                fontSize: 13.2,
                fontStyle: 'italic',
                fontWeight: 350,
                lineHeight: 1.5,
                margin: 0,
                maxWidth: 620,
                color: 'rgba(36,48,31,0.66)',
              }}
            >
              Juni er haven i fuld vækst.
              <br />
              Nye skud tager fart, blomsterne folder sig ud, og de første afgrøder
              melder sig. Nu handler det om at hjælpe haven godt ind i sommeren.
            </p>
          </div>
        </header>

        <div style={{ display: 'grid', gap: 22 }}>
          {GROUPS.map(group => {
            const groupItems = visibleItems.filter(item => item.group === group.id)
            const shownItems = showAll ? groupItems : groupItems.slice(0, groupLimits[group.id])
            if (shownItems.length === 0) return null

            return (
              <PlannerGroup
                key={group.id}
                label={group.label}
                items={shownItems}
                itemStates={itemStates}
                onSelect={setSelectedItem}
              />
            )
          })}
        </div>

        {totalHiddenByLimit > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(value => !value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 18,
              padding: '13px 0 0',
              background: 'transparent',
              border: 0,
              borderRadius: 0,
              color: 'rgba(36,48,31,0.58)',
              cursor: 'pointer',
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: '0.14em',
              lineHeight: 1.35,
              textTransform: 'uppercase',
              width: '100%',
            }}
          >
            <span>{showAll ? 'Vis kortere uddrag' : `Se alle gøremål i ${monthName.toLowerCase()}`}</span>
            {!showAll && <span aria-hidden style={{ letterSpacing: 0 }}>→</span>}
          </button>
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
        gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        columnGap: 12,
        margin: '13px 0 13px',
        width: '100%',
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label={`Forrige måned: ${prevLabel}`}
        className="inline-flex items-center justify-start"
        style={{
          gap: 5,
          minWidth: 0,
          padding: 0,
          background: 'transparent',
          border: 0,
          color: 'rgba(36,48,31,0.50)',
          cursor: 'pointer',
          fontFamily: sans,
          fontSize: 'clamp(15px, 4.4vw, 19px)',
          fontWeight: 650,
          letterSpacing: '0.02em',
          lineHeight: 1,
          textTransform: 'lowercase',
        }}
      >
        <ChevronLeft width={14} height={14} strokeWidth={1.7} aria-hidden />
        <span>{prevLabel.toLowerCase()}</span>
        <MonthDots side="left" />
      </button>

      <span
        aria-current="date"
        data-active-month="true"
        style={{
          color: '#24301F',
          fontFamily: sans,
          fontSize: 'clamp(34px, 9.5vw, 42px)',
          fontWeight: 900,
          letterSpacing: '0.08em',
          lineHeight: 1,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {activeLabel.toUpperCase()}
      </span>

      <button
        type="button"
        onClick={onNext}
        aria-label={`Næste måned: ${nextLabel}`}
        className="inline-flex items-center justify-end"
        style={{
          gap: 5,
          minWidth: 0,
          padding: 0,
          background: 'transparent',
          border: 0,
          color: 'rgba(36,48,31,0.50)',
          cursor: 'pointer',
          fontFamily: sans,
          fontSize: 'clamp(15px, 4.4vw, 19px)',
          fontWeight: 650,
          letterSpacing: '0.02em',
          lineHeight: 1,
          textTransform: 'lowercase',
        }}
      >
        <MonthDots side="right" />
        <span>{nextLabel.toLowerCase()}</span>
        <ChevronRight width={14} height={14} strokeWidth={1.7} aria-hidden />
      </button>
    </div>
  )
}

function MonthDots({ side }: { side: 'left' | 'right' }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        gap: 8,
        marginLeft: side === 'left' ? 11 : 0,
        marginRight: side === 'right' ? 11 : 0,
        color: 'rgba(36,48,31,0.28)',
        fontFamily: sans,
        fontSize: 13,
        fontWeight: 900,
        letterSpacing: '0',
        lineHeight: 1,
      }}
    >
      <span>·</span>
      <span>·</span>
      <span>·</span>
    </span>
  )
}

function PlannerGroup({
  label,
  items,
  itemStates,
  onSelect,
}: {
  label: string
  items: EditorialPlannerItem[]
  itemStates: Record<string, PlannerItemState>
  onSelect: (item: EditorialPlannerItem) => void
}) {
  return (
    <section aria-labelledby={`planner-group-${slugify(label)}`}>
      <div style={{ marginBottom: 8 }}>
        <h3
          id={`planner-group-${slugify(label)}`}
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 850,
            letterSpacing: '0.17em',
            lineHeight: 1.2,
            margin: 0,
            textTransform: 'uppercase',
            color: '#2F3D28',
          }}
        >
          {label}
        </h3>
        <span
          aria-hidden
          style={{
            display: 'block',
            width: 22,
            height: 2,
            marginTop: 9,
            background: '#7E8D5E',
          }}
        />
      </div>

      <div style={{ borderTop: '1px solid rgba(36,48,31,0.12)' }}>
        {items.map(item => (
          <PlannerRow
            key={item.id}
            item={item}
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
  state,
  onClick,
}: {
  item: EditorialPlannerItem
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
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        columnGap: 10,
        alignItems: 'start',
        padding: '9px 0 10px',
        background: 'transparent',
        border: 0,
        borderBottom: '1px solid rgba(36,48,31,0.12)',
        color: 'inherit',
        cursor: 'pointer',
        opacity: isAdded ? 0.66 : 1,
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 780,
            lineHeight: 1.24,
            color: '#24301F',
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 5,
            fontFamily: sans,
            fontSize: 13.2,
            fontWeight: 500,
            lineHeight: 1.42,
            color: 'rgba(36,48,31,0.64)',
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
        className="inline-flex items-center justify-end"
        style={{
          minWidth: 20,
          height: 22,
          marginTop: 0,
          color: isAdded ? 'rgba(98,125,78,0.80)' : 'rgba(36,48,31,0.34)',
          fontFamily: sans,
          fontSize: isAdded ? 11.5 : 16,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {isAdded ? 'Tilføjet' : <Plus width={14} height={14} strokeWidth={1.6} />}
      </span>
    </button>
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

function genitiveMonth(monthName: string): string {
  const lower = monthName.toLowerCase()
  if (lower.endsWith('s')) return lower
  return `${lower}s`
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
