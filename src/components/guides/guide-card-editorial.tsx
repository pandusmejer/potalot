/**
 * GuideCardEditorial — V3 Fase 2 editorial list-kort.
 *
 * "Et bog-opslag, ikke et app-grid."
 *
 * Layout:
 *   - Thumbnail venstre (88px square, 16px radius)
 *   - Tekst højre — Cormorant titel, Manrope meta, Cormorant body
 *   - Card #F4F0E5, border #D8D1BF, radius 24px, INGEN skygge
 *
 * Spec-kilde: Docs/design-system/guides.md §15.12 (Guidekort) +
 * §15.14 (Farver).
 *
 * Trust-badge står ALTID som eyebrow over titel — aldrig ved siden af.
 * Lineage vises som sekundær tekst, ikke som badge.
 */

import Link from 'next/link'
import type { Guide } from '@/lib/types'
import { TrustBadge, type GuideKind } from './trust-badge'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  guide: Guide
  kind: GuideKind
  /** Tekst som "Baseret på Potalot-guiden om Tomat" — vises kun for egne afledte */
  lineageText?: string | null
  /** Vises diskret i hjørnet hvis sorten findes i brugerens frøbank */
  iFroebank?: boolean
  /** AI-udkast får hjælpetekst under summary */
  aiHelpText?: boolean
  size?: 'standard' | 'compact'
}

export function GuideCardEditorial({
  guide,
  kind,
  lineageText,
  iFroebank = false,
  aiHelpText = false,
  size = 'standard',
}: Props) {
  const hero = guide.primaryImageId
  const isCompact = size === 'compact'

  // Sortsguide → titel = sortsnavn, plantenavn bliver eyebrow
  // Artsguide → titel = plantenavn, ingen eyebrow med navn
  const title = guide.variety ?? guide.plantName
  const subtitleName = guide.variety ? guide.plantName : null

  return (
    <Link
      href={`/guides/${guide.id}`}
      className="group block overflow-hidden transition-colors duration-200"
      style={{
        background: '#F4F0E5',
        border: '1px solid #D8D1BF',
        borderRadius: 24,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        className="flex gap-4"
        style={{ padding: isCompact ? 14 : 16 }}
      >
        {hero && (
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              width: isCompact ? 76 : 88,
              height: isCompact ? 76 : 88,
              borderRadius: 16,
              background: '#EAE6D8',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Trust-badge som eyebrow over titel */}
          <div className="mb-2">
            <TrustBadge kind={kind} size="sm" />
          </div>

          {/* Plantenavn-eyebrow for sortsguider — så San Marzano kender sit tomat-DNA */}
          {subtitleName && (
            <p
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#7F8F6A', // Salvie
                margin: 0,
                marginBottom: 4,
              }}
            >
              {subtitleName}
            </p>
          )}

          <h3
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: isCompact ? 22 : 24,
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              color: '#2D2A24',
              margin: 0,
            }}
          >
            {title}
          </h3>

          {guide.latinName && (
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontSize: 14,
                fontWeight: 400,
                color: '#2D2A24',
                opacity: 0.6,
                margin: 0,
                marginTop: 2,
              }}
            >
              {guide.latinName}
            </p>
          )}

          {lineageText && (
            <p
              style={{
                fontFamily: sans,
                fontStyle: 'italic',
                fontSize: 12,
                fontWeight: 400,
                color: '#6A665C',
                margin: 0,
                marginTop: 6,
              }}
            >
              {lineageText}
            </p>
          )}

          {guide.summary && (
            <p
              style={{
                fontFamily: serif,
                fontSize: isCompact ? 15 : 16,
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#6A665C',
                margin: 0,
                marginTop: 8,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {guide.summary}
            </p>
          )}

          {iFroebank && (
            <p
              style={{
                fontFamily: sans,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: '#7F8F6A', // Salvie
                margin: 0,
                marginTop: 10,
              }}
            >
              · I din frøbank
            </p>
          )}

          {aiHelpText && (
            <p
              style={{
                fontFamily: sans,
                fontSize: 11.5,
                fontWeight: 500,
                lineHeight: 1.4,
                color: '#6A665C',
                margin: 0,
                marginTop: 10,
                paddingTop: 8,
                borderTop: '1px solid #D8D1BF',
              }}
            >
              Genereret automatisk. Gennemgå og tilpas efter dine forhold.
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
