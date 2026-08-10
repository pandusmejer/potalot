'use client'

/**
 * SpoergGartneren — lavmælt hjælpe-modul på Guides-siden.
 *
 * IKKE en chatbot, IKKE et AI-produkt, IKKE en stor hero. Et roligt felt-note-
 * kort mellem "Begynd her" og resten af siden: brugeren er stadig i "lær mig
 * noget"-mode, og her kan man stille et konkret havespørgsmål.
 *
 * Wiret til Gartner-motoren (/api/ai/gartner) 5/8 — svaret streames ind i
 * et roligt panel under feltet. Ingen robot-ikon, ingen glitrende AI-cirkus.
 * Et blødt Potalot-plante-glyph + rolig copy gør arbejdet — botanisk
 * havehjælp, ikke supportchat.
 */

import { useState } from 'react'
import { GartnerSvarPanel, useGartner } from '@/components/ai/gartner-svar'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * Kontekst-trappen (Anna 9/8): samme komponent, samme design — kun
 * hjælpetekst, placeholder og den kontekst endpointet modtager varierer.
 * Placering ER kontekst: Gartneren må aldrig spørge om det, Potalot
 * allerede ved fra hvor brugeren står.
 *   Forside: universel · Artsguide: arten kendt · Sortsguide: sort + art.
 */
export function SpoergGartneren({
  guideId,
  artPlural,
  sortNavn,
}: {
  /** Guide-id sendes med til motoren — placering er kontekst. */
  guideId?: string
  /** Artsguide: flertalsnavn til copy ("tomater"). */
  artPlural?: string
  /** Sortsguide: sortsnavnet ("Sungold"). */
  sortNavn?: string
} = {}) {
  const [spoergsmaal, setSpoergsmaal] = useState('')
  // Det FAKTISK stillede spørgsmål (inputfeltet kan redigeres bagefter) —
  // gemmes sammen med svaret ved "Gem til senere".
  const [stillet, setStillet] = useState('')
  const { tilstand, svar, spoerg } = useGartner()

  const artLav = artPlural?.toLowerCase()
  const beskrivelse = sortNavn
    ? `Spørg om ${sortNavn}. Gartneren tager allerede udgangspunkt i sorten.`
    : artLav
      ? `Spørg om dyrkning, problemer eller pleje af ${artLav}.`
      : 'Har du et spørgsmål om haven? Fortæl, hvad du dyrker, eller hvad du er i tvivl om.'
  const pladsholder = sortNavn
    ? `Spørg om ${sortNavn}…`
    : artLav
      ? `Spørg om ${artLav}…`
      : 'Hvad vil du have hjælp til?'

  function stil() {
    const q = spoergsmaal.trim()
    if (!q) return
    setStillet(q)
    spoerg(q, guideId ? { guideId } : undefined)
  }

  return (
    <section
      aria-labelledby="spoerg-gartneren-titel"
      style={{
        // Hvisker grønt, holder ikke tale: meget let salvie-tone + lidt
        // tydeligere oliven-omrids. Ingen kraftigt farvet flade.
        background: 'rgba(232, 236, 218, 0.38)',
        border: '1px solid rgba(86, 111, 60, 0.26)',
        borderRadius: 30,
        padding: '22px 22px 24px',
        boxShadow:
          '0 18px 36px rgba(64, 58, 42, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
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
            background: 'rgba(86, 111, 60, 0.14)',
            border: '1px solid rgba(86, 111, 60, 0.20)',
            color: '#566F3C',
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async"
            src="/images/glyphs/plante.png"
            alt=""
            aria-hidden
            style={{ width: 'auto', height: 23, display: 'block' }}
          />
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
        Spørg Potalot-gartneren
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
        {beskrivelse}
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
          placeholder={pladsholder}
          aria-label="Skriv dit havespørgsmål"
          onKeyDown={e => { if (e.key === 'Enter') stil() }}
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
          onClick={stil}
          disabled={tilstand === 'streamer'}
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

      <GartnerSvarPanel tilstand={tilstand} svar={svar} question={stillet} guideId={guideId} />
    </section>
  )
}
