'use client'

/**
 * KortForklaret — kompakt "forklaringsnote" på Guides-siden.
 *
 * IKKE en "guide i felten" (leder ikke videre til en planteguide) og IKKE
 * sidens hovedsektion. Et lille redaktionelt lær-mere-lag: default er en
 * teaser (label + titel + én linje + "Læs forskellen"-CTA), der folder den
 * fulde sammenligning ud på klik. Placeres EFTER "Guides i felten", så den
 * ikke afbryder find-en-guide-flowet.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const plex = 'var(--font-plex-condensed), sans-serif'

export interface KortForklaretColumn {
  heading: string
  items: string[]
}

interface Props {
  kicker?: string
  title: string
  teaser: string
  columns: KortForklaretColumn[]
}

export function KortForklaret({
  kicker = 'Kort forklaret',
  title,
  teaser,
  columns,
}: Props) {
  const [open, setOpen] = useState(false)
  const [left, right] = columns

  return (
    <section
      aria-labelledby="kort-forklaret-titel"
      style={{
        background: '#F4F0E5',
        border: '1px solid rgba(45,42,36,0.12)',
        borderRadius: 20,
        padding: '18px 20px 20px',
      }}
    >
      <div
        aria-hidden
        style={{ width: 40, height: 1, background: 'rgba(78,97,56,0.5)', marginBottom: 12 }}
      />
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.55)',
          margin: '0 0 4px',
        }}
      >
        {kicker}
      </p>
      <h2
        id="kort-forklaret-titel"
        style={{
          fontFamily: plex,
          fontWeight: 600,
          fontSize: 24,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          color: '#242019',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.45,
          color: '#6A665C',
          margin: '6px 0 0',
          maxWidth: 440,
        }}
      >
        {teaser}
      </p>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          marginTop: 12,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 700,
          color: '#4E6138',
        }}
      >
        {open ? 'Skjul forskellen' : 'Læs forskellen'}
        <ChevronDown
          width={15}
          height={15}
          strokeWidth={2.25}
          aria-hidden
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
        />
      </button>

      {open && left && right && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr',
            gap: 14,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(45,42,36,0.12)',
          }}
        >
          <Column column={left} />
          <div aria-hidden style={{ background: 'rgba(45,42,36,0.12)' }} />
          <Column column={right} />
        </div>
      )}
    </section>
  )
}

function Column({ column }: { column: KortForklaretColumn }) {
  return (
    <div>
      <h3
        style={{
          fontFamily: plex,
          fontWeight: 600,
          fontSize: 19,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          color: '#242019',
          margin: '0 0 8px',
        }}
      >
        {column.heading}
      </h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {column.items.map((item, i) => (
          <li
            key={item}
            style={{
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.35,
              color: 'rgba(36,48,31,0.76)',
              padding: '7px 0',
              borderTop: i === 0 ? undefined : '1px solid rgba(45,42,36,0.09)',
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
