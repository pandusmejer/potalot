'use client'

import type { CSSProperties } from 'react'

export type GuideHeroEditorialProps = {
  eyebrow?: string
  badge?: string
  category?: string
  title: string
  subtitle?: string
  latinName?: string
  tag?: string
  imageSrc: string
  imageAlt: string
  imageShape?: 'tall-left' | 'wide-bottom' | 'organic-left' | 'organic-center'
  imageObjectPosition?: string
  imageScale?: number
  description?: string
  actionLabel?: string
  onActionClick?: () => void
}

const page = '#EAE6D8'
const paper = '#F4F0E5'
const ink = '#24301F'
const bodyInk = '#2D2A24'
const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

type ShapeConfig = {
  frameClassName: string
  imageClassName: string
  maskImage: string
  overlays: Array<{
    className: string
    background: string
  }>
}

const shapeConfigs: Record<NonNullable<GuideHeroEditorialProps['imageShape']>, ShapeConfig> = {
  'tall-left': {
    frameClassName:
      'left-0 bottom-0 h-[430px] w-[68%] max-w-[290px] origin-bottom-left rounded-br-[46px] rounded-tr-[34px]',
    imageClassName: 'h-full w-full object-cover',
    maskImage:
      'radial-gradient(ellipse 84% 74% at 38% 55%, black 0%, black 56%, rgba(0,0,0,0.66) 72%, transparent 100%)',
    overlays: [
      {
        className: 'inset-x-0 bottom-0 h-[34%]',
        background:
          'linear-gradient(to top, #EAE6D8 0%, rgba(234,230,216,0.86) 18%, rgba(234,230,216,0) 70%)',
      },
      {
        className: 'right-0 inset-y-0 w-[38%]',
        background:
          'linear-gradient(to left, #EAE6D8 0%, rgba(234,230,216,0.72) 34%, rgba(234,230,216,0) 100%)',
      },
    ],
  },
  'wide-bottom': {
    frameClassName:
      'left-0 right-0 bottom-0 h-[310px] w-full rounded-tl-[38px] rounded-tr-[26px]',
    imageClassName: 'h-full w-full object-cover',
    maskImage:
      'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.82) 16%, black 42%, rgba(0,0,0,0.82) 78%, transparent 100%)',
    overlays: [
      {
        className: 'inset-x-0 top-0 h-[42%]',
        background:
          'linear-gradient(to bottom, #EAE6D8 0%, rgba(234,230,216,0.82) 22%, rgba(234,230,216,0) 100%)',
      },
      {
        className: 'inset-x-0 bottom-0 h-[34%]',
        background:
          'linear-gradient(to top, #EAE6D8 0%, rgba(234,230,216,0.78) 28%, rgba(234,230,216,0) 100%)',
      },
    ],
  },
  'organic-left': {
    frameClassName:
      'left-[-10px] bottom-2 h-[390px] w-[74%] max-w-[310px] rounded-br-[58px] rounded-tr-[46px]',
    imageClassName: 'h-full w-full object-cover',
    maskImage:
      'radial-gradient(ellipse 78% 72% at 38% 56%, black 0%, black 50%, rgba(0,0,0,0.64) 70%, transparent 100%)',
    overlays: [
      {
        className: 'right-0 inset-y-0 w-[42%]',
        background:
          'linear-gradient(to left, #EAE6D8 0%, rgba(234,230,216,0.74) 36%, rgba(234,230,216,0) 100%)',
      },
      {
        className: 'inset-x-0 bottom-0 h-[32%]',
        background:
          'linear-gradient(to top, #EAE6D8 0%, rgba(234,230,216,0.80) 24%, rgba(234,230,216,0) 100%)',
      },
    ],
  },
  'organic-center': {
    frameClassName:
      'left-1/2 bottom-4 h-[360px] w-[78%] max-w-[330px] -translate-x-1/2 rounded-[52px]',
    imageClassName: 'h-full w-full object-cover',
    maskImage:
      'radial-gradient(ellipse 70% 70% at center, black 0%, black 54%, rgba(0,0,0,0.60) 72%, transparent 100%)',
    overlays: [
      {
        className: 'inset-x-0 bottom-0 h-[34%]',
        background:
          'linear-gradient(to top, #EAE6D8 0%, rgba(234,230,216,0.80) 24%, rgba(234,230,216,0) 100%)',
      },
      {
        className: 'inset-y-0 left-0 w-[22%]',
        background:
          'linear-gradient(to right, #EAE6D8 0%, rgba(234,230,216,0.56) 34%, rgba(234,230,216,0) 100%)',
      },
      {
        className: 'inset-y-0 right-0 w-[28%]',
        background:
          'linear-gradient(to left, #EAE6D8 0%, rgba(234,230,216,0.64) 36%, rgba(234,230,216,0) 100%)',
      },
    ],
  },
}

