/**
 * GuideTechniqueCard — inline teknik-link i en brødtekstpassage.
 *
 * Bruges når en sektion naturligt nævner en teknik der har sin egen
 * guide (opbinding, knibning, forspiring). Visuelt: et lille inline
 * kort med tydelig "klik for at lære"-affordance — mindre end et
 * faktakort, så det ikke forstyrrer læsestrømmen.
 *
 * Designdirektion (jf. user memory): flat creme-blok, ingen gradient,
 * Cormorant titel, Manrope brødtekst.
 */

import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

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
        borderLeft: '3px solid rgba(36,48,31,0.40)',
        borderRadius: 14,
        padding: 'clamp(14px, 2.4vw, 18px) clamp(16px, 2.6vw, 20px)',
        maxWidth: 640,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        transition: 'background-color 0.15s ease',
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          marginTop: 2,
          color: 'rgba(36,48,31,0.55)',
        }}
      >
        <BookOpen className="h-4 w-4" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 'clamp(16px, 2.4vw, 18px)',
            lineHeight: 1.25,
            color: '#24301F',
            margin: 0,
          }}
        >
          {title}
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: sans,
            fontSize: 13.5,
            lineHeight: 1.5,
            color: 'rgba(36,48,31,0.70)',
            marginTop: 4,
          }}
        >
          {description}
        </span>
      </span>
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          marginTop: 6,
          color: 'rgba(36,48,31,0.45)',
          transition: 'transform 0.15s ease, color 0.15s ease',
        }}
        className="group-hover:translate-x-0.5 group-hover:text-[rgba(36,48,31,0.75)]"
      >
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}
