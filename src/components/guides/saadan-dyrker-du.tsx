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

  // Tæl prose-sektioner for kapitelnummerering. Fact/guide/related/
  // potalot-note er "indstik" og får ikke nummer — som i en bog hvor
  // kapitler nummereres men sidebars ikke.
  let chapterCounter = 0

  return (
    <section className="space-y-[56px] sm:space-y-[72px]">
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
        chapterCounter++
        return (
          <ProseSection
            key={key}
            chapter={chapterCounter}
            title={s.title}
            body={s.body}
          />
        )
      })}
    </section>
  )
}

/**
 * V3 prose-sektion.
 *
 *   - Kapitelnummer (Manrope 12px, salvie-grøn, tracking 0.12em)
 *   - H2 (Cormorant 32px, weight 500, line-height 1.0)
 *   - 16px mellem H2 og tekst
 *   - Body via ProseBody (Cormorant 20px, line-height 1.75, max 70ch)
 *
 * Sektioner adskilles af 72px (eller 56px på mobil) — den vertikale
 * rytme er låst i guides.md sektion 15.4.
 */
function ProseSection({
  chapter,
  title,
  body,
}: {
  chapter: number
  title: string
  body: string
}) {
  return (
    <article>
      <p
        style={{
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#7F8F6A', // Salvie
          margin: 0,
          marginBottom: 8,
        }}
      >
        {String(chapter).padStart(2, '0')}
      </p>
      <h2
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(26px, 5vw, 32px)',
          lineHeight: 1.0,
          letterSpacing: '-0.01em',
          color: '#2D2A24',
          margin: 0,
          marginBottom: 16,
        }}
      >
        {title}
      </h2>
      <ProseBody body={body} />
    </article>
  )
}

/**
 * Render guide-body med minimal markdown:
 *   - Paragraffer (blank linje mellem)
 *   - Bullet-lister (- foran linje)
 *   - **bold** og *italic* inline
 *
 * Vi parser selv fordi vi vil holde kontrollen over typografi og
 * undgå en tung markdown-dep i V1. Hvis vi senere har brug for
 * links, kode-blokke eller H4 i body, så er det tid til react-markdown.
 */
function ProseBody({ body }: { body: string }) {
  // V3: Cormorant 20px, line-height 1.75, max 70ch.
  // "Cormorant. Ikke Manrope. Guides skal læses."
  const bodyStyle: React.CSSProperties = {
    fontFamily: serif,
    fontWeight: 400,
    fontSize: 'clamp(18px, 3vw, 20px)',
    lineHeight: 1.75,
    color: '#2D2A24',
    margin: 0,
    maxWidth: '70ch',
  }

  // Split body i paragraffer (blank linje mellem)
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <div className="space-y-6" style={bodyStyle}>
      {paragraphs.map((para, i) => {
        const lines = para.split('\n').map((l) => l.trim())
        const isBulletList = lines.every((l) => /^-\s+\S/.test(l))
        if (isBulletList) {
          return (
            <ul key={i} style={{ paddingLeft: '1.2em', margin: 0 }} className="list-disc space-y-2">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^-\s+/, ''))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} style={{ margin: 0, whiteSpace: 'pre-line' }}>
            {renderInline(para)}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Inline markdown: **bold** og *italic*.
 * Returnerer en flat array af strenge + <strong>/<em>-elementer.
 */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Match **bold** ELLER *italic* (men ikke ** mellem * og *).
  const re = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g
  let lastIdx = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index))
    const token = match[0]
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>)
    }
    lastIdx = match.index + token.length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts
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
