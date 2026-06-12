/**
 * GuideFactCard — illustration i naturhåndbogen.
 *
 * Bruges når en guide har en naturlig "denne vs denne"-situation
 * (Rank vs busk, Forspir vs direkte, Sol vs halvskygge). Pakkes ind i
 * et flat creme-blok med to søjler — ikke et gult info-callout.
 *
 * Designdirektion (jf. user memory):
 *   - flade saturerede blokke, skarpe kanter
 *   - INGEN gradient
 *   - cremefarvet baggrund, tynd kant, afrundede hjørner
 *   - Cormorant titel, Manrope brødtekst
 *   - skal føles som en illustration i en naturhåndbog
 *
 * Stadium: minimumsversion til launch — kun `comparison`-varianten.
 * Flere varianter (single, list, photo-pair) kommer hvis vi får brug
 * for dem efter at have set 5-10 rigtige guides i praksis.
 */

import type { GuideFactColumn } from '@/lib/types'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  title: string
  variant: 'comparison'
  columns: GuideFactColumn[]
}

export function GuideFactCard({ title, variant, columns }: Props) {
  // Foreløbig: kun comparison renderes. Hvis vi senere har flere
  // varianter, splittes dette i underkomponenter.
  if (variant !== 'comparison' || columns.length < 2) {
    return null
  }

  // Brug de to første søjler (comparison = 2 søjler pr. design).
  const [left, right] = columns

  return (
    <aside
      role="figure"
      aria-label={title}
      style={{
        backgroundColor: '#F2EBD9',
        border: '1px solid rgba(36,48,31,0.10)',
        borderRadius: 22,
        padding: 'clamp(26px, 4.5vw, 40px) clamp(22px, 4vw, 34px)',
        maxWidth: 640,
      }}
      className="not-prose"
    >
      <h4
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(22px, 4vw, 28px)',
          lineHeight: 1.12,
          letterSpacing: '-0.02em',
          color: '#24301F',
          margin: 0,
          textAlign: 'center',
        }}
      >
        {title}
      </h4>

      <div
        aria-hidden
        style={{
          height: 1,
          backgroundColor: 'rgba(36,48,31,0.14)',
          margin: '20px 0 26px',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr',
          gap: 'clamp(20px, 4vw, 30px)',
          alignItems: 'start',
        }}
      >
        <FactColumnView column={left} />
        <div aria-hidden style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(36,48,31,0.14)' }} />
        <FactColumnView column={right} />
      </div>
    </aside>
  )
}

function FactColumnView({ column }: { column: GuideFactColumn }) {
  return (
    <div>
      <p
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(18px, 2.8vw, 21px)',
          lineHeight: 1.18,
          letterSpacing: '-0.01em',
          color: '#24301F',
          margin: '0 0 14px',
        }}
      >
        {column.heading}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {column.items.map((item, i) => (
          <li
            key={i}
            style={{
              fontFamily: sans,
              fontSize: 14.5,
              lineHeight: 1.6,
              color: 'rgba(36,48,31,0.80)',
              padding: '6px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(36,48,31,0.07)',
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
