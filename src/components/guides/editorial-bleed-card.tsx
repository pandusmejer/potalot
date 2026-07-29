'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'

export type EditorialBleedCardVariant = 'left' | 'right' | 'band'

export type EditorialBleedCardProps = {
  imageSrc: string
  imageAlt: string
  eyebrow?: string
  title: string
  description?: string
  ctaLabel?: string
  /**
   * Hvis sat: CTA bliver et <Link> der navigerer til href.
   * Praktisk i server-component-træer hvor function-props ikke kan
   * passes ned. Foretrukken til alle nye integrationer.
   */
  ctaHref?: string
  /**
   * Hvis sat OG ctaHref ikke er sat: CTA bliver en <button>.
   * Kun til client-component-brug (fx dialog-triggers).
   */
  onCtaClick?: () => void
  variant?: EditorialBleedCardVariant
  objectPosition?: string
  imageScale?: number
}

const page = '#EAE6D8'
const paper = '#F4F0E5'
const ink = '#24301F'
const bodyInk = '#2D2A24'
const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

type VariantConfig = {
  shell: string
  image: string
  content: string
  maskImage: string
  overlays: Array<{
    className: string
    background: string
  }>
}

const variants: Record<EditorialBleedCardVariant, VariantConfig> = {
  left: {
    shell: 'mx-6 min-h-[250px] w-[calc(100vw-48px)] rounded-[28px] px-6 py-7',
    image: 'left-0 top-0 h-full w-[68%] rounded-l-[28px]',
    content: 'ml-auto max-w-[44%] pt-1',
    maskImage:
      'linear-gradient(to right, black 0%, black 50%, rgba(0,0,0,0.68) 72%, transparent 100%)',
    overlays: [
      {
        className: 'right-0 inset-y-0 w-[58%]',
        background:
          'linear-gradient(to right, rgba(234,230,216,0) 0%, rgba(234,230,216,0.72) 45%, #F4F0E5 82%)',
      },
      {
        className: 'inset-x-0 bottom-0 h-[30%]',
        background:
          'linear-gradient(to top, #F4F0E5 0%, rgba(244,240,229,0.68) 34%, rgba(244,240,229,0) 100%)',
      },
    ],
  },
  right: {
    shell: 'mx-6 min-h-[250px] w-[calc(100vw-48px)] rounded-[28px] px-6 py-7',
    image: 'right-0 top-0 h-full w-[68%] rounded-r-[28px]',
    content: 'mr-auto max-w-[45%] pt-1',
    maskImage:
      'linear-gradient(to left, black 0%, black 50%, rgba(0,0,0,0.68) 72%, transparent 100%)',
    overlays: [
      {
        className: 'left-0 inset-y-0 w-[58%]',
        background:
          'linear-gradient(to left, rgba(234,230,216,0) 0%, rgba(234,230,216,0.72) 45%, #F4F0E5 82%)',
      },
      {
        className: 'inset-x-0 bottom-0 h-[30%]',
        background:
          'linear-gradient(to top, #F4F0E5 0%, rgba(244,240,229,0.68) 34%, rgba(244,240,229,0) 100%)',
      },
    ],
  },
  band: {
    shell: 'mx-0 min-h-[330px] w-screen rounded-none px-8 py-8',
    image: 'left-0 right-0 top-0 h-[72%] w-full',
    content: 'ml-0 max-w-[210px] pt-[210px]',
    maskImage:
      'linear-gradient(to bottom, black 0%, black 54%, rgba(0,0,0,0.64) 72%, transparent 100%)',
    overlays: [
      {
        className: 'inset-x-0 top-0 h-[24%]',
        background:
          'linear-gradient(to bottom, #EAE6D8 0%, rgba(234,230,216,0.58) 44%, rgba(234,230,216,0) 100%)',
      },
      {
        className: 'inset-x-0 bottom-0 h-[52%]',
        background:
          'linear-gradient(to top, #EAE6D8 0%, #F4F0E5 34%, rgba(244,240,229,0.76) 58%, rgba(244,240,229,0) 100%)',
      },
    ],
  },
}

export function EditorialBleedCard({
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  variant = 'left',
  objectPosition = '50% 50%',
  imageScale = 1,
}: EditorialBleedCardProps) {
  const config = variants[variant]
  const imageStyle: CSSProperties = {
    objectPosition,
    transform: `scale(${imageScale})`,
  }
  const maskStyle: CSSProperties = {
    maskImage: config.maskImage,
    WebkitMaskImage: config.maskImage,
  }

  return (
    <section
      className={`relative isolate overflow-hidden ${config.shell}`}
      style={{
        background: variant === 'band' ? page : paper,
        border: variant === 'band' ? '0' : '1px solid rgba(36,48,31,0.10)',
      }}
    >
      <div
        className={`absolute z-0 overflow-hidden ${config.image}`}
        style={maskStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async"
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover"
          style={imageStyle}
        />
      </div>

      {config.overlays.map((overlay) => (
        <span
          key={`${overlay.className}-${overlay.background}`}
          aria-hidden
          className={`pointer-events-none absolute z-10 ${overlay.className}`}
          style={{ background: overlay.background }}
        />
      ))}

      <div className={`relative z-20 ${config.content}`}>
        {eyebrow && (
          <p
            className="m-0 uppercase"
            style={{
              color: 'rgba(36,48,31,0.58)',
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              lineHeight: 1.3,
            }}
          >
            {eyebrow}
          </p>
        )}

        <h3
          className="m-0 mt-2"
          style={{
            color: ink,
            fontFamily: serif,
            fontSize: 'clamp(27px, 7.5vw, 36px)',
            fontWeight: 500,
            letterSpacing: 0,
            lineHeight: 1,
          }}
        >
          {title}
        </h3>

        {description && (
          <p
            className="mt-3 line-clamp-4"
            style={{
              color: bodyInk,
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.5,
              marginBottom: 0,
            }}
          >
            {description}
          </p>
        )}

        {/*
         * CTA-rendering pr. Annas regel:
         *   - ctaHref → <Link>     (server-component-venlig, foretrukken)
         *   - onCtaClick → <button> (client-only, til dialog-triggers)
         *   - hverken/eller → render INGENTING (ingen død knap som standard)
         */}
        {ctaLabel && ctaHref ? (
          <Link
            href={ctaHref}
            className="mt-5 inline-flex w-fit rounded-full px-4 py-2.5"
            style={{
              background: 'rgba(244,240,229,0.78)',
              border: '1px solid rgba(36,48,31,0.12)',
              color: bodyInk,
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
              textDecoration: 'none',
            }}
          >
            {ctaLabel}
          </Link>
        ) : ctaLabel && onCtaClick ? (
          <button
            type="button"
            onClick={onCtaClick}
            className="mt-5 rounded-full px-4 py-2.5"
            style={{
              background: 'rgba(244,240,229,0.78)',
              border: '1px solid rgba(36,48,31,0.12)',
              color: bodyInk,
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {ctaLabel}
          </button>
        ) : null}
      </div>
    </section>
  )
}
