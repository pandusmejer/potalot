'use client'

import { useEffect, useState } from 'react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  /** Sæsondagen — "Dag 98" */
  dag: number
  /** Undertekst — "af din første sæson" */
  etiket: string
}

/**
 * Dagtælleren (V9: havens stue) — heroens taktile tidselement.
 *
 * Tænk gammeldags flip-counter, ikke digital KPI: når Havebogen
 * åbnes, klikker tallet på plads med to tik (096 → 097 → 098)
 * over ~520 ms. Følelsen er "tiden går" — ikke "her er en
 * statistik". Dagtælleren minder om sæsonens rytme, fremdrift,
 * ventetid og forventning. Det er et følelsesmæssigt element.
 *
 * prefers-reduced-motion: tallet står stille på slutværdien.
 *
 * SSR-note: initialværdien (dag-2) renderes på serveren og er
 * identisk på klienten — animationen starter først i useEffect,
 * så der er ingen hydration-mismatch.
 */
export function DagTaeller({ dag, etiket }: Props) {
  const [vist, setVist] = useState(() => Math.max(1, dag - 2))

  useEffect(() => {
    if (vist >= dag) return
    // prefers-reduced-motion: spring direkte til slutværdien (ét
    // tick uden ventetid) i stedet for at animere hjulene.
    const reduceret = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(
      () => setVist(reduceret ? dag : v => Math.min(dag, v + 1)),
      reduceret ? 0 : 260,
    )
    return () => clearTimeout(t)
  }, [vist, dag])

  const cifre = String(vist).padStart(3, '0').split('')

  return (
    <div style={{ marginTop: 20 }}>
      <style>{`
        @keyframes dagtaeller-tick {
          from { transform: translateY(-0.55em); opacity: 0.25; }
          to   { transform: translateY(0);       opacity: 1; }
        }
      `}</style>
      <p
        style={{
          fontFamily: sans,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.66)',
          textShadow: '0 1px 6px rgba(0,0,0,0.45)',
          margin: 0,
          marginBottom: 4,
        }}
      >
        Dag
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span
          aria-label={`Dag ${dag}`}
          style={{
            display: 'inline-flex',
            overflow: 'hidden',
            fontFamily: sans,
            fontSize: 34,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '0.08em',
            fontVariantNumeric: 'tabular-nums',
            color: '#FFFFFF',
            textShadow: '0 2px 14px rgba(0,0,0,0.45)',
          }}
        >
          {cifre.map((c, i) => (
            <span
              // Nøglen skifter når cifret skifter → tick-animationen
              // kører kun på de hjul der faktisk drejer.
              key={`${i}-${c}`}
              aria-hidden
              style={{
                display: 'inline-block',
                animation: 'dagtaeller-tick 240ms ease-out',
              }}
            >
              {c}
            </span>
          ))}
        </span>
        <span
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(16px, 3.2vw, 19px)',
            color: 'rgba(255,255,255,0.88)',
            textShadow: '0 1px 10px rgba(0,0,0,0.5)',
          }}
        >
          {etiket}
        </span>
      </div>
    </div>
  )
}
