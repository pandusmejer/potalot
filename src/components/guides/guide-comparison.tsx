'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

export type ComparisonRow = {
  label: string
  icon?: ReactNode
  left: string
  right: string
}

export type GuideComparisonListProps = {
  leftTitle: string
  rightTitle: string
  rows: ComparisonRow[]
  ctaLabel?: string
  /**
   * Hvis sat: CTA bliver et <Link> der navigerer til href.
   * Hvis ikke sat men onCtaClick er sat: CTA bliver en <button>.
   * Hvis ingen af delene: CTA skjules.
   */
  ctaHref?: string
  onCtaClick?: () => void
  /**
   * Hvis true: CTA rendres som ikke-klikbar placeholder med dæmpet
   * styling. Bruges når target-guide ikke eksisterer endnu — siden
   * skal stadig vise hvad sammenligningen lover, men brugeren skal
   * ikke kunne klikke til en 404.
   */
  ctaDisabled?: boolean
}

export type ComparisonItem = {
  title: string
  subtitle?: string
  imageSrc: string
  imageAlt: string
  description: string
}

export type GuideComparisonBadgeProps = {
  highlight?: string
  left: ComparisonItem
  right: ComparisonItem
  ctaLabel?: string
  onCtaClick?: () => void
}

const paper = '#F4F0E5'
const ink = '#24301F'
const muted = 'rgba(36,48,31,0.62)'
const line = 'rgba(36,48,31,0.14)'
const sage = '#7F8F6A'
const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

function ComparisonCta({
  label,
  href,
  onClick,
  disabled,
}: {
  label?: string
  href?: string
  onClick?: () => void
  disabled?: boolean
}) {
  if (!label) return null

  // Tekstlinje-CTA (ikke pill) — sparer højde, holder modulet kompakt.
  const ctaClass = 'group mt-4 inline-flex items-center gap-1.5'
  const ctaStyle = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    color: '#4E6138',
    fontFamily: sans,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1,
    textDecoration: 'none',
    cursor: 'pointer',
  } as const
  const arrow = (
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
  )

  // Disabled: ikke-interaktiv placeholder med dæmpet farve (target-guide findes
  // ikke endnu → ingen 404). Ingen pil, så det ikke ligner et aktivt link.
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="mt-4 inline-flex items-center gap-1.5"
        style={{ ...ctaStyle, color: 'rgba(36,48,31,0.42)', cursor: 'not-allowed' }}
        title="Guiden er endnu ikke skrevet"
      >
        {label}
      </span>
    )
  }

  if (href) {
    return (
      <Link href={href} className={ctaClass} style={ctaStyle}>
        {label}
        {arrow}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={ctaClass} style={ctaStyle}>
      {label}
      {arrow}
    </button>
  )
}

function VsBadge({ size = 36 }: { size?: 36 | 38 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: size === 38 ? 'rgba(127,143,106,0.18)' : 'rgba(127,143,106,0.22)',
        color: ink,
        fontFamily: sans,
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      VS.
    </span>
  )
}

