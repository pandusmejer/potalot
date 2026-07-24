/**
 * TechniqueArticle — detaljeside for en teknikguide (guideLevel: 'technique').
 *
 * Teknikguider signalerer HANDLING, ikke planteidentitet:
 *   - INGEN fotohero → en tonet farveblok med eyebrow "TEKNIKGUIDE" + titel
 *   - trin-nummererede sektioner (01/02…) — genbruger SaadanDyrkerDu's
 *     ProseSection-nummerering, så typografien matcher resten af guide-familien
 *   - ingen quickFacts / kalender / frøbank-CTA / sortsvarianter (plante-ting)
 *
 * Design: guides.md §12 (hero-system) + mockup 03-teknikguide-mockup-knibning.
 * Kaldes fra GuideArticle når effective.guideLevel === 'technique'.
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Guide } from '@/lib/types'
import { SaadanDyrkerDu } from './saadan-dyrker-du'
import { GuideNextCard } from './guide-next-card'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

export function TechniqueArticle({
  guide,
  allGuides,
  safeReturnTo,
}: {
  guide: Guide
  allGuides: Guide[]
  safeReturnTo: string
}) {
  const title = guide.title ?? guide.plantName
  const next = guide.sections.find((s) => s.kind === 'next')
  // "Gælder"-linje: løs appliesTo-slugs op til plantenavne, dedupliker (art +
  // dens sorter har samme plantName → vis "Tomat" én gang, ikke ni).
  const appliesNames = [
    ...new Set(
      (guide.appliesTo ?? [])
        .map((slug) => allGuides.find((g) => g.id === slug)?.plantName)
        .filter((n): n is string => !!n),
    ),
  ]

  return (
    <article className="max-w-3xl space-y-6 overflow-x-clip pb-6">
      <header className="space-y-4">
        <div className="flex items-center">
          <Link
            href={safeReturnTo}
            aria-label="Tilbage"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(45,42,36,0.12)] bg-[rgba(255,255,255,0.45)] text-[#2D2A24] transition-colors hover:bg-[rgba(45,42,36,0.06)] active:scale-[0.97]"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
          </Link>
        </div>

        {/* Farveblok-hero — tonet sand/oliven i stedet for foto. Signalerer
            handling, ikke planteidentitet. */}
        <div
          style={{
            background:
              'linear-gradient(160deg, #EBEEE0 0%, #E3E8D5 100%)',
            border: '1px solid rgba(90,106,60,0.16)',
            borderRadius: 28,
            padding: '26px 24px 30px',
          }}
        >
          <span
            className="inline-flex uppercase"
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#4E6138',
              background: 'rgba(90,106,60,0.14)',
              padding: '4px 11px',
              borderRadius: 999,
            }}
          >
            Teknikguide
          </span>
          <h1
            style={{
              fontFamily: plex,
              fontWeight: 600,
              fontSize: 'clamp(30px, 7.5vw, 44px)',
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              color: '#2D2A24',
              margin: '16px 0 0',
              textWrap: 'balance',
            }}
          >
            {title}
          </h1>
          {guide.summary && (
            <p
              style={{
                fontFamily: sans,
                fontSize: 14.5,
                fontWeight: 500,
                lineHeight: 1.5,
                color: 'rgba(45,42,36,0.70)',
                margin: '12px 0 0',
                maxWidth: '46ch',
              }}
            >
              {guide.summary}
            </p>
          )}
          {appliesNames.length > 0 && (
            <p
              style={{
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: '#5A6A3C',
                margin: '14px 0 0',
              }}
            >
              Gælder {appliesNames.join(' · ').toLowerCase()}
            </p>
          )}
        </div>
      </header>

      {/* Trin — genbruger den låste prose-nummerering (01/02 + oliven-akse).
          SaadanDyrkerDu filtrerer selv next-guide + potalot-note fra og
          renderer potalot-note inline hvor den står. */}
      <SaadanDyrkerDu sections={guide.sections} />

      {next && next.kind === 'next' && (
        <GuideNextCard
          title={next.title}
          description={next.description}
          slug={next.slug}
          label={next.label}
        />
      )}
    </article>
  )
}
