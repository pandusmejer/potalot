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
import { StepPhoto } from './guide-step-photo'

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
  /**
   * "Potalot anbefaler"-note der indsættes MELLEM 3. og 4. kapitel (Anna-
   * placering). Rendres ikke længere som lukke-blok i bunden.
   */
  potalotNoteBody?: string
}

export function SaadanDyrkerDu({
  sections,
  factMacroImage,
  bleedAfter,
  potalotNoteBody,
}: Props) {
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
    <section className="space-y-[28px] sm:space-y-[36px]">
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
        const chapterBefore = chapterCounter
        chapterCounter = rendered.nextChapter
        // Potalot-noten indsættes lige EFTER 3. kapitel (mellem 03 og 04).
        const afterThirdChapter =
          !!potalotNoteBody && chapterBefore === 2 && rendered.nextChapter === 3
        const blockKey = `${key}-${i}`
        // Fortløbende teknikkort (kind 'guide') strammes til 12px — som de
        // øvrige kort-cluster — i stedet for den brede prosa-rytme (56/72px).
        // Tailwind v4 space-y sætter margin-BOTTOM på ikke-sidste barn, så vi
        // overskriver marginBottom på det kort der efterfølges af et teknikkort.
        const tightBottom = s.kind === 'guide' && body[i + 1]?.kind === 'guide'
        // Fact-kortet (fx "vækstformer") tuckes tæt på afsnittene omkring —
        // let op mod afsnittet over og lidt strammere ned. Justeret til den
        // halverede kapitel-rytme (28px base).
        const wrapperStyle: React.CSSProperties = {
          ...(tightBottom ? { marginBottom: 12 } : {}),
          ...(s.kind === 'fact' ? { marginTop: '-3mm', marginBottom: 20 } : {}),
        }
        return (
          <div
            key={blockKey}
            style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
          >
            {rendered.node}
            {afterThirdChapter && potalotNoteBody && (
              <div style={{ marginTop: 22 }}>
                <GuidePotalotNote body={potalotNoteBody} />
              </div>
            )}
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
      node: (
        <GuideFactCard
          title={s.title}
          variant={s.variant}
          columns={s.columns}
          intro={s.intro}
          conclusion={s.conclusion}
        />
      ),
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
  const shape = bleed ? evidenceShape(title) : undefined
  const evidence = bleed ? (
    <GuideEvidenceImage
      imageSrc={bleed.src}
      alt={bleed.alt}
      variant={shape!.variant}
      float={shape!.float}
    />
  ) : undefined
  return {
    node: (
      <ProseSection
        chapter={next}
        title={title}
        body={body}
        evidence={evidence}
        // float = ægte ombrydning (figuren først i flowet); ellers fuldbredde-
        // blok indsat mellem tekstblokke.
        evidenceFloated={!!shape?.float}
      />
    ),
    nextChapter: next,
  }
}

/**
 * Billedform pr. hovedafsnit — VARIERET redaktionel komposition:
 *   Om sorten            → kvadratisk, float højre (tekst ombrydes)
 *   Sortsspecifikke det. → højt vertikalt, float venstre (tekst ombrydes)
 *   Smag og anvendelse   → bredt horisontalt, fuldbredde-blok (tekst over+under)
 * Så nogle billeder har tekst omkring sig, andre har tekst over og under.
 */
function evidenceShape(title: string): {
  variant: 'wide' | 'square' | 'tall'
  float?: 'left' | 'right'
} {
  const t = title.toLowerCase()
  if (/^om sorten/.test(t)) return { variant: 'square', float: 'right' }
  if (/sortsspecifik/.test(t)) return { variant: 'tall', float: 'left' }
  if (/smag|anvendelse/.test(t)) return { variant: 'wide' }
  return { variant: 'wide' }
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
  evidenceFloated = false,
}: {
  chapter: number
  title: string
  body: string
  evidence?: React.ReactNode
  /** true = float (tekst ombrydes); false = fuldbredde-blok mellem tekstblokke. */
  evidenceFloated?: boolean
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

      {/* Højre: titel + brødtekst. Ekstra højre-padding så seriftekst får luft
          mod skærmkanten (venstre side har allerede aksen som margin). */}
      <div style={{ paddingRight: 'clamp(10px, 2.5vw, 14px)' }}>
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
        <ProseBody body={body} evidence={evidence} floated={evidenceFloated} />
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
function ProseBody({
  body,
  evidence,
  floated = false,
}: {
  body: string
  evidence?: React.ReactNode
  floated?: boolean
}) {
  // Cormorant beholdt (artikel = Cormorant), men lettere visuel tyngde: mindre
  // skrift, strammere linjeafstand, kortere linjer. Overskrifterne bærer stadig
  // den store editorial-vægt — brødteksten skal læses, ikke råbe.
  // Prosa-størrelse (Cormorant). Manrope-lister sættes 2 punktstørrelser mindre,
  // så de læser lettere/mere funktionelt end den løbende brødtekst.
  const proseFontSize = 'clamp(16px, 2.5vw, 17px)'
  const listFontSize = 'clamp(13px, 2vw, 14px)'
  const bodyStyle: React.CSSProperties = {
    fontFamily: serif,
    fontWeight: 400,
    // Roligere mobil-læsning: cap på 17px (16 på mobil), luftig linjeafstand,
    // VENSTRESTILLET (ikke justeret — hård justering gør stor seriftekst stiv
    // og presset på mobil). Orddeling beholdt så float-spalterne stadig pakker.
    fontSize: proseFontSize,
    lineHeight: 1.65,
    color: '#2D2A24',
    margin: 0,
    maxWidth: '60ch',
    hyphens: 'auto',
    WebkitHyphens: 'auto',
    textAlign: 'left',
  }

  // Split body i paragraffer (blank linje mellem)
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  const renderBlock = (para: string, i: number) => {
    const lines = para.split('\n').map((l) => l.trim())
    // Inline step-foto (teknikguider): et @foto-direktiv står som sit eget
    // "afsnit" mellem tekstblokke, så fotoet lander præcis dér forfatteren
    // vil have det i trinnet. Se guide-step-photo.tsx + editorial-rules.md.
    if (lines[0].startsWith('@foto')) {
      return <StepPhoto key={`foto-${i}`} raw={para} />
    }
    const isBulletList = lines.every((l) => /^-\s+\S/.test(l))
    if (isBulletList) {
      const items = lines.map((l) => l.replace(/^-\s+/, ''))
      // Definition-list: hvert punkt = "**Typenavn** – forklaring". Renderes
      // som dt/dd (typenavn som anker på egen linje, forklaring under), så
      // typer kan skimmes hurtigt. Teksten er UÆNDRET — kun opsætningen skifter
      // (den forbindende tankestreg erstattes af linjeskiftet).
      const defRe = /^\*\*(.+?)\*\*\s*[–—-]\s*(.+)$/
      const defs = items.map((t) => t.match(defRe))
      if (defs.every(Boolean)) {
        return (
          <dl key={i} style={{ margin: '16px 0 20px' }}>
            {defs.map((m, j) => (
              <div key={j} style={{ marginTop: j === 0 ? 0 : 14 }}>
                <dt
                  style={{
                    fontFamily: sans,
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    color: '#2D2A24',
                  }}
                >
                  {m![1]}
                </dt>
                <dd
                  style={{
                    fontFamily: sans,
                    fontSize: 13,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: 'rgba(45,42,36,0.72)',
                    margin: '2px 0 0',
                  }}
                >
                  {renderInline(m![2])}
                </dd>
              </div>
            ))}
          </dl>
        )
      }
      // Almindelig punktliste (ikke navn+forklaring): kompakt Manrope-stil med
      // små diskrete oliven-bullets — ikke arvet serif-prosa.
      return (
        <ul key={i} style={{ listStyle: 'none', padding: 0, margin: '16px 0 20px' }}>
          {lines.map((l, j) => (
            <li
              key={j}
              style={{
                display: 'flex',
                gap: 9,
                marginBottom: j === lines.length - 1 ? 0 : 12,
                fontFamily: sans,
                fontSize: listFontSize,
                lineHeight: 1.5,
                color: 'rgba(45,42,36,0.82)',
                textAlign: 'left',
              }}
            >
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  marginTop: '0.6em',
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background: 'rgba(123,143,99,0.9)',
                }}
              />
              <span>{renderInline(l.replace(/^-\s+/, ''))}</span>
            </li>
          ))}
        </ul>
      )
    }
    return (
      <p key={i} style={{ margin: 0, whiteSpace: 'pre-line' }}>
        {renderInline(para)}
      </p>
    )
  }

  // FLOAT: ægte tekst-ombrydning. Figuren står FØRST i flowet og flyder til en
  // side; brødteksten løber rundt om den. Ydre div = flow-root (BFC) så floaten
  // holdes inde i afsnittet og ikke løber ned i næste kapitel.
  if (floated && evidence) {
    return (
      <div style={{ ...bodyStyle, display: 'flow-root' }}>
        {evidence}
        <div className="space-y-5">{paragraphs.map(renderBlock)}</div>
      </div>
    )
  }

  // BLOK: bredt billede som fuldbredde-blok INDE i afsnittet — tekst over og
  // under. Indsættes efter første tekstblok (eller efter den eneste).
  const insertAfter = paragraphs.length > 1 ? 0 : paragraphs.length - 1
  return (
    <div className="space-y-5" style={bodyStyle}>
      {paragraphs.map((para, i) => {
        const block = renderBlock(para, i)
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
