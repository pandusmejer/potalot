'use client'

/**
 * Delt render-UI for BRAIN'ens FokusHandling-rækker — udtrukket fra
 * dagens-fokus-section.tsx så både "Ugens fokus" og det samlede
 * "I haven nu"-modul (i-haven-nu.tsx) bruger ÉN sandhed for:
 *   • det fremhævede primære fokus-kort (PrimaryFocus)
 *   • de kompakte støtte-rækker (SecondaryRow)
 *   • timing-/konsekvens-chip'en (Chip)
 *   • tap-to-check-knappen + completion-persistensen (useDerivedCompletions)
 *
 * Ren præsentation + completion-hook. INGEN sektions-/layout-beslutninger her
 * (hvilke handlinger der vises hvor hører til den enkelte sektion).
 */

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { markDerivedTaskDone, unmarkDerivedTaskDone } from '@/actions/plant-tasks'
import type { FokusHandling } from '@/lib/kalender/dagens-fokus'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), var(--font-gabarito), serif'

/**
 * Chip = lille LÆSE-signal for grad af timing/konsekvens — ikke et statusfelt.
 * Labelen afledes af handlingstypen, så hierarkiet bliver aflæseligt.
 */
const CHIP_TONE: Record<string, { color: string; bg: string }> = {
  'Haster':      { color: '#B5602F', bg: 'rgba(181,96,47,0.13)' },
  'Høst nu':     { color: '#9A6A1E', bg: 'rgba(168,124,59,0.16)' },
  'Godt vindue': { color: '#4C6038', bg: 'rgba(80,104,52,0.17)' },
  'Plant ud':    { color: '#4C6038', bg: 'rgba(80,104,52,0.12)' },
  'Mere plads':  { color: 'rgba(76,96,56,0.85)', bg: 'rgba(80,104,52,0.08)' },
  'Tjek':        { color: '#A87C3B', bg: 'rgba(168,124,59,0.14)' },
  'Mulighed':    { color: 'rgba(42,51,32,0.5)', bg: 'rgba(42,51,32,0.06)' },
}

/** Chip-label efter handlingstype. udplant skifter til "Godt vindue" når
 *  vinduet er snævert (lukker denne eller næste måned) — ellers "Plant ud". */
export function chipLabel(h: FokusHandling, month: number): string {
  switch (h.taskType) {
    case 'daek': return 'Haster'
    case 'hoest': return 'Høst nu'
    case 'udplant': {
      const snaevert = h.deadlineMaaned != null && h.deadlineMaaned - month <= 1
      return snaevert ? 'Godt vindue' : 'Plant ud'
    }
    case 'prikl': return 'Mere plads'
    case 'tjek-spiring': return 'Tjek'
    default: return 'Mulighed'
  }
}

export function Chip({ h, month, size }: { h: FokusHandling; month: number; size?: 'lg' }) {
  const label = chipLabel(h, month)
  const tone = CHIP_TONE[label] ?? CHIP_TONE['Mulighed']
  const lg = size === 'lg'
  return (
    <span
      className="shrink-0 rounded-full"
      style={{
        fontFamily: sans,
        fontSize: lg ? 13 : 10.5,
        fontWeight: 600,
        letterSpacing: lg ? '-0.01em' : undefined,
        lineHeight: lg ? 1 : undefined,
        marginTop: lg ? 2 : undefined,
        color: tone.color,
        background: tone.bg,
        padding: lg ? '3px 9px' : '2.5px 8px',
      }}
    >
      {label}
    </span>
  )
}

/** Rund afkrydsnings-knap (samme signal som Planter-forsiden). */
export function CheckCircle({ done, onToggle, label, size = 18 }: {
  done: boolean; onToggle: () => void; label: string; size?: number
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      aria-label={label}
      className="flex shrink-0 items-center justify-center rounded-full transition-colors active:scale-90"
      style={{
        width: size, height: size, marginTop: 1,
        border: done ? '1.5px solid #5A7038' : '1.5px solid rgba(42,51,32,0.28)',
        background: done ? '#5A7038' : 'transparent', cursor: 'pointer',
      }}
    >
      {done && <Check style={{ width: size * 0.6, height: size * 0.6, color: '#fff' }} strokeWidth={3} aria-hidden />}
    </button>
  )
}

