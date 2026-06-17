'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const sans = 'var(--font-manrope)'

export interface AtSeItem {
  art: string
  action: string
  href: string
  /** Kort timing-label: "Gør i dag" | "Klar nu" | "Afventer vejr". */
  timing: string
  priority: 'idag' | 'snart' | 'afventer'
}

/**
 * ✅ I HAVEN I DAG — dagens planteopgaver som ÉN samlet arbejdsseddel.
 *
 * Anna (17/6): tre separate kort gjorde siden til "kort-på-kort". Redesignet
 * som én kompakt opgaveliste — checkbox-cirkel som hovedsignal, navn + opgave,
 * status-pill, tynde divider-linjer, INGEN per-item-kort/skygge.
 *
 * Tap-to-check (17/6, "tjek til check"): checkbox-cirklen er nu en ægte knap
 * — tap fylder den + krydser opgaven over (umiddelbar feedback). Resten af
 * rækken linker til planten (ingen nested interaktiv). NB: afkrydsningen er
 * v1 LOKAL (session) — den persisterer ikke endnu og skriver ikke til plantens
 * historie. Opgaverne er UDLEDT af status (ingen gemt "gjort"-tilstand), så
 * den ægte log-til-historie + nulstilling er næste lag (kræver datamodel-valg).
 */

const PRIO_META: Record<AtSeItem['priority'], { label: string; chipBg: string }> = {
  idag: { label: '#8A6D1F', chipBg: 'rgba(200,154,53,0.14)' },
  snart: { label: '#4C6038', chipBg: 'rgba(94,125,79,0.13)' },
  afventer: { label: 'rgba(36,48,31,0.5)', chipBg: 'rgba(36,48,31,0.06)' },
}

export function AtSeTilIDag({ items }: { items: AtSeItem[] }) {
  const [done, setDone] = useState<ReadonlySet<string>>(new Set())

  if (items.length === 0) return null

  function toggle(key: string) {
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 px-0.5">
        <h2
          className="uppercase"
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'rgba(36,48,31,0.52)',
            margin: 0,
          }}
        >
          I haven i dag
        </h2>
        <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: 'rgba(36,48,31,0.45)', margin: 0 }}>
          {items.length} {items.length === 1 ? 'planteopgave' : 'planteopgaver'}
        </p>
      </header>

      {/* Én samlet liste — ingen per-item-kort. Checkbox-knap + tekst-link. */}
      <div>
        {items.slice(0, 3).map((item, i) => {
          const prio = PRIO_META[item.priority]
          const key = `${item.art}-${i}`
          const erGjort = done.has(key)
          return (
            <div
              key={key}
              className="flex items-start gap-3 px-0.5"
              style={{ paddingTop: 14, paddingBottom: 14, borderTop: '1px solid rgba(36,48,31,0.09)' }}
            >
              {/* Checkbox — ægte knap; tap markerer gjort (lokalt v1). */}
              <button
                type="button"
                onClick={() => toggle(key)}
                aria-pressed={erGjort}
                aria-label={erGjort ? `Fortryd ${item.art}` : `Markér ${item.art} som gjort`}
                className="flex shrink-0 items-center justify-center rounded-full transition-colors active:scale-90"
                style={{
                  width: 21,
                  height: 21,
                  marginTop: 1,
                  border: erGjort ? '1.5px solid #5A7038' : '1.5px solid rgba(36,48,31,0.28)',
                  background: erGjort ? '#5A7038' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {erGjort && <Check className="h-3 w-3" strokeWidth={3} style={{ color: '#FFFFFF' }} aria-hidden />}
              </button>

              {/* Resten af rækken → planten. */}
              <Link
                href={item.href}
                className="min-w-0 flex-1 transition-opacity"
                style={{ opacity: erGjort ? 0.5 : 1 }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className="truncate"
                    style={{
                      fontFamily: sans,
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: '#24301F',
                      textDecoration: erGjort ? 'line-through' : 'none',
                    }}
                  >
                    {item.art}
                  </span>
                  {!erGjort && (
                    <span
                      className="shrink-0 rounded-full"
                      style={{
                        fontFamily: sans,
                        fontSize: 11,
                        fontWeight: 600,
                        color: prio.label,
                        background: prio.chipBg,
                        padding: '3px 9px',
                      }}
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
                    textDecoration: erGjort ? 'line-through' : 'none',
                  }}
                >
                  {item.action}
                </span>
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
