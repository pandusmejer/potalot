/**
 * GuideNextCard — det redaktionelle "store næste skridt".
 *
 * Højst én pr. guide. Vises typisk allersidst på siden som det
 * editoriale sidste skub mod næste naturlige guide (en sort, en teknik,
 * en relateret art).
 *
 * Visuelt: større end de andre blokke. Mere prominent typografi.
 * Hero-agtig, men stadig flat — ingen gradient, ren creme.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
// Videnskabelig guidefont — titler på arts-/sortguide-kort (jf. typografi-regel).
const plex = 'var(--font-plex-condensed), sans-serif'

interface Props {
  title: string
  description: string
  slug: string
  label: string
  /** Valgfrit baggrundsfoto — fades bag teksten. */
  backgroundImage?: string | null
}

export function GuideNextCard({ title, description, slug, label, backgroundImage }: Props) {
  return (
    <Link
      href={`/guides/${slug}`}
      className="not-prose group relative block overflow-hidden no-underline"
      style={{
        backgroundColor: '#EFE6D0',
        border: '1px solid rgba(36,48,31,0.12)',
        borderRadius: 20,
        maxWidth: 640,
      }}
    >
      {backgroundImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImage}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0.85 }}
          />
          {/* Fade: opaque creme i venstre side (hvor teksten står) → billedet
              toner frem mod højre, så teksten forbliver læsbar. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, #EFE6D0 0%, rgba(239,230,208,0.94) 52%, rgba(239,230,208,0.55) 100%)',
            }}
          />
        </>
      )}
      <div className="relative" style={{ padding: 'clamp(24px, 4vw, 32px)' }}>
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
        Næste skridt
      </p>
      <h3
        style={{
          fontFamily: plex,
          fontWeight: 600,
          fontSize: 'clamp(24px, 5.4vw, 28px)',
          lineHeight: 1.12,
          letterSpacing: '-0.015em',
          color: '#24301F',
          margin: '8px 0 0',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: serif,
          fontWeight: 400,
          fontSize: 'clamp(16px, 2.6vw, 18px)',
          lineHeight: 1.55,
          color: 'rgba(36,48,31,0.78)',
          margin: '12px 0 0',
        }}
      >
        {description}
      </p>
      <div
        style={{
          marginTop: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: sans,
          fontSize: 14.5,
          fontWeight: 600,
          color: '#24301F',
          borderBottom: '1.5px solid rgba(36,48,31,0.40)',
          paddingBottom: 2,
          transition: 'border-color 0.15s ease',
        }}
        className="group-hover:!border-[rgba(36,48,31,0.75)]"
      >
        {label}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
      </div>
    </Link>
  )
}
