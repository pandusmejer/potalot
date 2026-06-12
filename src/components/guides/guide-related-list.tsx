/**
 * GuideRelatedList — container med flere beslægtede guides.
 *
 * Bruges typisk til sidst i en artsguide til at vise sortsguider, eller
 * fra en teknik-guide til at vise planter teknikken gælder for. Vises
 * som en vertikal stak af små klikbare kort.
 *
 * Spec'en siger: brug kun med 2+ items. Ét item alene hører hjemme som
 * `:::next-guide` eller `:::guide` — vi rendrer derfor ikke en
 * container med under 2 items.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { GuideRelatedItem } from '@/lib/types'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  title?: string
  items: GuideRelatedItem[]
}

export function GuideRelatedList({ title, items }: Props) {
  if (items.length < 2) return null

  return (
    <section className="not-prose space-y-3" style={{ maxWidth: 640 }}>
      {title && (
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
          {title}
        </p>
      )}
      <ul className="space-y-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li key={item.slug ?? i}>
            <Link
              href={`/guides/${item.slug}`}
              className="group flex items-start gap-3 no-underline"
              style={{
                backgroundColor: '#F2EBD9',
                border: '1px solid rgba(36,48,31,0.10)',
                borderRadius: 14,
                padding: 'clamp(14px, 2.4vw, 18px) clamp(16px, 2.6vw, 20px)',
                transition: 'background-color 0.15s ease',
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: serif,
                    fontWeight: 500,
                    fontSize: 'clamp(17px, 2.6vw, 19px)',
                    lineHeight: 1.2,
                    color: '#24301F',
                    margin: 0,
                  }}
                >
                  {item.heading}
                </span>
                {item.description && (
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
                    {item.description}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  marginTop: 4,
                  color: 'rgba(36,48,31,0.45)',
                  transition: 'transform 0.15s ease, color 0.15s ease',
                }}
                className="group-hover:translate-x-0.5 group-hover:text-[rgba(36,48,31,0.75)]"
              >
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
