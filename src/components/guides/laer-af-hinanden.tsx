'use client'

/**
 * LaerAfHinanden — rolig, redaktionel "Lær af hinanden"-teaser på guide-
 * detaljesiden. IKKE et feed, en carousel eller social UI.
 *
 * Bygget nøjagtigt efter Anna-spec (mobil-only, ~390px):
 *   eyebrow (BETA inline) → sektionstitel (guidefont) → intro →
 *   ét fremhævet erfaringskort → "Se flere (N) →" → lille disclaimer.
 *
 * Regler: kun ét kort i standardvisning, ingen carousel-peek, ingen avatarer,
 * ingen likes/"havde gavn", ingen billeder. Alt brugerindhold i Manrope, så
 * det tydeligt adskiller sig fra Potalot-guidens indhold. Ingen Cormorant her.
 *
 * V1 = design + demo-data + lokal "Gem i min log". Det rigtige community-lag
 * (deling, notifikationer, persistens) er et separat backend-sprint.
 */

import { useState } from 'react'
import { Bookmark, BookmarkPlus, BookmarkCheck, ChevronRight } from 'lucide-react'
import type { DyrkerErfaring } from '@/data/guides-erfaringer'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
// Videnskabelig guidefont — samme som guideoverskrifter (ikke Cormorant).
const plex = 'var(--font-plex-condensed), sans-serif'

const olive = '#4E6138'
const dark = '#2D2A24'
const muted = 'rgba(36,48,31,0.55)'

export function LaerAfHinanden({
  subject,
  erfaringer,
  heading,
  intro,
  collapsible = false,
}: {
  /** Sort- eller artsnavn, fx "San Marzano" / "Tomat". */
  subject?: string
  erfaringer: DyrkerErfaring[]
  /** Overskrift (arts: "Erfaringer med tomater"). Falder tilbage til standard. */
  heading?: string
  /** Intro-linje. Falder tilbage til subject-baseret standard. */
  intro?: string
  /** Arts: foldet/sekundært — ingen kort vises før brugeren åbner modulet. */
  collapsible?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  if (erfaringer.length === 0) return null

  const [featured, ...resten] = erfaringer

  // Foldet (arts): intet kort før åbning; toggle viser/skjuler ALLE.
  // Standard (sort): fremhævet kort + "Se flere".
  const cardsToShow = collapsible
    ? expanded
      ? erfaringer
      : []
    : expanded
      ? erfaringer
      : [featured]
  const toggleLabel = collapsible
    ? expanded
      ? 'Skjul erfaringer'
      : `Vis erfaringer (${erfaringer.length})`
    : expanded
      ? 'Skjul erfaringer'
      : `Se flere erfaringer (${resten.length})`
  const showToggle = collapsible ? erfaringer.length > 0 : resten.length > 0

  return (
    <section id="erfaringer" aria-labelledby="erfaringer-titel" className="scroll-mt-20">
      {/* Eyebrow — BETA inline efter punktum, ikke en separat pille. */}
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          lineHeight: 1,
          color: muted,
          margin: '0 0 12px',
        }}
      >
        Lær af hinanden <span style={{ color: 'rgba(78,97,56,0.8)' }}>· Beta</span>
      </p>

      <h2
        id="erfaringer-titel"
        style={{
          // Sekundært teaser-modul — må ikke over-bolde de nummererede
          // hovedkapitler (Plex 25/600). Tydelig, men ikke dominerende.
          fontFamily: plex,
          fontSize: 'clamp(24px, 6.2vw, 26px)',
          fontWeight: 600,
          lineHeight: 1.13,
          letterSpacing: '-0.015em',
          color: dark,
          margin: '0 0 12px',
        }}
      >
        {heading ?? 'Erfaringer fra andre haver'}
      </h2>

      <p
        style={{
          fontFamily: plex,
          fontSize: 14,
          fontWeight: 300,
          lineHeight: 1.45,
          color: 'rgba(36,42,28,0.72)',
          margin: '0 0 24px',
        }}
      >
        {intro ?? `Se, hvad andre dyrkere har oplevet med ${subject ?? 'sorten'}.`}
      </p>

      {cardsToShow.length > 0 && (
        <div className="space-y-3">
          {cardsToShow.map((e) => (
            <ErfaringCard key={e.id} erfaring={e} />
          ))}
        </div>
      )}

      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="group inline-flex items-center"
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.2,
            color: olive,
            background: 'transparent',
            border: 'none',
            padding: 0,
            // Foldet-modus har ingen kort over knappen → mindre top-margin.
            marginTop: cardsToShow.length > 0 ? 'calc(28px - 2mm)' : 4,
            gap: 10,
            cursor: 'pointer',
          }}
        >
          {toggleLabel}
          <ChevronRight
            width={14}
            height={14}
            strokeWidth={2.25}
            aria-hidden
            style={{
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 160ms ease',
            }}
          />
        </button>
      )}
    </section>
  )
}

