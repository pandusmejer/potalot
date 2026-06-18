'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { markDerivedTaskDone, unmarkDerivedTaskDone } from '@/actions/plant-tasks'
import type { DagensFokus, FokusHandling, FokusLag } from '@/lib/kalender/dagens-fokus'

/**
 * DAGENS FOKUS — Kalenderens redaktionelle kerne og svar på sidens ene
 * spørgsmål: "Hvad er det vigtigste jeg gør i haven i dag?"
 *
 * Renderer mentor-motoren (lib/kalender/dagens-fokus.ts). Ét primært fokus
 * fremhævet, op til to støttende, resten bag "Se alle". Stilhed er en feature:
 * når intet haster, siger sektionen det roligt — den opfinder ikke opgaver.
 *
 * Design: værktøjs-registret (Gabarito-display + Manrope), flade bløde blokke,
 * roligt hierarki — IKKE et dashboard. Per visuelt-system.md.
 *
 * Tap-to-check: kun PLANTE-bundne handlinger kan markeres udført (de
 * persisterer via actions/plant-tasks.ts på en deterministisk task_key, samme
 * mønster som Planter-forsidens "I haven i dag"). Frøbank-invitationer (uden
 * plante) får et link i stedet — demo/uden-plante foregiver aldrig at gemme.
 *
 * Isoleret sektion (Annas direktiv 18/6): rører intet andet i /kalender.
 */

const sans = 'var(--font-manrope)'
const display = 'var(--font-gabarito), var(--font-manrope), sans-serif'

/** Kort, rolig timing-etiket pr. lag — ikke et alarm-signal. */
const LAG_CHIP: Record<FokusLag, { label: string; color: string; bg: string }> = {
  1: { label: 'Haster', color: '#B5602F', bg: 'rgba(181,96,47,0.12)' },
  2: { label: 'Klar nu', color: '#4C6038', bg: 'rgba(80,104,52,0.13)' },
  3: { label: 'Tjek', color: '#A87C3B', bg: 'rgba(168,124,59,0.14)' },
  4: { label: 'Mulighed', color: 'rgba(42,51,32,0.55)', bg: 'rgba(42,51,32,0.06)' },
  5: { label: 'Rytme', color: 'rgba(42,51,32,0.5)', bg: 'rgba(42,51,32,0.05)' },
}

function Chip({ lag }: { lag: FokusLag }) {
  const c = LAG_CHIP[lag]
  return (
    <span
      className="shrink-0 rounded-full"
      style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: c.color, background: c.bg, padding: '3px 9px' }}
    >
      {c.label}
    </span>
  )
}

