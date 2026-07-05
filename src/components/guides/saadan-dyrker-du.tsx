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
import { GuideEvidenceImage } from './bleed-blocks'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
// Videnskabelig guidefont — primær til titler/overskrifter (botanisk reference,
// ikke poetisk essay). Cormorant er nu kun brødtekst/sparsom accent.
const plex = 'var(--font-plex-condensed), sans-serif'

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
        // Bevisbilledet sendes IND i sektionen (efter første tekstblok) i stedet
        // for at ligge efter hele afsnittet — så fotoet føles som en del af
        // læsningen, ikke en pause bagefter.
        const rendered = renderSection(
          s,
          key,
          chapterCounter,
          factMacroImage,
          showBleed ? bleed : undefined,
        )
        // chapterCounter må kun øges når sektionen faktisk er en prose-
        // sektion. renderSection returnerer det nye chapter-tal sammen
        // med jsx'et så vi ikke dobbelt-tæller.
        chapterCounter = rendered.nextChapter
        const blockKey = `${key}-${i}`
        // Fortløbende teknikkort (kind 'guide') strammes til 12px — som de
        // øvrige kort-cluster — i stedet for den brede prosa-rytme (56/72px).
        // Tailwind v4 space-y sætter margin-BOTTOM på ikke-sidste barn, så vi
        // overskriver marginBottom på det kort der efterfølges af et teknikkort.
        const tightBottom = s.kind === 'guide' && body[i + 1]?.kind === 'guide'
        return (
          <div key={blockKey} style={tightBottom ? { marginBottom: 12 } : undefined}>
            {rendered.node}
          </div>
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
  bleed?: PotalotMacroOutput,
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
  const evidence = bleed ? (
    <GuideEvidenceImage
      imageSrc={bleed.src}
      alt={bleed.alt}
      {...evidenceShape(title)}
    />
  ) : undefined
  return {
    node: <ProseSection chapter={next} title={title} body={body} evidence={evidence} />,
    nextChapter: next,
  }
}

/**
 * Billedform + forskydning pr. hovedafsnit — bryder den lineære
 * fuldbredde-rytme (spec #5/#7/#8):
 *   Om sorten            → kvadratisk insert (forskudt højre)
 *   Sortsspecifikke det. → højt sidebillede, vækstform (forskudt venstre)
 *   Smag og anvendelse   → kompakt kvadratisk frugt-makro (forskudt højre)
 * Siderne veksler, så to på hinanden følgende billeder ikke lander ens.
 */
function evidenceShape(title: string): {
  variant: 'wide' | 'square' | 'tall'
  align: 'left' | 'right'
} {
  const t = title.toLowerCase()
  if (/^om sorten/.test(t)) return { variant: 'square', align: 'right' }
  if (/sortsspecifik/.test(t)) return { variant: 'tall', align: 'left' }
  if (/smag|anvendelse/.test(t)) return { variant: 'square', align: 'right' }
  return { variant: 'wide', align: 'right' }
}

/**
 * V3 prose-sektion.
 *
 *   - Kapitelnummer (Plex, dæmpet oliven) i venstre akse-kolonne
 *   - H2 (Plex) + brødtekst (Cormorant) i højre kolonne
 *   - evidence (valgfrit bevisbillede) indsættes INDE i brødteksten
 *     efter første tekstblok, så fotoet er en del af afsnittet.
 *
 * Sektioner adskilles af 72px (eller 56px på mobil) — den vertikale
 * rytme er låst i guides.md sektion 15.4.
 */
function ProseSection({
  chapter,
  title,
  body,
  evidence,
}: {
  chapter: number
  title: string
  body: string
  evidence?: React.ReactNode
}) {
  // Kapitel-greb: smal venstre akse-kolonne (nummer + hårfin lodret streg)
  // + titel/brødtekst til højre. Blød Potalot-oversættelse af reference —
  // oliven/sand, ikke sort-magasin. Kun hovedafsnit (prose) får dette;
  // fact/teknik/note/related er allerede ekskluderet fra nummereringen.
  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: 'clamp(30px, 8vw, 38px) 1fr',
        columnGap: 'clamp(14px, 3.5vw, 20px)',
      }}
    >
      {/* Venstre akse: sektionsnummer over en lodret oliven/sand-streg. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: plex,
            fontWeight: 600,
            fontSize: 'clamp(26px, 6vw, 31px)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: '#5A6A3C', // dæmpet oliven — struktur, ikke sort
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(chapter).padStart(2, '0')}
        </span>
        <span
          aria-hidden
          style={{
            flex: 1,
            width: 1,
            marginTop: 10,
            background: 'rgba(101,115,72,0.28)', // sand-oliven hårstreg
          }}
        />
      </div>

      {/* Højre: titel + brødtekst, flugter med akse-kolonnens højre kant. */}
      <div>
        <h2
          style={{
            fontFamily: plex,
            fontWeight: 600,
            fontSize: 'clamp(25px, 5vw, 30px)',
            lineHeight: 1.04,
            letterSpacing: '-0.015em',
            color: '#2D2A24',
            margin: '2px 0 14px',
          }}
        >
          {title}
        </h2>
        <ProseBody body={body} evidence={evidence} />
      </div>
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
function ProseBody({ body, evidence }: { body: string; evidence?: React.ReactNode }) {
  // Cormorant beholdt (artikel = Cormorant), men lettere visuel tyngde: mindre
  // skrift, strammere linjeafstand, kortere linjer. Overskrifterne bærer stadig
  // den store editorial-vægt — brødteksten skal læses, ikke råbe.
  const bodyStyle: React.CSSProperties = {
    fontFamily: serif,
    fontWeight: 400,
    fontSize: 'clamp(16px, 2.7vw, 17.5px)',
    lineHeight: 1.58,
    color: '#2D2A24',
    margin: 0,
    maxWidth: '62ch',
  }

  // Split body i paragraffer (blank linje mellem)
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  // Indsæt bevisbilledet EFTER første tekstblok (hvis der er mere end én),
  // ellers efter den eneste blok. Så fotoet ligger inde i afsnittet — spec
  // #5/#7: "tekstblok → foto → tekstblok fortsætter".
  const insertAfter = paragraphs.length > 1 ? 0 : paragraphs.length - 1

  return (
    <div className="space-y-5" style={bodyStyle}>
      {paragraphs.map((para, i) => {
        const lines = para.split('\n').map((l) => l.trim())
        const isBulletList = lines.every((l) => /^-\s+\S/.test(l))
        const block = isBulletList ? (
          <ul key={i} style={{ paddingLeft: '1.2em', margin: 0 }} className="list-disc space-y-2">
            {lines.map((l, j) => (
              <li key={j}>{renderInline(l.replace(/^-\s+/, ''))}</li>
            ))}
          </ul>
        ) : (
          <p key={i} style={{ margin: 0, whiteSpace: 'pre-line' }}>
            {renderInline(para)}
          </p>
        )
        if (evidence && i === insertAfter) {
          return (
            <Fragment key={`p-${i}`}>
              {block}
              {evidence}
            </Fragment>
          )
        }
        return block
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