/** Tydeligt afkrydsningsFELT (I haven nu): hvid fyld + meget tynd kant + svagt
 *  spøgelses-flueben, så det aflæses som "tap for at markere", ikke dekoration.
 *  Udført = grøn fyld + hvidt flueben. Delt af fokus-kort + task-cards. */
export function TaskCheckbox({ done, onToggle, label, size = 30 }: {
  done: boolean; onToggle: () => void; label: string; size?: number
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      aria-label={label}
      className="flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
      style={{
        width: size, height: size,
        border: done ? '1px solid #5A7038' : '1px solid rgba(90,112,56,0.5)',
        background: done ? '#5A7038' : 'rgba(255,255,255,0.78)',
        boxShadow: done ? 'none' : 'inset 0 1px 2px rgba(64,58,42,0.06), 0 1px 3px rgba(64,58,42,0.06)',
        cursor: 'pointer',
      }}
    >
      <Check style={{ width: size * 0.56, height: size * 0.56, color: done ? '#fff' : 'rgba(90,112,56,0.42)' }} strokeWidth={done ? 3 : 2.2} aria-hidden />
    </button>
  )
}

/** Det fremhævede primære fokus — sektionens redaktionelle hovedperson. */
export function PrimaryFocus({ h, done, month, markoer, onToggle }: { h: FokusHandling; done: boolean; month: number; markoer?: string; onToggle: () => void }) {
  const checkbar = h.plantId !== null
  // Farvet venstremarkør + varmere papir efter handlingens urgency — giver
  // fokus-kortet særstatus (dagens vigtigste) uden at blive produktivitets-SaaS.
  const label = chipLabel(h, month)
  const tone = CHIP_TONE[label] ?? CHIP_TONE['Mulighed']
  const accent = tone.color
  return (
    <div
      className="rounded-tl-[1.4rem] rounded-br-[1.4rem] rounded-tr-md rounded-bl-md"
      style={{
        position: 'relative',
        background: 'linear-gradient(158deg, rgba(242,236,217,0.92) 0%, rgba(233,227,205,0.72) 100%)',
        border: '1px solid rgba(95,103,72,0.14)',
        borderLeft: `3px solid ${accent}`,
        // Kobber-kanten løber også hen over kortets øverste kant (L-ramme).
        borderTop: `3px solid ${accent}`,
        padding: '13px 14px 4px 14px',
        opacity: done ? 0.6 : 1,
        transition: 'opacity .2s',
      }}
    >
      {/* Rundt urgency-mærkat der ligger OVENPÅ kortet — øverste højre hjørne,
          overlapper den øverste kant. */}
      {!done && (
        <span
          style={{
            position: 'absolute', top: -13, right: 14, zIndex: 3,
            fontFamily: sans, fontSize: 12.5, fontWeight: 750, lineHeight: 1, letterSpacing: '-0.01em',
            color: tone.color, background: '#FBF4E1',
            padding: '10px 16px', borderRadius: 999,
            border: '1px solid rgba(64,58,42,0.10)',
            boxShadow: '0 3px 9px rgba(64,26,15,0.16)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
      <div className="flex items-start gap-2">
        {checkbar && <TaskCheckbox done={done} onToggle={onToggle} label={done ? `Fortryd: ${h.titel}` : `Markér udført: ${h.titel}`} size={26} />}
        <div className="min-w-0 flex-1">
          {markoer && (
            <p className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--primary)', margin: '1px 0 5px' }}>
              {markoer}
            </p>
          )}
          <h3
            style={{
              fontFamily: serif, fontSize: 22, fontWeight: 600, lineHeight: 1.0,
              letterSpacing: '-0.025em', color: '#24311d', margin: 0, maxWidth: '13.5ch',
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {h.titel}
          </h3>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: 'rgba(36,49,29,0.72)', margin: '3px 0 0', lineHeight: 1.3, letterSpacing: '-0.01em', maxWidth: '29ch' }}>
            {h.hvorfor}
          </p>
          <Link
            href={h.href}
            style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: '#567036', display: 'block', textAlign: 'right', marginTop: 9, lineHeight: 1.2, letterSpacing: '-0.015em' }}
          >
            {h.plantId !== null ? 'Se planten →' : 'Se i frøbanken →'}
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Støttende fokus-række (kompakt, divider-adskilt). */
export function SecondaryRow({ h, done, first, month, onToggle, sourceChip }: { h: FokusHandling; done: boolean; first: boolean; month: number; onToggle: () => void; sourceChip?: React.ReactNode }) {
  const checkbar = h.plantId !== null
  return (
    <div
      className="flex items-start gap-2.5 px-0.5"
      style={{ paddingTop: 7, paddingBottom: 7, borderTop: first ? 'none' : '1px solid rgba(64,58,42,0.05)' }}
    >
      {checkbar
        ? <CheckCircle done={done} onToggle={onToggle} label={done ? `Fortryd: ${h.titel}` : `Markér udført: ${h.titel}`} />
        : <span className="shrink-0" style={{ width: 21 }} aria-hidden />}
      <Link href={h.href} className="min-w-0 flex-1" style={{ opacity: done ? 0.5 : 1 }}>
        <span className="flex items-center justify-between gap-2">
          <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--foreground)', textDecoration: done ? 'line-through' : 'none' }}>
            {h.titel}
          </span>
          {!done && <Chip h={h} month={month} />}
        </span>
        <span
          className="block"
          style={{
            fontFamily: sans, fontSize: 13, fontWeight: 500, color: 'rgba(42,51,32,0.6)',
            marginTop: 1.5, lineHeight: 1.3, textDecoration: done ? 'line-through' : 'none',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {h.hvorfor}
        </span>
        {sourceChip && <span className="mt-0.5 inline-flex">{sourceChip}</span>}
      </Link>
    </div>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="uppercase" style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(42,51,32,0.55)', margin: '0 0 7px' }}>
      {children}
    </p>
  )
}

/**
 * Completion-state + tap-to-check for afledte handlinger. Optimistisk lokal
 * opdatering; persisterer via plant-tasks når canPersist (kun plante-bundne —
 * frøbank-invitationer uden plantId kan ikke gemmes endnu, og toggler ikke).
 *
 * Initial-sættet beregnes én gang fra handlingernes `udfoert`.
 */
export function useDerivedCompletions(handlinger: FokusHandling[], canPersist: boolean) {
  const [done, setDone] = useState<ReadonlySet<string>>(
    () => new Set(handlinger.filter(h => h.udfoert).map(h => h.taskKey)),
  )

  function setMembership(taskKey: string, isDone: boolean) {
    setDone(prev => {
      const next = new Set(prev)
      if (isDone) next.add(taskKey); else next.delete(taskKey)
      return next
    })
  }

  function toggle(h: FokusHandling) {
    if (h.plantId === null) return // frøbank-invitation: ingen completion
    const willBeDone = !done.has(h.taskKey)
    setMembership(h.taskKey, willBeDone) // optimistisk
    if (!canPersist) return // demo: lokal, ingen falsk persistens
    const action = willBeDone
      ? markDerivedTaskDone({ plantId: h.plantId, taskKey: h.taskKey, taskType: h.taskType, taskTitle: h.titel })
      : unmarkDerivedTaskDone(h.taskKey)
    action.then(res => { if (res && 'error' in res) setMembership(h.taskKey, !willBeDone) })
      .catch(() => setMembership(h.taskKey, !willBeDone))
  }

  const isDone = (h: FokusHandling) => done.has(h.taskKey)
  return { isDone, toggle }
}
