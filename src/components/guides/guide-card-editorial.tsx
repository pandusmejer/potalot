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
import { cn } from '@/lib/utils'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'

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
  offset?: 'none' | 'left' | 'right'
}

export function GuideCardEditorial({
  guide,
  kind,
  lineageText,
  iFroebank = false,
  aiHelpText = false,
  size = 'standard',
  offset = 'none',
}: Props) {
  const isCompact = size === 'compact'
  const isVariety = guide.guideLevel === 'variety' || !!guide.variety
  // Artsguider får speciesHero (artsfoto); sortsguider får varietyHero (sortsfoto).
  // V4.1 §-2.F: arts-niveau må aldrig vise sortsspecifikke fotos.
  const { src: hero } = resolvePotalotImage({
    guideId: guide.id,
    speciesSlug: isVariety ? guide.parentGuideId : guide.id,
    varietySlug: isVariety ? guide.id : null,
    role: isVariety ? 'variety-hero' : 'species-hero',
    // Lader demo-guides (og brugerens egne guides) lande på korrekt
    // canonical billede når deres slug ikke matcher POTALOT_IMAGE_SETS.
    preferredSrc: guide.primaryImageId,
  })

  const title = guide.variety ?? guide.plantName
  const subtitleName = guide.variety ? guide.plantName : null

  const showBadge = kind !== 'potalot'

  return (
    <Link
      href={`/guides/${guide.id}`}
      className={cn(
        'group block transition-transform duration-200 ease-out hover:-translate-y-0.5',
        offset === 'right' && 'sm:translate-x-5',
        offset === 'left' && 'sm:-translate-x-4',
      )}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <article className={cn('relative', isVariety && 'pl-5')}>
        {hero && (
          <div
            className={cn(
              'relative overflow-hidden bg-[#EAE6D8]',
              isVariety ? 'ml-8 h-[190px] rounded-[22px]' : 'h-[255px] rounded-[28px]',
              isCompact && (isVariety ? 'h-[164px]' : 'h-[210px]'),
            )}
            style={{
              border: '1px solid rgba(45,42,36,0.08)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt=""
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]',
                isVariety ? 'scale-[1.08]' : 'scale-100',
              )}
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-24"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,14,8,0) 0%, rgba(20,14,8,0.28) 100%)',
              }}
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
                  color: '#7F8F6A',
                }}
                title="Sorten findes i din frøbank"
              >
                I din frøbank
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            'relative z-10 flex items-start gap-3',
            isVariety
              ? '-mt-12 mr-5 rounded-[22px] border px-4 pb-4 pt-4'
              : '-mt-8 ml-4 mr-3 rounded-[24px] border px-4 pb-4 pt-5',
          )}
          style={{
            background: 'rgba(244,240,229,0.96)',
            borderColor: 'rgba(45,42,36,0.09)',
          }}
        >
          <div className="flex-1 min-w-0">
          {showBadge && (
            <div style={{ marginBottom: 8 }}>
              <TrustBadge kind={kind} size="sm" />
            </div>
          )}

          {isVariety && (
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
              {subtitleName ?? guide.primaryCategoryId}
            </p>
          )}

          <h3
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: isCompact ? 25 : isVariety ? 31 : 36,
              lineHeight: 1.0,
              letterSpacing: 0,
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
              className="line-clamp-2"
              style={{
                fontFamily: isVariety ? sans : serif,
                fontSize: isCompact ? 14 : isVariety ? 14.5 : 16,
                fontWeight: isVariety ? 500 : 400,
                lineHeight: isVariety ? 1.45 : 1.48,
                color: '#6A665C',
                margin: 0,
                marginTop: isVariety ? 9 : 11,
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

          <div
            className="shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            style={{
              marginTop: 5,
              color: '#7F8F6A',
            }}
          >
            <ArrowRight size={18} strokeWidth={1.75} />
          </div>
        </div>
      </article>
    </Link>
  )
}