/** Rund afkrydsnings-knap (samme signal som Planter-forsiden). */
function CheckCircle({ done, onToggle, label, size = 21 }: {
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

/** Det fremhævede primære fokus — sektionens redaktionelle hovedperson. */
function PrimaryFocus({ h, done, onToggle }: { h: FokusHandling; done: boolean; onToggle: () => void }) {
  const checkbar = h.plantId !== null
  return (
    <div
      className="rounded-tl-[1.4rem] rounded-br-[1.4rem] rounded-tr-md rounded-bl-md"
      style={{ background: 'var(--secondary)', padding: '18px 18px 16px', opacity: done ? 0.6 : 1, transition: 'opacity .2s' }}
    >
      <div className="flex items-start gap-3">
        {checkbar && <CheckCircle done={done} onToggle={onToggle} label={done ? `Fortryd: ${h.titel}` : `Markér udført: ${h.titel}`} size={24} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              style={{
                fontFamily: display, fontSize: 21, fontWeight: 800, lineHeight: 1.08,
                letterSpacing: '-0.01em', color: 'var(--foreground)', margin: 0,
                textDecoration: done ? 'line-through' : 'none',
              }}
            >
              {h.titel}
            </h3>
            <Chip lag={h.lag} />
          </div>
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: 'rgba(42,51,32,0.62)', margin: '7px 0 0', lineHeight: 1.4 }}>
            {h.hvorfor}
          </p>
          <Link
            href={h.href}
            style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: 'var(--primary)', display: 'inline-block', marginTop: 11 }}
          >
            {h.plantId !== null ? 'Se planten →' : 'Se i frøbanken →'}
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Støttende fokus-række (kompakt, divider-adskilt). */
function SecondaryRow({ h, done, first, onToggle }: { h: FokusHandling; done: boolean; first: boolean; onToggle: () => void }) {
  const checkbar = h.plantId !== null
  return (
    <div
      className="flex items-start gap-3 px-0.5"
      style={{ paddingTop: 12, paddingBottom: 12, borderTop: first ? 'none' : '1px solid rgba(42,51,32,0.09)' }}
    >
      {checkbar
        ? <CheckCircle done={done} onToggle={onToggle} label={done ? `Fortryd: ${h.titel}` : `Markér udført: ${h.titel}`} />
        : <span className="shrink-0" style={{ width: 21 }} aria-hidden />}
      <Link href={h.href} className="min-w-0 flex-1" style={{ opacity: done ? 0.5 : 1 }}>
        <span className="flex items-center justify-between gap-2">
          <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--foreground)', textDecoration: done ? 'line-through' : 'none' }}>
            {h.titel}
          </span>
          {!done && <Chip lag={h.lag} />}
        </span>
        <span className="block" style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: 'rgba(42,51,32,0.6)', marginTop: 3, textDecoration: done ? 'line-through' : 'none' }}>
          {h.hvorfor}
        </span>
      </Link>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="uppercase" style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(42,51,32,0.55)', margin: '0 0 10px' }}>
      {children}
    </p>
  )
}

export function DagensFokusSection({ data, canPersist = false }: { data: DagensFokus; canPersist?: boolean }) {
  const initial = [...data.fokus, ...data.flere].filter(h => h.udfoert).map(h => h.taskKey)
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set(initial))
  const [visAlle, setVisAlle] = useState(false)

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

  // ── Stilhed: ingen fokus-handlinger → rolig kvittering / almanak ──
  if (data.fokus.length === 0) {
    return (
      <section>
        <Eyebrow>Dagens fokus</Eyebrow>
        <div
          className="rounded-tl-[1.4rem] rounded-br-[1.4rem] rounded-tr-md rounded-bl-md"
          style={{ background: 'var(--secondary)', padding: '18px' }}
        >
          <h3 style={{ fontFamily: display, fontSize: 19, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
            Alt er roligt i haven i dag
          </h3>
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: 'rgba(42,51,32,0.62)', margin: '7px 0 0', lineHeight: 1.45 }}>
            {data.almanak
              ? data.almanak
              : 'Der er intet, der haster. Brug fem minutter på at kigge efter tør jord, skadedyr eller planter, der hænger.'}
          </p>
        </div>
      </section>
    )
  }

  const [primary, ...resten] = data.fokus
  const aktiveSekundaere = resten
  const flereAntal = data.flere.length

  return (
    <section>
      <Eyebrow>Dagens fokus</Eyebrow>

      <PrimaryFocus h={primary} done={isDone(primary)} onToggle={() => toggle(primary)} />

      {aktiveSekundaere.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {aktiveSekundaere.map((h, i) => (
            <SecondaryRow key={h.taskKey} h={h} done={isDone(h)} first={i === 0} onToggle={() => toggle(h)} />
          ))}
        </div>
      )}

      {/* "Se alle" — resten af lag 1-4 bag en rolig fold. */}
      {flereAntal > 0 && (
        <>
          {visAlle && (
            <div style={{ marginTop: 2 }}>
              {data.flere.map((h, i) => (
                <SecondaryRow key={h.taskKey} h={h} done={isDone(h)} first={i === 0 && aktiveSekundaere.length === 0} onToggle={() => toggle(h)} />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setVisAlle(v => !v)}
            style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 2px 0' }}
          >
            {visAlle ? 'Vis færre' : `Se alle (${flereAntal} mere)`}
          </button>
        </>
      )}
    </section>
  )
}