export function GuideComparisonList({
  leftTitle,
  rightTitle,
  rows,
  ctaLabel,
  ctaHref,
  onCtaClick,
  ctaDisabled,
}: GuideComparisonListProps) {
  return (
    <section
      className="mx-6 w-[calc(100vw-48px)] rounded-[22px] px-5 py-5"
      style={{
        background: paper,
        border: '1px solid rgba(36,48,31,0.10)',
      }}
    >
      {/* Kompakt header: lille eyebrow + mindre serif-navne over hver kolonne,
          så det er tydeligt hvilken side der er hvilken sort. Ingen stor vs-badge. */}
      <p
        className="m-0 uppercase"
        style={{
          color: 'rgba(127,143,106,0.9)',
          fontFamily: sans,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.16em',
        }}
      >
        Sammenlign sorter
      </p>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <h3
          className="m-0"
          style={{
            color: ink,
            fontFamily: serif,
            fontSize: 'clamp(19px, 5vw, 22px)',
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {leftTitle}
        </h3>
        <h3
          className="m-0"
          style={{
            color: ink,
            fontFamily: serif,
            fontSize: 'clamp(19px, 5vw, 22px)',
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {rightTitle}
        </h3>
      </div>

      {/* Rækker: label som lille eyebrow OVER de to værdier — ingen midterkolonne,
          ingen ikoner. Tabelagtigt men roligt. */}
      <div className="mt-3.5">
        {rows.map((row) => (
          <div key={row.label} className="py-2.5" style={{ borderTop: `1px solid ${line}` }}>
            <p
              className="m-0 uppercase"
              style={{
                color: 'rgba(127,143,106,0.82)',
                fontFamily: sans,
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                lineHeight: 1.2,
              }}
            >
              {row.label}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <p
                className="m-0"
                style={{
                  color: 'rgba(36,48,31,0.74)',
                  fontFamily: sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {row.left}
              </p>
              <p
                className="m-0"
                style={{
                  color: 'rgba(36,48,31,0.74)',
                  fontFamily: sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {row.right}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ComparisonCta
        label={ctaLabel}
        href={ctaHref}
        onClick={onCtaClick}
        disabled={ctaDisabled}
      />
    </section>
  )
}

function ComparisonPortrait({ item }: { item: ComparisonItem }) {
  return (
    <article className="relative z-10 flex min-w-0 flex-col items-center text-center">
      <div className="h-[104px] w-[104px] overflow-hidden rounded-full min-[430px]:h-[124px] min-[430px]:w-[124px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageSrc} alt={item.imageAlt} className="h-full w-full object-cover" />
      </div>
      <h3
        className="m-0 mt-4"
        style={{
          color: ink,
          fontFamily: serif,
          fontSize: 'clamp(26px, 7vw, 32px)',
          fontWeight: 500,
          letterSpacing: 0,
          lineHeight: 1,
        }}
      >
        {item.title}
      </h3>
      {item.subtitle && (
        <p
          className="m-0 mt-2 uppercase"
          style={{
            color: 'rgba(36,48,31,0.60)',
            fontFamily: sans,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            lineHeight: 1.2,
          }}
        >
          {item.subtitle}
        </p>
      )}
      <p
        className="mt-4 line-clamp-3"
        style={{
          color: muted,
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 550,
          lineHeight: 1.45,
          marginBottom: 0,
        }}
      >
        {item.description}
      </p>
    </article>
  )
}

export function GuideComparisonBadge({
  highlight,
  left,
  right,
  ctaLabel,
  onCtaClick,
}: GuideComparisonBadgeProps) {
  return (
    <section
      className="relative mx-6 w-[calc(100vw-48px)] rounded-[28px] px-5 pb-6 pt-7"
      style={{
        background: paper,
        border: '1px solid rgba(36,48,31,0.10)',
        boxShadow: '0 12px 40px rgba(36,48,31,0.06)',
      }}
    >
      {highlight && (
        <div className="mb-5 flex justify-center">
          <span
            className="rounded-full px-3.5 py-[7px] uppercase"
            style={{
              background: sage,
              color: '#F4F0E5',
              fontFamily: sans,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.10em',
              lineHeight: 1,
            }}
          >
            {highlight}
          </span>
        </div>
      )}

      <span
        aria-hidden
        className="absolute left-1/2 top-[84px] h-[calc(100%-150px)] w-px -translate-x-1/2"
        style={{
          background:
            'repeating-linear-gradient(to bottom, rgba(36,48,31,0.20) 0 4px, transparent 4px 8px)',
        }}
      />
      <span className="absolute left-1/2 top-[154px] z-20 -translate-x-1/2">
        <VsBadge size={38} />
      </span>

      <div className="grid grid-cols-2 gap-5">
        <ComparisonPortrait item={left} />
        <ComparisonPortrait item={right} />
      </div>

      <ComparisonCta label={ctaLabel} onClick={onCtaClick} />
    </section>
  )
}
