'use client'

/**
 * "Timing-horisonten" — selve årshjulet, det visuelle hjerte.
 *
 * Hver plante er én vandret række. Henover de 12 måneder tegnes
 * fase-bars (forspiring, så, plant ud, høst) med deres egen
 * dæmpede naturfarve. Aktuel måned markeres med en lodret hårfin
 * salvie-linje, ikke en farveklat.
 *
 * Design-principper:
 *   • IKKE Gantt — der er ingen procentbjælker, deadlines, eller
 *     "% complete". Det er en sæson-rytme, ikke et projekt.
 *   • Rolige, dæmpede paletter (sage / olive / ochre / terracotta),
 *     aldrig de mætttede "weather channel"-toner.
 *   • Læseretning: navn til venstre, måneder mod højre. Bars har
 *     bløde 999-radier så de føles organiske.
 *   • Filter "Kun mine" / "Alle forslag" sidder lige over horisonten
 *     som en stille toggle, ikke et tab-system.
 */

import { useState } from 'react'
import type { InventoryItem, Plant } from '@/lib/types'
import {
  buildTimelineRows,
  type TimelineEntry,
  type TimelinePhase,
} from '@/lib/aarshjul-timeline'

const sans = 'var(--font-manrope)'
const MAANED_KORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MAANED_3 = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AUG','SEP','OKT','NOV','DEC']

/**
 * Fase-palette. Bevidst dæmpet og natur-forankret:
 *   forspiring  → kold, tidlig salvie (drivhus-stadie)
 *   saaning     → frisk forårsgrøn
 *   udplantning → moden sommergrøn
 *   host        → varm ochre (modne afgrøder)
 */
const PHASE_COLORS: Record<TimelinePhase, { bg: string; ink: string }> = {
  forspiring:  { bg: '#C5CFB4', ink: '#3A4530' },  // bleg salvie
  saaning:     { bg: '#A9C28A', ink: '#2C3E1F' },  // forårsgrøn
  udplantning: { bg: '#7B9460', ink: '#1F2E12' },  // sommerolive
  host:        { bg: '#D2A658', ink: '#3F2D04' },  // ochre høst
}

interface Props {
  inventory: InventoryItem[]
  plants: Plant[]
  /** Aktuel måned 1-12 (highlightes med lodret linje) */
  currentMonth: number
}

export function TimingHorisont({ inventory, plants, currentMonth }: Props) {
  const [filterMine, setFilterMine] = useState<boolean>(false)
  const rows = buildTimelineRows(inventory, plants, filterMine)

  return (
    <div
      style={{
        // Papir-baggrund så horisonten føles som en gammel havebog,
        // ikke som et software-dashboard.
        background: 'rgba(248,246,238,0.55)',
        border: '1px solid rgba(36,48,31,0.07)',
        borderRadius: 18,
        padding: '14px 14px 16px 14px',
      }}
    >
      {/* Header — overskrift + filter-toggle */}
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#7B816F',
            margin: 0,
          }}
        >
          Plantetider · {MAANED_3[currentMonth - 1]}
        </p>
        <FilterToggle value={filterMine} onChange={setFilterMine} />
      </div>

      {/* Måneds-akse — meget dæmpet, kun læsbar reference */}
      <MaanedsAkse currentMonth={currentMonth} />

      {/* Plante-rækker */}
      {rows.length === 0 ? (
        <EmptyHorisont filterMine={filterMine} />
      ) : (
        <div style={{ marginTop: 8 }}>
          {rows.map(row => (
            <PlanteRække key={row.id} row={row} currentMonth={currentMonth} />
          ))}
        </div>
      )}

      {/* Fase-legend nederst — diskret, sidder altid synligt */}
      <FaseLegend />
    </div>
  )
}

/**
 * Lille toggle-knap mellem "Kun mine" og "Alle forslag". Bevist
 * minimalistisk — ikke en segmented control, kun to ord adskilt af
 * en tynd vertikal linje.
 */
function FilterToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className="inline-flex items-center"
      style={{
        fontFamily: sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        gap: 8,
      }}
    >
      <button
        type="button"
        onClick={() => onChange(true)}
        style={{
          padding: '4px 8px',
          borderRadius: 999,
          background: value ? 'rgba(123,148,96,0.18)' : 'transparent',
          color: value ? '#24301F' : '#7B816F',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Kun mine
      </button>
      <span style={{ color: 'rgba(36,48,31,0.2)' }}>·</span>
      <button
        type="button"
        onClick={() => onChange(false)}
        style={{
          padding: '4px 8px',
          borderRadius: 999,
          background: !value ? 'rgba(123,148,96,0.18)' : 'transparent',
          color: !value ? '#24301F' : '#7B816F',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Alle forslag
      </button>
    </div>
  )
}

/**
 * Måneds-akse — 12 små måneds-initialer over horisonten. Den
 * aktuelle måned får en lodret salvie-linje der trækker hele
 * højden ned gennem rækkerne.
 */
function MaanedsAkse({ currentMonth }: { currentMonth: number }) {
  return (
    <div
      style={{
        display: 'grid',
        // Første kolonne reserveret til plante-navnet (102px)
        gridTemplateColumns: '102px repeat(12, 1fr)',
        gap: 2,
        alignItems: 'center',
        position: 'relative',
        paddingBottom: 6,
        borderBottom: '1px solid rgba(36,48,31,0.06)',
      }}
    >
      <div /> {/* tom kolonne for plante-navne */}
      {MAANED_KORT.map((m, i) => {
        const isCurrent = i + 1 === currentMonth
        return (
          <div
            key={i}
            style={{
              fontFamily: sans,
              fontSize: 10,
              fontWeight: isCurrent ? 700 : 500,
              letterSpacing: '0.05em',
              color: isCurrent ? '#24301F' : '#A7B098',
              textAlign: 'center',
            }}
          >
            {m}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Én plante-række. Navnet til venstre, fase-bars fordelt over 12
 * måneder. Bar'en strækkes så mange måneder som fasen dækker.
 * Hvis flere faser overlapper (sjældent, men muligt for sow/host),
 * stackes de lodret i samme række — vi giver hver fase 4-5px højde.
 */
function PlanteRække({
  row,
  currentMonth,
}: {
  row: TimelineEntry
  currentMonth: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '102px repeat(12, 1fr)',
        gap: 2,
        alignItems: 'center',
        paddingBlock: 8,
        borderBottom: '1px solid rgba(36,48,31,0.04)',
        position: 'relative',
      }}
    >
      {/* Plante-navn + sort — venstre kolonne */}
      <div style={{ paddingRight: 8, overflow: 'hidden' }}>
        <p
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            color: '#24301F',
            margin: 0,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.plant}
        </p>
        {row.variety && (
          <p
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 500,
              color: '#7B816F',
              margin: 0,
              marginTop: 1,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.variety}
          </p>
        )}
      </div>

      {/* Måneds-celler 1-12. Tegner bar-segmenter pr. fase. */}
      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
        const activePhases = row.phases.filter(p => p.months.includes(month))
        const isCurrentMonth = month === currentMonth
        return (
          <div
            key={month}
            style={{
              position: 'relative',
              height: 22,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 2,
              // Aktuel måned: meget blød lodret salvie-tone bag bars
              background: isCurrentMonth ? 'rgba(123,148,96,0.06)' : 'transparent',
            }}
          >
            {activePhases.map(phase => {
              const colors = PHASE_COLORS[phase.phase]
              // Find første og sidste måned i denne fase — for at
              // bestemme om bar'en skal have rund venstre/højre kant
              // (kun ydermånederne får runde hjørner; midter-måneder
              // er kvadratisk så de smelter sammen til én bar)
              const sortedMonths = phase.months
              const idx = sortedMonths.indexOf(month)
              const isFirstInRun = idx === 0 || sortedMonths[idx - 1] !== month - 1
              const isLastInRun =
                idx === sortedMonths.length - 1 ||
                sortedMonths[idx + 1] !== month + 1

              return (
                <div
                  key={phase.phase}
                  title={`${phase.label}: ${formatMonthRange(phase.months)}`}
                  style={{
                    height: 5,
                    background: colors.bg,
                    borderTopLeftRadius: isFirstInRun ? 999 : 0,
                    borderBottomLeftRadius: isFirstInRun ? 999 : 0,
                    borderTopRightRadius: isLastInRun ? 999 : 0,
                    borderBottomRightRadius: isLastInRun ? 999 : 0,
                    // Lille indrykning så bars ikke berører cellekant
                    marginLeft: isFirstInRun ? 2 : 0,
                    marginRight: isLastInRun ? 2 : 0,
                  }}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Fase-legend — fire små chips nederst der forklarer farve-systemet.
 * Diskret, men altid synlig så førstegangs-brugere ikke skal gætte.
 */
function FaseLegend() {
  const items: { phase: TimelinePhase; label: string }[] = [
    { phase: 'forspiring',  label: 'Forkultivér' },
    { phase: 'saaning',     label: 'Så' },
    { phase: 'udplantning', label: 'Plant ud' },
    { phase: 'host',        label: 'Høst' },
  ]
  return (
    <div
      className="flex flex-wrap items-center"
      style={{ gap: 12, marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(36,48,31,0.06)' }}
    >
      {items.map(it => (
        <div key={it.phase} className="inline-flex items-center" style={{ gap: 6 }}>
          <span
            aria-hidden
            style={{
              width: 14,
              height: 5,
              borderRadius: 999,
              background: PHASE_COLORS[it.phase].bg,
            }}
          />
          <span
            style={{
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 600,
              color: '#56604D',
              letterSpacing: '0.01em',
            }}
          >
            {it.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function EmptyHorisont({ filterMine }: { filterMine: boolean }) {
  return (
    <div style={{ paddingBlock: 18, textAlign: 'center' }}>
      <p
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 500,
          color: '#7B816F',
          margin: 0,
        }}
      >
        {filterMine
          ? 'Du har endnu ingen planter med dyrkningsdata.'
          : 'Ingen planter at vise lige nu.'}
      </p>
    </div>
  )
}

function formatMonthRange(months: number[]): string {
  if (months.length === 0) return ''
  if (months.length === 1) return MAANED_3[months[0] - 1]
  const sorted = [...months].sort((a, b) => a - b)
  // Hvis kontinuerlig: "MAJ–SEP". Ellers: "MAJ · JUL · SEP"
  const isContinuous = sorted.every(
    (m, i) => i === 0 || m === sorted[i - 1] + 1,
  )
  if (isContinuous) {
    return `${MAANED_3[sorted[0] - 1]}–${MAANED_3[sorted[sorted.length - 1] - 1]}`
  }
  return sorted.map(m => MAANED_3[m - 1]).join(' · ')
}
