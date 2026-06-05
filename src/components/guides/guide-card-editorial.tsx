/**
 * GuideCardEditorial — V3 Fase 2 billed-dominant kort.
 *
 * "Mennesker ser billede → navn → interessant ting først."
 *
 * Layout:
 *   - Stort foto øverst (5:3 aspect, radius 24px) — bærer kortet
 *   - Navn under (Cormorant 28-32px) — dominant identitet
 *   - Latin (italic Cormorant 13px, opacity 0.5) — nedtonet i oversigt
 *   - Summary (Cormorant 16px, max 2 linjer) — invitation, ikke metadata
 *   - Pil til højre — "→ læs videre"
 *
 * Ingen card-baggrund, ingen border, ingen drop shadow.
 * Billedet ER kortet.
 *
 * Trust-badge fjernet for Potalot-guides — den gentages overflødigt
 * når 11 ud af 17 kort siger "Potalot-guide". Sektionen øverst
 * signalerer trust-niveauet ÉN gang.
 * Beholdt for 'egen' og 'ai-udkast' fordi de signalerer afvigelse.
 *
 * Spec-kilde: Docs/design-system/guides.md §15.12 + anti-pattern
 * "Hero-billeder på alle guidesider" (kortene må ikke blive en væg)
 * løses ved at billeder er kortets indhold, ikke dekoration.
 */

import Link from 'next/link'
import type { Guide } from '@/lib/types'
import { TrustBadge, type GuideKind } from './trust-badge'
import { ArrowRight } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  guide: Guide
  kind: GuideKind
  /** Tekst som "Baseret på Potalot-guiden om Tomat" — vises kun for egne afledte */
  lineageText?: string | null
  /** Vises diskret hvis sorten findes i brugerens frøbank */
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

  // Sortsguide → titel = sortsnavn, plantenavn bliver eyebrow over
  // Artsguide → titel = plantenavn, ingen eyebrow med navn
  const title = guide.variety ?? guide.plantName
  const subtitleName = guide.variety ? guide.plantName : null

  // Trust-badge vises KUN for afvigelser fra default (egen, ai-udkast).
  // Potalot er default — siden signalerer det én gang øverst.
  const showBadge = kind !== 'potalot'

  return (
    <Link
      href={`/guides/${guide.id}`}
      className="group block transition-transform duration-200 ease-out hover:-translate-y-0.5"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {hero && (
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 24,
            aspectRatio: '5 / 3',
            background: '#EAE6D8',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
          {iFroebank && (
            <span
              className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full"
              style={{
                fontFamily: sans,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                padding: '5px 10px',
                background: 'rgba(244,240,229,0.92)',
                color: '#7F8F6A', // Salvie
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              title="Sorten findes i din frøbank"
            >
              I din frøbank
            </span>
          )}
        </div>
      )}

      <div
        className="flex items-start gap-3"
        style={{ paddingInline: 4, paddingTop: 16 }}
      >
        <div className="flex-1 min-w-0">
          {/* Trust-badge KUN for afvigelser (Egen, AI) */}
          {showBadge && (
            <div style={{ marginBottom: 8 }}>
              <TrustBadge kind={kind} size="sm" />
            </div>
          )}

          {/* Plantenavn-eyebrow for sortsguider */}
          {subtitleName && (
            <p
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
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
              fontSize: isCompact ? 26 : 30,
              lineHeight: 1.0,
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
                fontSize: 13,
                fontWeight: 400,
                color: '#2D2A24',
                opacity: 0.5,
                margin: 0,
                marginTop: 3,
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
                marginTop: 8,
              }}
            >
              {lineageText}
            </p>
          )}

          {guide.summary && (
            <p
              style={{
                fontFamily: serif,
                fontSize: isCompact ? 15 : 16.5,
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#6A665C',
                margin: 0,
                marginTop: 12,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {guide.summary}
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
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid #D8D1BF',
              }}
            >
              Genereret automatisk. Gennemgå og tilpas efter dine forhold.
            </p>
          )}
        </div>

        {/* Pil — viser at kortet er et opslag */}
        <div
          className="shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          style={{
            marginTop: 6,
            color: '#7F8F6A',
          }}
        >
          <ArrowRight size={20} strokeWidth={1.75} />
        </div>
      </div>
    </Link>
  )
}
