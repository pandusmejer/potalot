/**
 * GuideTechniqueCard — inline teknik-link i en brødtekstpassage.
 *
 * Et lille redaktionelt kort. "TEKNIKGUIDE"-eyebrow + titel + kort
 * beskrivelse + pil, og et lille kvadratisk thumbnail i nederste højre
 * hjørne. Det er meningen at det skal læses som et opslag i en håndbog,
 * ikke et navigations-listepunkt.
 *
 * Designdirektion (jf. user memory): flat creme-blok, ingen gradient,
 * Cormorant titel, Manrope brødtekst og eyebrow.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const sans = 'var(--font-manrope)'
// Teknikkort bruger den videnskabelige guidefont (jf. typografi-reglen).
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * Thumbnail pr. teknik-slug. Bruger eksisterende plante-makroer der matcher
 * teknikken (knibning sker ved Y-leddet; opbinding handler om stænglen).
 * TODO: erstat med billed-resolver/kuraterede teknik-thumbs når de findes.
 */
const TECHNIQUE_THUMBS: Record<
  string,
  { src: string; objectPosition?: string; scale?: number }
> = {
  'knibning-af-tomater': { src: '/images/teknik/knibning-thumb.jpg' },
  // Opbindingspinden ligger til højre i fotoet → crop mod højre + lidt mere zoom.
  'opbinding-af-tomater': {
    src: '/images/teknik/opbinding-thumb.jpg',
    objectPosition: '100% center',
    scale: 1.15,
  },
}

interface Props {
  slug: string
  title: string
  description: string
  /** Kvadratisk thumbnail (nederste højre). Falder tilbage til slug-mappen. */
  thumbnail?: string
}

export function GuideTechniqueCard({ slug, title, description, thumbnail }: Props) {
  const thumb = thumbnail ? { src: thumbnail } : TECHNIQUE_THUMBS[slug]

  return (
    <Link
      href={`/guides/${slug}`}
      className="not-prose group block no-underline"
      style={{
        backgroundColor: '#F5F0E2',
        border: '1px solid rgba(36,48,31,0.10)',
        borderLeft: '3px solid rgba(36,48,31,0.45)',
        borderRadius: 16,
        padding: 'clamp(18px, 3vw, 24px) clamp(20px, 3.4vw, 28px)',
        maxWidth: 640,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <p
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.55)',
            margin: 0,
          }}
        >
          Teknikguide
        </p>
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            marginTop: 1,
            color: 'rgba(36,48,31,0.50)',
            transition: 'transform 0.15s ease, color 0.15s ease',
          }}
          className="group-hover:translate-x-0.5 group-hover:text-[rgba(36,48,31,0.85)]"
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>

      <h4
        style={{
          fontFamily: plex,
          fontWeight: 600,
          fontSize: 'clamp(17px, 2.7vw, 20px)',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          color: '#24301F',
          margin: '6px 0 0',
        }}
      >
        {title}
      </h4>

      {/* Beskrivelse (venstre) + kvadratisk thumbnail bundet til nederste højre. */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 8 }}>
        <p
          className="line-clamp-4"
          style={{
            flex: 1,
            minWidth: 0,
            alignSelf: 'flex-start',
            fontFamily: sans,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'rgba(36,48,31,0.72)',
            margin: 0,
          }}
        >
          {description}
        </p>
        {thumb && (
          <div
            style={{
              flexShrink: 0,
              width: '2cm',
              height: '2cm',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid rgba(36,48,31,0.10)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb.src}
              alt=""
              aria-hidden
              className="h-full w-full object-cover"
              style={{
                transform: `scale(${thumb.scale ?? 1.2})`,
                objectPosition: thumb.objectPosition,
              }}
            />
          </div>
        )}
      </div>
    </Link>
  )
}
