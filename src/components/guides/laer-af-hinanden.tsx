'use client'

/**
 * LaerAfHinanden — roligt "Lær af hinanden"-modul på guide-detaljesiden.
 *
 * Dyrker-erfaringer og observationer fra andre haver — IKKE et socialt feed og
 * IKKE en erstatning for Potalot-guidens autoritet. Et lag UNDER guiden: praktisk
 * viden fra virkelige haver, tydeligt adskilt fra Potalots anbefalinger.
 *
 * Præsenteres som en VANDRET, rolig erfarings-strip (ikke en lodret stak, der
 * ligner endnu et tungt kapitel): lave, horisontale kort i horisontal scroll,
 * med antydning af næste kort. Tillidsgrænsen bæres af typografien — erfaringer
 * i Manrope (praktisk feltnote), Potalot-guiden i Cormorant (autoritet).
 *
 * V1 = design + demo-data + lokale/optimistiske interaktioner. Det rigtige
 * community-lag (deling på tværs, anerkendelses-notifikationer, privat/anonym-
 * persistens) er et separat backend-sprint.
 */

import { useRef, useState } from 'react'
import { Sprout, BookmarkPlus, Check, ChevronRight } from 'lucide-react'
import type { DyrkerErfaring, ErfaringKind } from '@/data/guides-erfaringer'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'

const KIND_LABEL: Record<ErfaringKind, string> = {
  erfaring: 'Erfaring',
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
  const stripRef = useRef<HTMLDivElement>(null)

  if (erfaringer.length === 0) return null

  function scrollNext() {
    const el = stripRef.current
    if (!el) return
    // Rul cirka én kort-bredde frem (kortene fylder ~86% af strippen på mobil).
    el.scrollBy({ left: Math.round(el.clientWidth * 0.86), behavior: 'smooth' })
  }

  return (
    <section id="erfaringer" aria-labelledby="erfaringer-titel" className="scroll-mt-20">
      <div className="flex items-center gap-2">
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
        <span
          style={{
            fontFamily: sans,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#4E6138',
            background: 'rgba(123,148,96,0.16)',
            border: '1px solid rgba(123,148,96,0.28)',
            borderRadius: 999,
            padding: '2px 7px',
          }}
        >
          Beta
        </span>
      </div>

      <div className="mt-1.5 flex items-end justify-between gap-3">
        <h2
          id="erfaringer-titel"
          style={{
            fontFamily: sans,
            fontSize: 'clamp(20px, 4.6vw, 23px)',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: '#2D2A24',
            margin: 0,
          }}
        >
          Erfaringer fra andre haver
        </h2>
        {erfaringer.length > 1 && (
          <button
            type="button"
            onClick={scrollNext}
            className="group inline-flex shrink-0 items-center gap-1"
            style={{
              fontFamily: sans,
              fontSize: 12.5,
              fontWeight: 700,
              color: '#4E6138',
              background: 'transparent',
              border: 'none',
              padding: '2px 0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Se flere ({erfaringer.length})
            <ChevronRight width={15} height={15} strokeWidth={2.25} aria-hidden />
          </button>
        )}
      </div>

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

      {/* Vandret strip: kortene fylder ~86% på mobil, så næste kort peeker; snap
          giver rolig swipe. Negativ margin + padding lader strippen bløde ud til
          skærmkanten uden at bryde sidens kolonne. */}
      <div
        ref={stripRef}
        className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {erfaringer.map(e => (
          <ErfaringCard key={e.id} erfaring={e} />
        ))}
      </div>

      <p
        style={{
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.45,
          color: 'rgba(36,48,31,0.45)',
          margin: '14px 0 0',
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
      className="flex w-[86%] shrink-0 snap-start flex-col sm:w-[300px]"
      style={{
        background: 'rgba(244,240,229,0.96)',
        border: '1px solid rgba(45,42,36,0.09)',
        borderRadius: 16,
        padding: '13px 14px',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          style={{
            fontFamily: sans,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#4E6138',
            background: 'rgba(123,148,96,0.14)',
            borderRadius: 999,
            padding: '3px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          {KIND_LABEL[erfaring.kind]}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.42)',
            whiteSpace: 'nowrap',
          }}
        >
          {erfaring.season}
        </span>
      </div>

      <h3
        className="line-clamp-2"
        style={{
          fontFamily: sans,
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          color: '#2D2A24',
          margin: '9px 0 0',
        }}
      >
        {erfaring.title}
      </h3>

      <p
        style={{
          fontFamily: sans,
          fontSize: 11.5,
          fontWeight: 600,
          color: 'rgba(36,48,31,0.5)',
          margin: '6px 0 0',
        }}
      >
        {erfaring.place} · Jord: {erfaring.soil}
      </p>

      <p
        className="line-clamp-3"
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.48,
          color: '#6A665C',
          margin: '8px 0 0',
        }}
      >
        {erfaring.excerpt}
      </p>

      <div
        className="mt-auto flex items-center justify-between gap-2"
        style={{ paddingTop: 12 }}
      >
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
          className="inline-flex items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 700,
            color: saved ? '#4E6138' : '#2D2A24',
            background: saved ? 'rgba(123,148,96,0.14)' : 'rgba(36,48,31,0.05)',
            border: '1px solid',
            borderColor: saved ? 'rgba(123,148,96,0.32)' : 'rgba(45,42,36,0.12)',
            borderRadius: 999,
            padding: '5px 11px',
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