export function GuideHeroEditorial({
  eyebrow = 'Sådan dyrker du',
  badge,
  category,
  title,
  subtitle,
  latinName,
  tag,
  imageSrc,
  imageAlt,
  imageShape = 'tall-left',
  imageObjectPosition = '50% 50%',
  imageScale = 1,
  description,
  actionLabel = 'Hurtigt overblik',
  onActionClick,
}: GuideHeroEditorialProps) {
  const shape = shapeConfigs[imageShape]
  const imageStyle: CSSProperties = {
    objectPosition: imageObjectPosition,
    transform: `scale(${imageScale})`,
  }
  const maskStyle: CSSProperties = {
    maskImage: shape.maskImage,
    WebkitMaskImage: shape.maskImage,
  }

  return (
    <section
      className="relative isolate min-h-[520px] overflow-x-clip px-6 pb-8 pt-8"
      style={{ background: page }}
    >
      <div
        className={`absolute z-0 overflow-hidden ${shape.frameClassName}`}
        style={maskStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className={shape.imageClassName}
          style={imageStyle}
        />
      </div>

      {shape.overlays.map((overlay) => (
        <span
          key={`${overlay.className}-${overlay.background}`}
          aria-hidden
          className={`pointer-events-none absolute z-10 ${overlay.className}`}
          style={{ background: overlay.background }}
        />
      ))}

      <div className="relative z-30 max-w-[70%]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {badge && (
            <span
              className="rounded-full px-3 py-1.5"
              style={{
                background: 'rgba(244,240,229,0.82)',
                border: '1px solid rgba(45,42,36,0.10)',
                color: 'rgba(36,48,31,0.70)',
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {badge}
            </span>
          )}
          {category && (
            <span
              className="uppercase"
              style={{
                color: 'rgba(36,48,31,0.52)',
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.22em',
                lineHeight: 1,
              }}
            >
              {category}
            </span>
          )}
        </div>

        <p
          className="m-0"
          style={{
            color: 'rgba(36,48,31,0.62)',
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            lineHeight: 1.3,
          }}
        >
          {eyebrow}
        </p>

        <h1
          className="m-0 mt-2"
          style={{
            color: ink,
            fontFamily: serif,
            fontSize: 'clamp(44px, 13vw, 72px)',
            fontWeight: 500,
            letterSpacing: 0,
            lineHeight: 0.92,
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="m-0 mt-1"
            style={{
              color: ink,
              fontFamily: serif,
              fontSize: 'clamp(34px, 9vw, 52px)',
              fontWeight: 500,
              letterSpacing: 0,
              lineHeight: 0.95,
            }}
          >
            {subtitle}
          </p>
        )}

        {latinName && (
          <p
            className="m-0 mt-1"
            style={{
              color: 'rgba(36,48,31,0.65)',
              fontFamily: serif,
              fontSize: 20,
              fontStyle: 'italic',
              lineHeight: 1.15,
            }}
          >
            {latinName}
          </p>
        )}

        {tag && (
          <span
            className="mt-4 inline-flex rounded-full px-3 py-[7px]"
            style={{
              background: paper,
              border: '1px solid rgba(45,42,36,0.10)',
              color: 'rgba(45,42,36,0.78)',
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {tag}
          </span>
        )}
      </div>

      {description && (
        <p
          className="absolute right-6 top-[310px] z-30 m-0 max-w-[176px] sm:top-[270px]"
          style={{
            color: bodyInk,
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.45,
          }}
        >
          {description}
        </p>
      )}

      <button
        type="button"
        onClick={onActionClick}
        className="absolute bottom-10 right-6 z-30 rounded-full px-4 py-2.5"
        style={{
          background: paper,
          border: '1px solid rgba(45,42,36,0.10)',
          color: bodyInk,
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {actionLabel}
      </button>
    </section>
  )
}
