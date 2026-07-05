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
const plex = 'var(--font-plex-condensed), sans-serif'

// Card-specifikke, dyrkningsnære preview-summaries (fallback på guide.id).
// Holdes LOKALT i kortet, så den globale guide-data ikke ændres og
// "siver rundt" andre steder i appen. Ukendte guides falder tilbage på
// guide.summary.
const CARD_SUMMARIES: Record<string, string> = {
  agurk: 'Sås varmt, vokser hurtigt og skal bindes op tidligt.',
  tomat: 'Trives med varme, lys og jævn vanding gennem sæsonen.',
  chili: 'Forspires tidligt, plantes ud sent og høstes over lang tid.',
  dahlia: 'Forkultivér knolde, støt stænglerne og klip løbende blomster.',
  peberfrugt: 'Elsker varme og lys og modner langsomt fra grøn til fuld farve.',
}

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
  const cardSummary = CARD_SUMMARIES[guide.id] ?? guide.summary

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
              isVariety ? 'ml-8 h-[160px] rounded-[22px]' : 'h-[214px] rounded-[28px]',
              isCompact && (isVariety ? 'h-[138px]' : 'h-[178px]'),
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
            {/* Guide-type som lille diskret billed-chip (øverst venstre) — letter
                overlay-panelet. Kun typen (arts/sort); "Potalot" udelades her, da
                alle guider i sektionen er Potalot-guider. */}
            <span
              className="absolute left-3 top-3 inline-flex items-center rounded-full"
              style={{
                fontFamily: sans,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '5px 10px',
                background: 'rgba(244,240,229,0.92)',
                color: '#4E6138',
              }}
            >
              {isVariety ? 'Sortsguide' : 'Artsguide'}
            </span>
            {iFroebank && (
              <span
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full"
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
              ? '-mt-12 mr-5 rounded-[22px] border px-5 pb-5 pt-[9px]'
              : '-mt-12 ml-4 mr-4 rounded-[26px] border px-6 pb-5 pt-[13px]',
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

          {/* Metadata-linjen er flyttet op på billedet (type-chip) → overlayet
              rummer nu kun titel, latin, summary og pil = lettere tekstblok. */}
          <h3
            style={{
              fontFamily: plex,
              fontWeight: 600,
              // ~10% ned + strammere tracking, så lange sortnavne (fx
              // "Marketmore") lander pænt uden at dominere overlaypanelet.
              fontSize: isCompact ? 22 : isVariety ? 26 : 31,
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              color: '#242019',
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

          {cardSummary && (
            <p
              className="line-clamp-2"
              style={{
                fontFamily: sans,
                fontSize: isCompact ? 13.5 : 14.5,
                fontWeight: 500,
                lineHeight: 1.42,
                color: '#6A665C',
                margin: 0,
                marginTop: isVariety ? 9 : 10,
              }}
            >
              {cardSummary}
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

