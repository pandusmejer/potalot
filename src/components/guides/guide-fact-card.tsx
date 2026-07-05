/**
 * GuideFactCard — beslutningsmodul i naturhåndbogen.
 *
 * IKKE en pyntet sammenligningstabel. Sektionen skal HJÆLPE brugeren med at
 * VÆLGE, ikke bare stille to kolonner egenskaber op mod hinanden. Derfor:
 *   - kort intro der rammer beslutningskriteriet
 *   - to "Vælg X hvis …"-blokke, stacked på mobil (ikke tynde to-kolonner)
 *   - korte, scannbare punkter
 *   - en konklusion der lander valget
 *
 * Designdirektion: flad creme/sand-blok, eksisterende oliven-palet, ingen nye
 * farver, ingen ikoner pr. række, ingen tung tabel-følelse. Titel i guidefont
 * (Plex), brugerindhold i Manrope — ingen store dekorative serif-kolonner.
 */

import type { GuideFactColumn } from '@/lib/types'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'
const olive = '#4E6138'

interface Props {
  title: string
  variant: 'comparison'
  columns: GuideFactColumn[]
  intro?: string
  conclusion?: string
}

export function GuideFactCard({ title, variant, columns, intro, conclusion }: Props) {
  if (variant !== 'comparison' || columns.length < 2) {
    return null
  }

  const [left, right] = columns

  return (
    <aside
      role="figure"
      aria-label={title}
      className="not-prose"
      style={{
        backgroundColor: '#F2EBD9',
        border: '1px solid rgba(36,48,31,0.10)',
        borderRadius: 16,
        padding: 'clamp(20px, 4.5vw, 28px) clamp(18px, 4vw, 24px)',
        maxWidth: 640,
      }}
    >
      <h4
        style={{
          fontFamily: plex,
          fontWeight: 600,
          fontSize: 'clamp(20px, 4.8vw, 24px)',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          color: '#24301F',
          margin: 0,
        }}
      >
        {title}
      </h4>

      {intro && (
        <p
          style={{
            fontFamily: sans,
            fontSize: 13.5,
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'rgba(36,48,31,0.6)',
            margin: '8px 0 0',
          }}
        >
          {intro}
        </p>
      )}

      {/* Stacked beslutningsblokke — ikke to tynde kolonner. */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <DecisionBlock column={left} />
        <DecisionBlock column={right} />
      </div>

      {conclusion && (
        <>
          <div
            aria-hidden
            style={{ height: 1, backgroundColor: 'rgba(36,48,31,0.12)', margin: '18px 0 14px' }}
          />
          <p
            style={{
              fontFamily: sans,
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.45,
              color: olive,
              margin: 0,
            }}
          >
            {conclusion}
          </p>
        </>
      )}
    </aside>
  )
}

function DecisionBlock({ column }: { column: GuideFactColumn }) {
  return (
    <div>
      <p
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.01em',
          color: olive,
          margin: '0 0 9px',
        }}
      >
        {column.heading}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {column.items.map((item, i) => (
          <li
            key={i}
            style={{
              fontFamily: sans,
              fontSize: 14.5,
              lineHeight: 1.4,
              color: 'rgba(36,48,31,0.82)',
              display: 'flex',
              gap: 9,
            }}
          >
            <span aria-hidden style={{ color: 'rgba(123,143,99,0.95)', flexShrink: 0 }}>
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