function ErfaringCard({ erfaring }: { erfaring: DyrkerErfaring }) {
  // Optimistisk, lokal "Gem i min log" (demo). Ingen likes/"havde gavn"/avatar.
  const [saved, setSaved] = useState(false)

  // Metadata: sted · jord · sæson. Manglende felter udelades, så vi aldrig
  // viser tomme punktummer. Sæson vises som årstal ("Sæson 2024" → "2024").
  const meta = [
    erfaring.place,
    erfaring.soil,
    erfaring.season?.replace(/^sæson\s+/i, ''),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article
      style={{
        background: 'rgba(244,240,229,0.96)',
        border: '1px solid rgba(45,42,36,0.10)',
        borderRadius: 14,
        padding: '20px 20px 18px',
      }}
    >
      {/* Top: label-chip (venstre) + metadata (højre). */}
      <div className="flex items-center justify-between gap-3" style={{ marginBottom: 20 }}>
        <span
          className="inline-flex items-center uppercase"
          style={{
            height: 27,
            padding: '0 12px',
            borderRadius: 8,
            background: 'rgba(123,148,96,0.18)',
            color: olive,
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.12em',
            lineHeight: 1,
          }}
        >
          Erfaring
        </span>
        <span
          className="text-right"
          style={{
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'rgb(154,149,137)',
          }}
        >
          {meta}
        </span>
      </div>

      <h3
        className="line-clamp-2"
        style={{
          fontFamily: sans,
          fontSize: 'clamp(18px, 5vw, 20px)',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          color: dark,
          margin: '0 0 12px',
        }}
      >
        {erfaring.title}
      </h3>

      <p
        className="line-clamp-3"
        style={{
          fontFamily: sans,
          fontSize: 'clamp(13px, 3.6vw, 14.5px)',
          fontWeight: 500,
          lineHeight: 1.5,
          color: 'rgba(45,42,36,0.78)',
          margin: '0 0 18px',
        }}
      >
        {erfaring.excerpt}
      </p>

      <div style={{ height: 1, background: 'rgba(45,42,36,0.10)', margin: '0 0 16px' }} />

      {/* Bund: statisk gemt-tæller (venstre) + "Gem i min log"-knap (højre). */}
      <div className="flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center"
          style={{
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.64)',
            gap: 7,
            whiteSpace: 'nowrap',
          }}
        >
          <Bookmark width={14} height={14} strokeWidth={1.9} aria-hidden />
          {erfaring.helpfulCount} gemte erfaringen
        </span>

        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          aria-pressed={saved}
          className="inline-flex shrink-0 items-center justify-center"
          style={{
            height: 35,
            padding: '0 12px',
            borderRadius: 8,
            border: `1.5px solid ${saved ? olive : 'rgba(78,97,56,0.55)'}`,
            background: saved ? 'rgba(123,148,96,0.14)' : 'transparent',
            color: olive,
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 700,
            gap: 7,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          {saved ? (
            <BookmarkCheck width={14} height={14} strokeWidth={2.1} aria-hidden />
          ) : (
            <BookmarkPlus width={14} height={14} strokeWidth={2} aria-hidden />
          )}
          {saved ? 'Gemt' : 'Gem i min log'}
        </button>
      </div>
    </article>
  )
}
