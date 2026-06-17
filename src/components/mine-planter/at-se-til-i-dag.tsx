import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

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
 * ✅ I HAVEN I DAG — dagens planteopgaver, ikke dekorative former.
 * (Overskrift skiftet fra "At se til i dag" 17/6: for vag/gammeldags nu hvor
 *  sektionen har todo-karakter. "I haven i dag" = blød men handlingsklar.)
 *
 * Anna (16/6 aften): de gamle organiske blobs havde "for meget visuel
 * personlighed til så lidt information" — formen signalerede leg/stemning,
 * men indholdet er handling og prioritet. De trak i hver sin retning.
 *
 * Ny retning: kompakte bløde action-kort i en vertikal liste (opgaver
 * skal scannes hurtigt; horisontal scroll hører til billeder/steder).
 * Hvert kort svarer på HVAD, HVOR VIGTIGT og OM DET KAN GØRES NU:
 * status-dot + sort, handling, en farvekodet timing-chip, pil. Kun
 * plante-relaterede ting — Kalender bærer de generelle opgaver.
 */

const PRIO_META: Record<
  AtSeItem['priority'],
  { dot: string; label: string; chipBg: string }
> = {
  idag: { dot: '#C89A35', label: '#8A6D1F', chipBg: 'rgba(200,154,53,0.14)' },
  snart: { dot: '#5E7D4F', label: '#4C6038', chipBg: 'rgba(94,125,79,0.13)' },
  afventer: { dot: 'rgba(36,48,31,0.34)', label: 'rgba(36,48,31,0.5)', chipBg: 'rgba(36,48,31,0.06)' },
}

export function AtSeTilIDag({ items }: { items: AtSeItem[] }) {
  if (items.length === 0) return null

  return (
    <section>
      <header className="mb-3.5 flex items-baseline justify-between gap-3 px-0.5">
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

      <div className="space-y-2.5">
        {items.slice(0, 3).map((item, i) => {
          const prio = PRIO_META[item.priority]
          return (
            <Link
              key={`${item.art}-${i}`}
              href={item.href}
              className="group flex flex-col gap-2 transition-transform duration-200 ease-out active:scale-[0.99]"
              style={{
                background: '#F5F2EA',
                border: '1px solid rgba(36,48,31,0.06)',
                borderRadius: 18,
                padding: '13px 14px',
                boxShadow: '0 1px 2px rgba(36,48,31,0.04), 0 6px 16px rgba(36,48,31,0.05)',
              }}
            >
              {/* Linje 1: status-dot + sort (venstre) · timing-chip (højre). */}
              <span className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: prio.dot }}
                  />
                  <span
                    className="truncate"
                    style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: '#24301F' }}
                  >
                    {item.art}
                  </span>
                </span>
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
              </span>

              {/* Linje 2: handling (venstre) · pil (højre). */}
              <span className="flex items-center justify-between gap-3">
                <span
                  className="truncate"
                  style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 500, color: 'rgba(36,48,31,0.66)' }}
                >
                  {item.action}
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                  style={{ color: 'rgba(36,48,31,0.3)' }}
                  aria-hidden
                />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
