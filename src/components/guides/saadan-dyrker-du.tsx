/**
 * "Sådan dyrker du" — den editorial læsetekst på en guide.
 *
 * Naturhåndbog-laget. Lange spalter, serif body-tekst, generøs leading.
 * Det er HER Guides bliver til en naturhåndbog og ikke et faktablad.
 *
 * Bygger på Guide.sections (key, title, body) — eksisterende datafelt.
 */

import type { GuideSection } from '@/lib/types'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  sections: GuideSection[]
}

export function SaadanDyrkerDu({ sections }: Props) {
  if (sections.length === 0) {
    return (
      <section className="space-y-3">
        <SektionEyebrow>Sådan dyrker du</SektionEyebrow>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontSize: 16,
            color: 'rgba(36,48,31,0.50)',
            margin: 0,
          }}
        >
          Denne guide har endnu ikke skrevet indhold.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <SektionEyebrow>Sådan dyrker du</SektionEyebrow>
      <div className="space-y-8 sm:space-y-9">
        {sections.map((s, i) => (
          <article key={s.key ?? i} className="space-y-3">
            <h3
              style={{
                fontFamily: serif,
                fontWeight: 500,
                fontSize: 'clamp(24px, 4.8vw, 30px)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: '#24301F',
                margin: 0,
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: 'clamp(16px, 2.6vw, 18.5px)',
                lineHeight: 1.65,
                color: 'rgba(36,48,31,0.82)',
                margin: 0,
                maxWidth: 640,
                whiteSpace: 'pre-line',
              }}
            >
              {s.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function SektionEyebrow({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </p>
  )
}
