'use client'

/**
 * LaerAfHinanden — roligt "Lær af hinanden"-modul på guide-detaljesiden.
 *
 * Dyrker-erfaringer og observationer fra andre haver — IKKE et socialt feed og
 * IKKE en erstatning for Potalot-guidens autoritet. Et lag UNDER guiden: praktisk
 * viden fra virkelige haver, tydeligt adskilt fra Potalots anbefalinger.
 *
 * Tillidsgrænsen bæres af typografien: erfaringer står i Manrope (praktisk
 * feltnote), mens Potalot-guiden er Cormorant (editorial autoritet). Label-chips
 * ("Erfaring fra dyrker" / "Observation" / "Dyrkningslog") gør det eksplicit.
 *
 * V1 = design + demo-data + lokale/optimistiske interaktioner. Det rigtige
 * community-lag (deling på tværs, anerkendelses-notifikationer, privat/anonym-
 * persistens) er et separat backend-sprint.
 */

import { useState } from 'react'
import { Sprout, BookmarkPlus, Check, ChevronDown } from 'lucide-react'
import type { DyrkerErfaring, ErfaringKind } from '@/data/guides-erfaringer'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'

const KIND_LABEL: Record<ErfaringKind, string> = {
  erfaring: 'Erfaring fra dyrker',
  observation: 'Observation',
  log: 'Dyrkningslog',
}

export function LaerAfHinanden({
  subject,
  erfaringer,
}: {
  /** Sort- eller artsnavn, fx "San Marzano" / "Tomat". */
  subject: string
  erfaringer: DyrkerErfaring[]
}) {
  const [expanded, setExpanded] = useState(false)

  if (erfaringer.length === 0) return null

  const teaser = erfaringer[0]
  const resten = erfaringer.slice(1)
  const synlige = expanded ? erfaringer : [teaser]

  return (
    <section id="erfaringer" aria-labelledby="erfaringer-titel" className="scroll-mt-20">
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.55)',
          margin: 0,
        }}
      >
        Lær af hinanden
      </p>
      <h2
        id="erfaringer-titel"
        style={{
          fontFamily: sans,
          fontSize: 'clamp(20px, 4.6vw, 23px)',
          fontWeight: 800,
          letterSpacing: '-0.01em',
          color: '#2D2A24',
          margin: '6px 0 0',
        }}
      >
        Erfaringer fra andre haver
      </h2>
      <p
        style={{
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.5,
          color: '#6A665C',
          margin: '6px 0 0',
          maxWidth: '48ch',
        }}
      >
        Se hvad andre dyrkere har oplevet med {subject} i deres egne haver.
      </p>

      <div className="mt-4 space-y-3">
        {synlige.map(e => (
          <ErfaringCard key={e.id} erfaring={e} />
        ))}
      </div>

      {resten.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="group mt-3 inline-flex items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            color: '#4E6138',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {expanded ? 'Vis færre erfaringer' : `Se flere erfaringer (${resten.length})`}
          <ChevronDown
            width={15}
            height={15}
            strokeWidth={2.25}
            aria-hidden
            style={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 160ms ease',
            }}
          />
        </button>
      )}

      <p
        style={{
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.45,
          color: 'rgba(36,48,31,0.45)',
          margin: '16px 0 0',
          maxWidth: '48ch',
        }}
      >
        Erfaringer fra andre dyrkere kan variere efter vejr, jord og placering.
      </p>
    </section>
  )
}

function ErfaringCard({ erfaring }: { erfaring: DyrkerErfaring }) {
  // Optimistiske, lokale interaktioner (demo). Rigtig persistens + anerkendelses-
  // notifikation til den oprindelige dyrker hører til backend-sprintet.
  const [acked, setAcked] = useState(false)
  const [saved, setSaved] = useState(false)
  const count = erfaring.helpfulCount + (acked ? 1 : 0)

  return (
    <article
      style={{
        background: 'rgba(244,240,229,0.96)',
        border: '1px solid rgba(45,42,36,0.09)',
        borderRadius: 16,
        padding: '15px 16px',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          style={{
            fontFamily: sans,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#4E6138',
            background: 'rgba(123,148,96,0.14)',
            border: '1px solid rgba(123,148,96,0.22)',
            borderRadius: 999,
            padding: '4px 9px',
            whiteSpace: 'nowrap',
          }}
        >
          {KIND_LABEL[erfaring.kind]}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.42)',
            whiteSpace: 'nowrap',
            marginTop: 2,
          }}
        >
          {erfaring.season}
        </span>
      </div>

      <h3
        style={{
          fontFamily: sans,
          fontSize: 15.5,
          fontWeight: 700,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          color: '#2D2A24',
          margin: '10px 0 0',
        }}
      >
        {erfaring.title}
      </h3>

      {erfaring.conditions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {erfaring.conditions.map(c => (
            <span
              key={c}
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(36,48,31,0.6)',
                background: 'rgba(36,48,31,0.05)',
                borderRadius: 6,
                padding: '3px 8px',
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <p
        style={{
          fontFamily: sans,
          fontSize: 13.5,
          fontWeight: 500,
          lineHeight: 1.5,
          color: '#6A665C',
          margin: '10px 0 0',
        }}
      >
        {erfaring.excerpt}
      </p>

      <div className="mt-3.5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setAcked(v => !v)}
          aria-pressed={acked}
          title="Marker at du havde gavn af den"
          className="inline-flex items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
            color: acked ? '#4E6138' : 'rgba(36,48,31,0.55)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Sprout
            width={16}
            height={16}
            strokeWidth={acked ? 2.4 : 1.9}
            aria-hidden
          />
          {count} havde gavn
        </button>

        <button
          type="button"
          onClick={() => setSaved(v => !v)}
          aria-pressed={saved}
          className="inline-flex items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 700,
            color: saved ? '#4E6138' : '#2D2A24',
            background: saved ? 'rgba(123,148,96,0.14)' : 'rgba(36,48,31,0.05)',
            border: '1px solid',
            borderColor: saved ? 'rgba(123,148,96,0.32)' : 'rgba(45,42,36,0.12)',
            borderRadius: 999,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          {saved ? (
            <Check width={14} height={14} strokeWidth={2.4} aria-hidden />
          ) : (
            <BookmarkPlus width={14} height={14} strokeWidth={2} aria-hidden />
          )}
          {saved ? 'Gemt i din log' : 'Gem i min log'}
        </button>
      </div>
    </article>
  )
}
