/**
 * GuidePotalotNote — signatur-blok for "Potalot-note"-sektionen.
 *
 * Ét fast visuelt element der går igen på TVÆRS af alle guides:
 * ⚘ POTALOT-eyebrow, varmere creme-tone, kursiv brødtekst. Det er
 * stedet hvor redaktøren skriver "én sætning der gør det personligt".
 *
 * Renderes automatisk når en prose-sektions title starter med
 * "Potalot" (case-insensitive) — så editoren ikke skal vide noget
 * særligt for at få signaturen.
 */

import { Flower2 } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  body: string
}

export function GuidePotalotNote({ body }: Props) {
  return (
    <aside
      className="not-prose"
      style={{
        backgroundColor: '#E8DEBE',
        border: '1px solid rgba(36,48,31,0.10)',
        borderRadius: 18,
        padding: 'clamp(22px, 3.8vw, 30px) clamp(22px, 3.6vw, 30px)',
        maxWidth: 640,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Flower2
          className="h-4 w-4"
          aria-hidden
          style={{ color: 'rgba(36,48,31,0.65)' }}
        />
        <span
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.65)',
          }}
        >
          Potalot
        </span>
      </div>
      <p
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(17px, 2.8vw, 19.5px)',
          lineHeight: 1.55,
          color: 'rgba(36,48,31,0.86)',
          margin: '12px 0 0',
          whiteSpace: 'pre-line',
        }}
      >
        {body}
      </p>
    </aside>
  )
}

/** Heuristik: er denne prose-sektion en Potalot-note? */
export function isPotalotNoteSection(title: string): boolean {
  return title.trim().toLowerCase().startsWith('potalot')
}
