/**
 * "Sådan dyrker du" — den editorial læsetekst på en guide.
 *
 * Naturhåndbog-laget. Lange spalter, serif body-tekst, generøs leading.
 * Det er HER Guides bliver til en naturhåndbog og ikke et faktablad.
 *
 * Bygger på Guide.sections (key, title, body) — eksisterende datafelt.
 */

import type { GuideSection } from '@/lib/types'
import { GuideFactCard } from './guide-fact-card'
import { GuideTechniqueCard } from './guide-technique-card'
import { GuideRelatedList } from './guide-related-list'
import { GuidePotalotNote, isPotalotNoteSection } from './guide-potalot-note'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  sections: GuideSection[]
}

export function SaadanDyrkerDu({ sections }: Props) {
  // `:::next-guide` rendres ikke her — guide-detail-page rendrer den
  // som det allersidste blok på siden (efter sortsvarianter, noter osv).
  const body = sections.filter(s => s.kind !== 'next')

  if (body.length === 0) {
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
        {body.map((s, i) => {
          const key = s.key ?? `section-${i}`
          if (s.kind === 'fact') {
            return (
              <GuideFactCard
                key={key}
                title={s.title}
                variant={s.variant}
                columns={s.columns}
              />
            )
          }
          if (s.kind === 'guide') {
            return (
              <GuideTechniqueCard
                key={key}
                slug={s.slug}
                title={s.title}
                description={s.description}
              />
            )
          }
          if (s.kind === 'related') {
            return (
              <GuideRelatedList
                key={key}
                title={s.title}
                items={s.items}
              />
            )
          }
          // Prose-fald — men hvis titlen starter med "Potalot", render
          // som signatur-blok i stedet for almindelig sektion.
          if (isPotalotNoteSection(s.title)) {
            return <GuidePotalotNote key={key} body={s.body} />
          }
          return <ProseSection key={key} title={s.title} body={s.body} />
        })}
      </div>
    </section>
  )
}

function ProseSection({ title, body }: { title: string; body: string }) {
  return (
    <article className="space-y-3">
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
        {title}
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
        {body}
      </p>
    </article>
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
