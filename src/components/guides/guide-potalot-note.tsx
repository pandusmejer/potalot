/**
 * GuidePotalotNote — signatur-blok for "Potalot-note"-sektionen.
 *
 * Redaktionel DOM/anbefaling ("Potalot anbefaler …") — ikke et praktisk råd.
 * Det adskiller den fra Potalot-tip (GuideNote): tip'et siger "gør sådan her";
 * denne note konkluderer. Derfor lidt mere autoritativ: dybere plante-tone,
 * diskret venstre accentkant, ingen billede, mere ro om teksten.
 *
 * Renderes automatisk når en prose-sektions title starter med
 * "Potalot" (case-insensitive) — så editoren ikke skal vide noget
 * særligt for at få signaturen.
 */

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
        // Dybere plante-tone end tip'et + diskret venstre accentkant = mere
        // autoritativ (redaktionel dom, ikke praktisk råd).
        backgroundColor: '#E7D9AF',
        border: '1px solid rgba(36,48,31,0.10)',
        borderLeft: '3px solid rgba(110,124,86,0.6)',
        borderRadius: 18,
        padding: 'clamp(24px, 4vw, 32px) clamp(22px, 3.6vw, 30px)',
        maxWidth: 640,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Potalot plante-glyph som signatur på anbefalings-noten. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/glyphs/plante.png"
          alt=""
          aria-hidden
          style={{ height: 20, width: 'auto' }}
        />
        <span
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.72)',
          }}
        >
          Potalot anbefaler
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
