'use client'

/**
 * LaerAfHinanden — roligt "Lær af hinanden"-teaser-modul på guide-detaljesiden.
 *
 * Dyrker-erfaringer fra andre haver — IKKE et socialt feed. En ROLIG TEASER:
 * én featured erfaring vises, resten åbnes aktivt via "Se flere". Ingen vandret
 * carousel, ingen halvt-synligt næste kort (det gør sektionen travl). Tillids-
 * grænsen bæres af typografien — alt i Manrope (praktisk feltnote), aldrig
 * Cormorant (som er Potalot-guidens autoritet).
 *
 * V1 = design + demo-data + lokale/optimistiske interaktioner. Det rigtige
 * community-lag (deling, notifikationer, privat/anonym-persistens) er et
 * separat backend-sprint.
 */

import { useState } from 'react'
import { Sprout, BookmarkPlus, Check, ChevronDown } from 'lucide-react'
import type { DyrkerErfaring, ErfaringKind } from '@/data/guides-erfaringer'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'

const KIND_LABEL: Record<ErfaringKind, string> = {
  erfaring: 'Erfaring',
  observation: 'Observation',
  log: 'Dyrkningslog',
}

export function LaerAfHinanden({
  erfaringer,
}: {
  /** Sort- eller artsnavn, fx "San Marzano" / "Tomat". Beholdt i API'et selv
   *  om teaseren ikke længere skriver det i en intro-linje. */
  subject?: string
  erfaringer: DyrkerErfaring[]
}) {
  const [expanded, setExpanded] = useState(false)

  if (erfaringer.length === 0) return null

  const [teaser, ...resten] = erfaringer

  return (
    <section id="erfaringer" aria-labelledby="erfaringer-titel" className="scroll-mt-20">
      {/* Rolig eyebrow-linje: LÆR AF HINANDEN · BETA som ét tekstligt stop —
          BETA er nu inline i eyebrowen (ikke en separat pille), så modulet
          taber et visuelt lag. */}
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.55)',
          margin: 0,
        }}
      >
        Lær af hinanden{' '}
        <span style={{ color: 'rgba(78,97,56,0.75)' }}>· Beta</span>
      </p>

      <h2
        id="erfaringer-titel"
        style={{
          fontFamily: sans,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: '-0.01em',
          color: '#2D2A24',
          margin: '5px 0 0',
        }}
      >
        Erfaringer fra andre haver
      </h2>

      {/* Ingen ekstra intro-linje — titlen bærer beskeden. Ét lag mindre. */}
      <div className="mt-3 space-y-2.5">
        <ErfaringCard erfaring={teaser} />
        {expanded && resten.map(e => <ErfaringCard key={e.id} erfaring={e} />)}
      </div>

      {resten.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="group mt-2.5 inline-flex items-center gap-1"
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
            color: '#4E6138',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {expanded ? 'Vis færre' : `Se flere erfaringer (${resten.length})`}
          <ChevronDown
            width={14}
            height={14}
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
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1.4,
          color: 'rgba(36,48,31,0.4)',
          margin: '12px 0 0',
        }}
      >
        Erfaringer kan variere efter vejr, jord og placering.
      </p>
    </section>
  )
}

function ErfaringCard({ erfaring }: { erfaring: DyrkerErfaring }) {
  // Optimistiske, lokale interaktioner (demo). Rigtig persistens + notifikation
  // til den oprindelige dyrker hører til backend-sprintet.
  const [acked, setAcked] = useState(false)
  const [saved, setSaved] = useState(false)
  const count = erfaring.helpfulCount + (acked ? 1 : 0)

  return (
    <article
      style={{
        background: 'rgba(244,240,229,0.96)',
        border: '1px solid rgba(45,42,36,0.09)',
        borderRadius: 14,
        padding: '12px 14px',
      }}
    >
      {/* Kompakt meta-linje: type · sæson. */}
      <p
        className="m-0 uppercase"
        style={{
          fontFamily: sans,
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: 'rgba(78,97,56,0.85)',
        }}
      >
        {KIND_LABEL[erfaring.kind]}
        <span style={{ color: 'rgba(36,48,31,0.34)' }}> · {erfaring.season}</span>
      </p>

      <h3
        className="m-0 line-clamp-2"
        style={{
          fontFamily: sans,
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: '#2D2A24',
          marginTop: 5,
        }}
      >
        {erfaring.title}
      </h3>

      <p
        className="m-0"
        style={{
          fontFamily: sans,
          fontSize: 11.5,
          fontWeight: 600,
          color: 'rgba(36,48,31,0.5)',
          marginTop: 3,
        }}
      >
        {erfaring.place} · Jord: {erfaring.soil}
      </p>

      <p
        className="m-0 line-clamp-2"
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.45,
          color: '#6A665C',
          marginTop: 7,
        }}
      >
        {erfaring.excerpt}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setAcked(v => !v)}
          aria-pressed={acked}
          title="Marker at du havde gavn af den"
          className="inline-flex items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            color: acked ? '#4E6138' : 'rgba(36,48,31,0.55)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Sprout width={15} height={15} strokeWidth={acked ? 2.4 : 1.9} aria-hidden />
          {count} havde gavn
        </button>

        <button
          type="button"
          onClick={() => setSaved(v => !v)}
          aria-pressed={saved}
          className="inline-flex items-center gap-1"
          style={{
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 700,
            color: saved ? '#4E6138' : 'rgba(36,48,31,0.6)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {saved ? (
            <Check width={13} height={13} strokeWidth={2.4} aria-hidden />
          ) : (
            <BookmarkPlus width={13} height={13} strokeWidth={2} aria-hidden />
          )}
          {saved ? 'Gemt' : 'Gem i min log'}
        </button>
      </div>
    </article>
  )
}
