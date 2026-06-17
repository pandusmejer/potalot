'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { markDerivedTaskDone, unmarkDerivedTaskDone } from '@/actions/plant-tasks'

const sans = 'var(--font-manrope)'

export interface AtSeItem {
  art: string
  action: string
  href: string
  /** Kort timing-label: "Gør i dag" | "Klar nu" | "Afventer vejr". */
  timing: string
  priority: 'idag' | 'snart' | 'afventer'
  plantId: string
  taskType: string
  /** Deterministisk nøgle (plant_id + task_type + dato) — afkrydsningens identitet. */
  taskKey: string
  /** Menneskelæsbar titel til log-noten i plantens historie. */
  taskTitle: string
}

/**
 * ✅ I HAVEN I DAG — dagens planteopgaver som ÉN samlet arbejdsseddel.
 *
 * Anna (17/6): én kompakt opgaveliste — checkbox-cirkel som hovedsignal,
 * navn + opgave, status-pill, tynde divider-linjer, INGEN per-item-kort.
 *
 * Tap-to-check ("tjek til check"): checkbox-cirklen er en ægte knap.
 * Afkrydsede opgaver FORLADER den aktive liste og samles i en sammenklappet
 * "✓ N udført"-linje (Anna 17/6: ellers fylder fx 27 opgaver hele
 * siden). Genfindelig — fold ud + tap for at af-krydse igen.
 *
 * Persistens (planter-persistens-sprint, step 1+2): for rigtige brugere
 * gemmes afkrydsningen som en completion på en deterministisk task_key +
 * en note i plantens historie — reload bevarer tilstanden, ny dag nulstiller.
 * I demo (canPersist=false) er afkrydsningen lokal/ikke-gemt: ingen falsk
 * persistens, men designet er stadig synligt.
 */

const PRIO_META: Record<AtSeItem['priority'], { label: string; chipBg: string }> = {
  idag: { label: '#8A6D1F', chipBg: 'rgba(200,154,53,0.14)' },
  snart: { label: '#4C6038', chipBg: 'rgba(94,125,79,0.13)' },
  afventer: { label: 'rgba(36,48,31,0.5)', chipBg: 'rgba(36,48,31,0.06)' },
}

function TaskRow({
  item,
  done,
  first,
  onToggle,
}: {
  item: AtSeItem
  done: boolean
  first: boolean
  onToggle: () => void
}) {
  const prio = PRIO_META[item.priority]
  return (
    <div
      className="flex items-start gap-3 px-0.5"
      style={{ paddingTop: 13, paddingBottom: 13, borderTop: first ? 'none' : '1px solid rgba(36,48,31,0.09)' }}
    >
      {/* Checkbox — ægte knap; tap markerer gjort / fortryder (lokalt v1). */}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? `Fortryd ${item.art}` : `Markér ${item.art} som udført`}
        className="flex shrink-0 items-center justify-center rounded-full transition-colors active:scale-90"
        style={{
          width: 21,
          height: 21,
          marginTop: 1,
          border: done ? '1.5px solid #5A7038' : '1.5px solid rgba(36,48,31,0.28)',
          background: done ? '#5A7038' : 'transparent',
          cursor: 'pointer',
        }}
      >
        {done && <Check className="h-3 w-3" strokeWidth={3} style={{ color: '#FFFFFF' }} aria-hidden />}
      </button>

      {/* Resten af rækken → planten. */}
      <Link href={item.href} className="min-w-0 flex-1 transition-opacity" style={{ opacity: done ? 0.5 : 1 }}>
        <span className="flex items-center justify-between gap-2">
          <span
            className="truncate"
            style={{
              fontFamily: sans,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: '#24301F',
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {item.art}
          </span>
          {!done && (
            <span
              className="shrink-0 rounded-full"
              style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: prio.label, background: prio.chipBg, padding: '3px 9px' }}
            >
              {item.timing}
            </span>
          )}
        </span>
        <span
          className="block truncate"
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(36,48,31,0.6)',
            marginTop: 3,
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {item.action}
        </span>
      </Link>
    </div>
  )
}

export function AtSeTilIDag({
  items,
  initialDone = [],
  canPersist = false,
}: {
  items: AtSeItem[]
  /** task_keys allerede markeret udført i dag (persisteret). */
  initialDone?: string[]
  /** Rigtig bruger → gem til server. Demo → lokal/ikke-gemt. */
  canPersist?: boolean
}) {
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set(initialDone))

  if (items.length === 0) return null

  const list = items.slice(0, 3)
  const aktive = list.filter(it => !done.has(it.taskKey))
  const gjort = list.filter(it => done.has(it.taskKey))

  function setMembership(taskKey: string, isDone: boolean) {
    setDone(prev => {
      const next = new Set(prev)
      if (isDone) next.add(taskKey)
      else next.delete(taskKey)
      return next
    })
  }

  function toggle(item: AtSeItem) {
    const willBeDone = !done.has(item.taskKey)
    // Optimistisk: opdatér UI med det samme.
    setMembership(item.taskKey, willBeDone)
    if (!canPersist) return // demo: lokal afkrydsning, ingen server-kald

    const action = willBeDone
      ? markDerivedTaskDone({
          plantId: item.plantId,
          taskKey: item.taskKey,
          taskType: item.taskType,
          taskTitle: item.taskTitle,
        })
      : unmarkDerivedTaskDone(item.taskKey)

    action
      .then(res => {
        if (res && 'error' in res) setMembership(item.taskKey, !willBeDone) // rul tilbage
      })
      .catch(() => setMembership(item.taskKey, !willBeDone))
  }

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 px-0.5">
        <h2
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.52)', margin: 0 }}
        >
          I haven i dag
        </h2>
        {aktive.length > 0 && (
          <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: 'rgba(36,48,31,0.45)', margin: 0 }}>
            {aktive.length} {aktive.length === 1 ? 'planteopgave' : 'planteopgaver'}
          </p>
        )}
      </header>

      {/* Aktive opgaver. Tomt (alt afkrydset) → rolig kvittering. */}
      {aktive.length > 0 ? (
        <div>
          {aktive.map((item, i) => (
            <TaskRow key={item.taskKey} item={item} done={false} first={i === 0} onToggle={() => toggle(item)} />
          ))}
        </div>
      ) : (
        <p
          className="px-0.5"
          style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: 'rgba(36,48,31,0.55)', margin: 0, paddingTop: 4, paddingBottom: 4 }}
        >
          Alt set til i haven for i dag.
        </p>
      )}

      {/* Afkrydsede opgaver — sammenklappet, så de ikke fylder. Fold ud for
          at af-krydse igen. */}
      {gjort.length > 0 && (
        <details className="group" style={{ marginTop: aktive.length > 0 ? 4 : 10 }}>
          <summary
            className="flex cursor-pointer list-none items-center gap-2 px-0.5 [&::-webkit-details-marker]:hidden"
            style={{ paddingTop: 10, paddingBottom: 2 }}
          >
            <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 16, height: 16, background: '#5A7038' }}>
              <Check className="h-2.5 w-2.5" strokeWidth={3} style={{ color: '#FFFFFF' }} aria-hidden />
            </span>
            <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: 'rgba(36,48,31,0.5)' }}>
              {gjort.length} udført
            </span>
            <ChevronRight
              className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
              strokeWidth={2}
              style={{ color: 'rgba(36,48,31,0.35)' }}
              aria-hidden
            />
          </summary>
          <div>
            {gjort.map((item, i) => (
              <TaskRow key={item.taskKey} item={item} done={true} first={i === 0} onToggle={() => toggle(item)} />
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
