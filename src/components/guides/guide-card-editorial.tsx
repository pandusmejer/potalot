/**
 * GuideCardEditorial — naturhåndbog-stilen til guide-kort.
 *
 * Ét trust-badge pr. kort, aldrig kombinationer. Lineage vises som
 * sekundær tekst, ikke som badge.
 *
 * To størrelser:
 *   - 'standard' (default) — Potalot-guides, Egne guides
 *   - 'compact' — AI-udkast får lidt mindre vægt
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

  return (
    <Link
      href={`/guides/${guide.id}`}
      className="group block overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5"
      style={{
        borderRadius: 22,
        background: 'var(--card)',
        border: '1px solid rgba(36,48,31,0.08)',
        boxShadow: '0 6px 20px rgba(26,34,22,0.06)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div className="flex">
        {hero && (
          <div
            className="relative shrink-0"
            style={{ width: isCompact ? 96 : 128 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt=""
              className="h-full w-full object-cover"
              style={{ aspectRatio: '3 / 4' }}
            />
            {iFroebank && (
              <span
                className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full"
                style={{
                  fontFamily: sans,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.92)',
                  color: '#3D5A26',
                  border: '1px solid rgba(123,148,96,0.30)',
                  textShadow: 'none',
                }}
                title="Sorten findes i din frøbank"
              >
                I din frøbank
              </span>
            )}
          </div>
        )}

        <div
          className="flex-1 min-w-0 space-y-2"
          style={{ padding: isCompact ? '12px 14px' : '16px 18px' }}
        >
          {/* Trust-badge som eyebrow over titel — aldrig ved siden af.
              Tidligere stod den justify-between med titel og kolliderede
              visuelt med lange plantenavne på smalle kort. */}
          <TrustBadge kind={kind} size="sm" />
          <div className="min-w-0">
            <h3
              style={{
                fontFamily: serif,
                fontWeight: 500,
                fontSize: isCompact ? 22 : 26,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: '#24301F',
                margin: 0,
              }}
            >
              {guide.plantName}
            </h3>
            {guide.variety && (
              <p
                style={{
                  fontFamily: sans,
                  fontSize: isCompact ? 13 : 14,
                  fontWeight: 500,
                  color: 'rgba(36,48,31,0.55)',
                  margin: 0,
                  marginTop: 2,
                }}
              >
                {guide.variety}
              </p>
            )}
          </div>

          {lineageText && (
            <p
              style={{
                fontFamily: sans,
                fontStyle: 'italic',
                fontSize: 12,
                fontWeight: 400,
                color: 'rgba(36,48,31,0.55)',
                margin: 0,
              }}
            >
              {lineageText}
            </p>
          )}

          {guide.summary && (
            <p
              style={{
                fontFamily: sans,
                fontSize: isCompact ? 12.5 : 13.5,
                fontWeight: 400,
                lineHeight: 1.45,
                color: 'rgba(36,48,31,0.72)',
                margin: 0,
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
                color: 'rgba(90,79,115,0.78)',
                margin: 0,
                paddingTop: 4,
                borderTop: '1px solid rgba(180,165,200,0.30)',
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
