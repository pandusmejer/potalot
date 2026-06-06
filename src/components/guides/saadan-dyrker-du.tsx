/**
 * "Sådan dyrker du" — den editorial læsetekst på en guide.
 *
 * Naturhåndbog-laget. Lange spalter, serif body-tekst, generøs leading.
 * Det er HER Guides bliver til en naturhåndbog og ikke et faktablad.
 *
 * Bygger på Guide.sections (key, title, body) — eksisterende datafelt.
 */

import { Fragment } from 'react'
import type { GuideSection } from '@/lib/types'
import type { PotalotMacroOutput } from '@/lib/images/types'
import { GuideFactCard } from './guide-fact-card'
import { GuideTechniqueCard } from './guide-technique-card'
import { GuideRelatedList } from './guide-related-list'
import { GuidePotalotNote, isPotalotNoteSection } from './guide-potalot-note'
import { BleedFromLeft, BleedFromRight, BleedBand } from './bleed-blocks'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  sections: GuideSection[]
  /**
   * Atmosfærisk makro-billede (V4 Lag 2) bag fact-blokke.
   * Vælges på guide-detail-page via resolvePotalotMacro(); kan være null
   * for guides der ikke har makro-entries endnu — fact-blokken renderer
   * så uden makro-baggrund (ingen hardcoded fallback).
   */
  factMacroImage?: PotalotMacroOutput | null
  /**
   * Bleed-blokke pr. sektion. Indekseret efter sektion-key. Hver bleed
   * vises EFTER den givne sektion. Maks 3 bleeds pr. guide håndhæves i
   * page-laget (guides/[id]/page.tsx). Komponent-valget (Left/Right/Band)
   * træffes her baseret på makroens rolle.
   */
  bleedAfter?: Record<string, PotalotMacroOutput | undefined>
}

export function SaadanDyrkerDu({ sections, factMacroImage, bleedAfter }: Props) {
  // V4.2 audit: vi udelukker BÅDE next-guide OG Potalot-note fra body —
  // begge rendres explicit på page-niveau (Potalot-note som lukke-blok
  // næstsidst, next-guide som CTA allersidst). Det forhindrer "Anna
  // taler"-cluster i bunden af prose-strømmen.
  const body = sections.filter(
    s => s.kind !== 'next' && !('title' in s && s.title && isPotalotNoteSection(s.title)),
  )

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

  // Spor allerede-renderede bleed-keys så samme bleed ikke vises
  // to gange. Forsikrer mod data-tilfælde hvor to sektioner deler
  // samme key (fx imported guide med dubletter).
  const renderedBleedKeys = new Set<string>()

  return (
    <section className="space-y-[56px] sm:space-y-[72px]">
      {body.map((s, i) => {
        const key = s.key ?? `section-${i}`
        const bleed = bleedAfter?.[key]
        const showBleed = !!bleed && !renderedBleedKeys.has(key)
        if (showBleed) renderedBleedKeys.add(key)
        const rendered = renderSection(s, key, chapterCounter, factMacroImage)
        // chapterCounter må kun øges når sektionen faktisk er en prose-
        // sektion. renderSection returnerer det nye chapter-tal sammen
        // med jsx'et så vi ikke dobbelt-tæller.
        chapterCounter = rendered.nextChapter
        // React kræver unik key for hvert Fragment-barn — dubletter
        // i sektion.key får tilføjet indeks-suffix.
        const fragmentKey = `${key}-${i}`
        return (
          <Fragment key={fragmentKey}>
            {rendered.node}
            {showBleed && bleed && <BleedSlot image={bleed} />}
          </Fragment>
        )
      })}
    </section>
  )
}

/**
 * Renderer én sektion + returnerer det opdaterede kapitelnummer.
 * Faktatekst, teknik-guide, related list, potalot-note bliver IKKE
 * tællet som kapitler — kun ProseSection øger nummereringen.
 */
function renderSection(
  s: GuideSection,
  key: string,
  chapterCounter: number,
  factMacroImage: PotalotMacroOutput | null | undefined,
): { node: React.ReactNode; nextChapter: number } {
  if (s.kind === 'fact') {
    // V4.2: fact-cardet står RENT — ingen AtmosphericImageLayer bag det.
    // Med bleed-blokke integreret andre steder på siden gav makro-bg på
    // fact-cards visuel overload (Guide Experience Audit V1, pkt 1C).
    // factMacroImage-prop beholdes som no-op for bagudkompatibilitet
    // indtil page-laget også slettes — fjernes ved Commit 4D.
    return {
      node: <GuideFactCard title={s.title} variant={s.variant} columns={s.columns} />,
      nextChapter: chapterCounter,
    }
  }
  if (s.kind === 'guide') {
    return {
      node: <GuideTechniqueCard slug={s.slug} title={s.title} description={s.description} />,
      nextChapter: chapterCounter,
    }
  }
  if (s.kind === 'related') {
    return {
      node: <GuideRelatedList title={s.title} items={s.items} />,
      nextChapter: chapterCounter,
    }
  }
  // Tilbage: prose-section (efter at fact/guide/related/next er
  // håndteret tidligere). GuideProseSection har title + body som
  // required, men TypeScript kan ikke narrowe os til prose-kind her
  // — vi henter felter med fallback for at undgå type-fejl uden at
  // ændre semantikken.
  const title = 'title' in s ? s.title ?? '' : ''
  const body = 'body' in s ? s.body ?? '' : ''
  if (isPotalotNoteSection(title)) {
    return { node: <GuidePotalotNote body={body} />, nextChapter: chapterCounter }
  }
  const next = chapterCounter + 1
  return {
    node: <ProseSection chapter={next} title={title} body={body} />,
    nextChapter: next,
  }
}

/**
 * Vælger Bleed-komponent baseret på makroens rolle.
 *
 *   leaf, structure       → BleedFromLeft  (blade, stængler, vækst-
 *                                          punkter, rodhals, struktur)
 *   fruit, flower         → BleedFromRight (frugter, blomster, høst,
 *                                          modne afgrøder)
 *   atmosphere, detail,   → BleedBand      (sanseligt, kronblade,
 *   seed                                   klaser, frøstande,
 *                                          atmosfæriske makroer)
 *
 * Tekstløs som udgangspunkt (Annas regel: label/description bruges
 * kun til Vidste du? / Potalot-tip / kort observation).
 */
function BleedSlot({ image }: { image: PotalotMacroOutput }) {
  if (image.role === 'leaf' || image.role === 'structure') {
    return <BleedFromLeft imageSrc={image.src} alt={image.alt} />
  }
  if (image.role === 'fruit' || image.role === 'flower') {
    return <BleedFromRight imageSrc={image.src} alt={image.alt} />
  }
  return <BleedBand imageSrc={image.src} alt={image.alt} />
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
