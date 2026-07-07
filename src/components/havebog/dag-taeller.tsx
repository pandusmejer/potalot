'use client'

import { useEffect, useState } from 'react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  /** Sæsondagen — "Dag 98" */
  dag: number
  /** Undertekst — "af din første sæson" */
  etiket: string
  /** Render lys-på-foto (når tælleren ligger oven på hero-billedet). */
  onImage?: boolean
}

/**
 * Dagtælleren (V13: premium magasin) — sin EGEN sektion efter heroen,
 * ikke oven på den. Stor, taktil, mekanisk: som et gammelt
 * kilometertællerhjul. Tre store cifre i midten på creme-bunden,
 * "DAG" over, "af din første sæson" under.
 *
 * Når Havebogen åbnes, klikker tallet på plads med to tik
 * (096 → 097 → 098) over ~520 ms — følelsen er "tiden går", ikke
 * "her er en statistik". Den skal føles vigtig: brugeren bygger
 * noget over tid.
 *
 * prefers-reduced-motion: springer direkte til slutværdien.
 * SSR: initialværdien (dag-2) er identisk på server og klient;
 * animationen starter i useEffect → ingen hydration-mismatch.
 */
export function DagTaeller({ dag, etiket, onImage = false }: Props) {
  const [vist, setVist] = useState(() => Math.max(1, dag - 2))

  useEffect(() => {
    if (vist >= dag) return
    const reduceret = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(
      () => setVist(reduceret ? dag : v => Math.min(dag, v + 1)),
      reduceret ? 0 : 260,
    )
    return () => clearTimeout(t)
  }, [vist, dag])

  const cifre = String(vist).padStart(3, '0').split('')

  // Farver: dæmpet mørk på creme-bunden — eller lys når tælleren ligger
  // oven på hero-fotoet. Læsbarheds-skyggen lægges som drop-shadow FILTER
  // på hele sektionen (følger tallenes form) — ikke text-shadow på ciffer-
  // boksen, som overflow:hidden ellers ville klippe til en firkant.
  const glow = onImage
    ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.55)) drop-shadow(0 3px 16px rgba(0,0,0,0.42))'
    : undefined
  const labelColor = onImage ? 'rgba(255,255,255,0.75)' : 'rgba(36,48,31,0.45)'
  const cifferColor = onImage ? '#FFFFFF' : '#24301F'
  const etiketColor = onImage ? 'rgba(255,255,255,0.92)' : 'rgba(36,48,31,0.62)'

  return (
    <section
      className="flex flex-col items-center"
      style={{ textAlign: 'center', paddingBlock: onImage ? 0 : '8px 4px', filter: glow }}
    >
      <style>{`
        @keyframes dagtaeller-tick {
          from { transform: translateY(-0.5em); opacity: 0.2; }
          to   { transform: translateY(0);      opacity: 1; }
        }
      `}</style>

      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
          color: labelColor,
          margin: 0,
          marginBottom: 10,
        }}
      >
        Dag
      </p>

      <span
        aria-label={`Dag ${dag}`}
        style={{
          display: 'inline-flex',
          overflow: 'hidden',
          fontFamily: sans,
          fontSize: 'clamp(72px, 22vw, 112px)',
          fontWeight: 700,
          lineHeight: 0.9,
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
          color: cifferColor,
        }}
      >
        {cifre.map((c, i) => (
          <span
            // Nøglen skifter med cifret → tick-animationen kører kun
            // på de hjul der faktisk drejer.
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

      <p
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(18px, 3.8vw, 22px)',
          lineHeight: 1.3,
          color: etiketColor,
          margin: 0,
          marginTop: 14,
        }}
      >
        {etiket}
      </p>
    </section>
  )
}
