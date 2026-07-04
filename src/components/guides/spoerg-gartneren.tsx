'use client'

/**
 * SpoergGartneren — lavmælt hjælpe-modul på Guides-siden.
 *
 * IKKE en chatbot, IKKE et AI-produkt, IKKE en stor hero. Et roligt felt-note-
 * kort mellem "Begynd her" og resten af siden: brugeren er stadig i "lær mig
 * noget"-mode, og her kan man stille et konkret havespørgsmål.
 *
 * Bevidst uden backend/AI-endpoint endnu — det er en visuel CTA/søge-agtig
 * komponent, der kan wires til en rigtig rådgiver senere. Ingen robot-ikon,
 * ingen glitrende AI-cirkus. MessageSquare + rolig copy gør arbejdet.
 */

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

export function SpoergGartneren() {
  // Kun lokal state, så feltet føles ægte. Ingen submit-logik endnu — CTA'en
  // er visuel og kan kobles til et AI-/rådgiver-endpoint senere.
  const [spoergsmaal, setSpoergsmaal] = useState('')

  return (
    <section
      aria-labelledby="spoerg-gartneren-titel"
      style={{
        background: 'rgba(238, 234, 219, 0.72)',
        border: '1px solid rgba(90,110,72,0.18)',
        borderRadius: 30,
        padding: '22px 22px 24px',
        boxShadow: '0 10px 24px rgba(64,58,42,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 999,
            background: 'rgba(78,97,56,0.12)',
            color: '#4E6138',
            flexShrink: 0,
          }}
        >
          <MessageSquare width={17} height={17} strokeWidth={2} />
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.5)',
          }}
        >
          Hjælp i felten
        </span>
      </div>

      <h2
        id="spoerg-gartneren-titel"
        style={{
          fontFamily: plex,
          fontWeight: 600,
          fontSize: 24,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          color: '#242019',
          margin: '0 0 8px',
        }}
      >
        Spørg gartneren
      </h2>

      <p
        style={{
          fontFamily: sans,
          fontSize: 14.5,
          fontWeight: 400,
          lineHeight: 1.45,
          color: '#6A665C',
          margin: '0 0 16px',
          maxWidth: 420,
        }}
      >
        Står du med en plante foran dig? Skriv hvad du dyrker, og få et roligt
        svar baseret på Potalots guides.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#FBF8EF',
          border: '1px solid rgba(36,48,31,0.12)',
          borderRadius: 16,
          padding: '4px 4px 4px 14px',
        }}
      >
        <input
          type="text"
          value={spoergsmaal}
          onChange={e => setSpoergsmaal(e.target.value)}
          placeholder="Hvorfor krøller tomatblade?"
          aria-label="Skriv dit havespørgsmål"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 500,
            color: '#24301F',
            padding: '9px 6px 9px 0',
          }}
        />
        <button
          type="button"
          // TODO: wire til rådgiver-/AI-endpoint. Indtil da: ren visuel CTA.
          style={{
            flexShrink: 0,
            fontFamily: sans,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#F6F3EB',
            background: '#4E6138',
            border: 'none',
            borderRadius: 12,
            padding: '9px 14px',
            cursor: 'pointer',
          }}
        >
          Spørg
        </button>
      </div>
    </section>
  )
}
