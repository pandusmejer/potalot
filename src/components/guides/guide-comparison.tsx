'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

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
}: {
  label?: string
  href?: string
  onClick?: () => void
}) {
  if (!label) return null

  const ctaClass = 'mx-auto mt-7 flex rounded-full px-[18px] py-2.5'
  const ctaStyle = {
    background: 'rgba(244,240,229,0.80)',
    border: '1px solid rgba(36,48,31,0.12)',
    color: ink,
    fontFamily: sans,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1,
    textDecoration: 'none',
  } as const

  if (href) {
    return (
      <Link href={href} className={ctaClass} style={ctaStyle}>
        {label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={ctaClass} style={ctaStyle}>
      {label}
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
}: GuideComparisonListProps) {
  return (
    <section
      className="mx-6 w-[calc(100vw-48px)] rounded-[28px] px-6 py-7"
      style={{
        background: paper,
        border: '1px solid rgba(36,48,31,0.10)',
        boxShadow: '0 12px 40px rgba(36,48,31,0.06)',
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] items-center gap-3">
        <h3
          className="m-0 text-left"
          style={{
            color: ink,
            fontFamily: serif,
            fontSize: 'clamp(28px, 8vw, 34px)',
            fontWeight: 500,
            letterSpacing: 0,
            lineHeight: 1,
          }}
        >
          {leftTitle}
        </h3>
        <VsBadge />
        <h3
          className="m-0 text-right"
          style={{
            color: ink,
            fontFamily: serif,
            fontSize: 'clamp(28px, 8vw, 34px)',
            fontWeight: 500,
            letterSpacing: 0,
            lineHeight: 1,
          }}
        >
          {rightTitle}
        </h3>
      </div>

      <div className="mt-7">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(0,1fr)_74px_minmax(0,1fr)] items-center gap-3 py-4 min-[390px]:grid-cols-[minmax(0,1fr)_92px_minmax(0,1fr)]"
            style={{ borderTop: `1px solid ${line}` }}
          >
            <p
              className="m-0 text-left"
              style={{
                color: 'rgba(36,48,31,0.74)',
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 650,
                lineHeight: 1.45,
              }}
            >
              {row.left}
            </p>
            <div className="flex min-w-0 flex-col items-center gap-1 text-center">
              {row.icon && (
                <span
                  aria-hidden
                  className="text-[rgba(127,143,106,0.72)] [&_svg]:h-4 [&_svg]:w-4"
                >
                  {row.icon}
                </span>
              )}
              <p
                className="m-0 uppercase"
                style={{
                  color: 'rgba(127,143,106,0.86)',
                  fontFamily: sans,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  lineHeight: 1.2,
                }}
              >
                {row.label}
              </p>
            </div>
            <p
              className="m-0 text-right"
              style={{
                color: 'rgba(36,48,31,0.74)',
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 650,
                lineHeight: 1.45,
              }}
            >
              {row.right}
            </p>
          </div>
        ))}
      </div>

      <ComparisonCta label={ctaLabel} href={ctaHref} onClick={onCtaClick} />
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
