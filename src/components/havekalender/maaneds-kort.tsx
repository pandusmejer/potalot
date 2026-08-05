'use client'

import { MONTHS_DA } from '@/lib/constants'
import { MAANEDS_STEMNING } from '@/lib/maaneds-stemning'
import { cn } from '@/lib/utils'

const sans = 'var(--font-manrope)'

const MAANED_SLUG = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
] as const

interface Props {
  /** 1–12 */
  month: number
  /** Kort fact-tekst i bundpanelet (fx "12 gøremål" eller "Uge 21"). */
  factPrimary?: string
  /** Sekundær fact, vises let dæmpet under den primære (valgfri). */
  factSecondary?: string
  /** Compact-variant til scroll-kontekst (~80% typografi). */
  compact?: boolean
}

const SIZES = {
  default: {
    titlePadding: 22,
    eyebrowSize: 13,
    titleSize: 46,
    taglineSize: 18,
    panelPaddingX: 22,
    panelPaddingY: 18,
    factPrimarySize: 17,
    factSecondarySize: 12,
  },
  compact: {
    titlePadding: 16,
    eyebrowSize: 11,
    titleSize: 34,
    taglineSize: 14,
    panelPaddingX: 16,
    panelPaddingY: 14,
    factPrimarySize: 14,
    factSecondarySize: 10,
  },
}

/**
 * Månedskort — kapitel-cover for den aktuelle måned i den horisontale
 * "Lige nu i haven"-scroll. Søsterkort til frøkort/plantekort, med
 * samme DNA (asset-drevet 4:5 portrait, varmt papirpanel, Manrope),
 * men hvor frø/plante er ID i inventaret er måneden et tids-anker:
 * stemning og rytme for hvor i året vi er.
 *
 * Genbruger de eksisterende hero-månedsfotos i /public/images/.
 */
export function MaanedsKort({ month, factPrimary, factSecondary, compact = false }: Props) {
  const sz = compact ? SIZES.compact : SIZES.default
  const navn = MONTHS_DA[month - 1]?.full ?? ''
  const slug = MAANED_SLUG[month - 1]
  const stemning = MAANEDS_STEMNING[month]
  const heroImage = `/images/heroes-maaneder/hero-${slug}-foto.webp`

  return (
    <div
      className={cn(
        'relative block aspect-[4/5] w-full overflow-hidden rounded-[32px]',
      )}
      style={{ boxShadow: '0 20px 44px rgba(26,34,22,0.18)' }}
    >
      {/* Foto — fylder kortet, translateY(-11%) som søsterkortene */}
      <div aria-hidden className="absolute inset-0" style={{ transform: 'translateY(-11%)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async"
          src={heroImage}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      {/* Læsbarheds-scrim — samme styrke som plantekort */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[52%]"
        style={{ background: 'linear-gradient(180deg, rgba(18,14,10,0.46) 0%, rgba(18,14,10,0.14) 60%, transparent 100%)' }}
      />

      {/* TOP-VENSTRE — eyebrow + månedsnavn + tagline */}
      <div className="absolute left-0 top-0 z-10 max-w-[88%]" style={{ padding: sz.titlePadding }}>
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: sz.eyebrowSize, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.90)', textShadow: '0 1px 4px rgba(20,14,8,0.45)' }}
        >
          I HAVEN
        </p>
        <h3
          className="mt-3"
          style={{ fontFamily: sans, fontSize: sz.titleSize, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.02em', color: '#FFFFFF', textShadow: '0 3px 16px rgba(20,14,8,0.45)', textTransform: 'capitalize' }}
        >
          {navn}
        </h3>
        {stemning && (
          <p
            className="mt-2"
            style={{ fontFamily: sans, fontSize: sz.taglineSize, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 8px rgba(20,14,8,0.42)' }}
          >
            {stemning.tagline}
          </p>
        )}
      </div>

      {/* BUND — varmt papir-panel, samme materiale som de andre kort.
          Indholdet er bevidst minimalt: månedskortet er kapitel-cover,
          ikke datablok. */}
      <div
        className="absolute inset-x-0 bottom-0 z-10"
        style={{
          background: 'rgba(245,242,234,0.94)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          borderTop: '1px solid rgba(36,48,31,0.05)',
          boxShadow: '0 -4px 14px rgba(36,48,31,0.04)',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: `${sz.panelPaddingY}px ${sz.panelPaddingX}px`,
        }}
      >
        <div className="flex flex-col">
          {factPrimary && (
            <p
              style={{
                fontFamily: sans,
                fontSize: sz.factPrimarySize,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: '#24301F',
                lineHeight: 1.1,
              }}
            >
              {factPrimary}
            </p>
          )}
          {factSecondary && (
            <p
              className="mt-1"
              style={{
                fontFamily: sans,
                fontSize: sz.factSecondarySize,
                fontWeight: 500,
                color: 'rgba(36,48,31,0.58)',
                lineHeight: 1.2,
              }}
            >
              {factSecondary}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
