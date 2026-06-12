/**
 * GuideTechniqueCard — inline teknik-link i en brødtekstpassage.
 *
 * Et lille redaktionelt kort. "TEKNIKGUIDE"-eyebrow + titel + kort
 * beskrivelse + pil. Det er meningen at det skal læses som et opslag
 * i en håndbog, ikke et navigations-listepunkt.
 *
 * Designdirektion (jf. user memory): flat creme-blok, ingen gradient,
 * Cormorant titel, Manrope brødtekst og eyebrow.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  slug: string
  title: string
  description: string
}

export function GuideTechniqueCard({ slug, title, description }: Props) {
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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
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
          <h4
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 'clamp(18px, 2.8vw, 21px)',
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
              color: '#24301F',
              margin: '6px 0 0',
            }}
          >
            {title}
          </h4>
          <p
            style={{
              fontFamily: sans,
              fontSize: 14,
              lineHeight: 1.55,
              color: 'rgba(36,48,31,0.72)',
              margin: '8px 0 0',
            }}
          >
            {description}
          </p>
        </div>
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            marginTop: 18,
            color: 'rgba(36,48,31,0.50)',
            transition: 'transform 0.15s ease, color 0.15s ease',
          }}
          className="group-hover:translate-x-0.5 group-hover:text-[rgba(36,48,31,0.85)]"
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}
