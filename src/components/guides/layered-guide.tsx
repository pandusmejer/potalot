import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'
const page = '#EAE6D8'
const paper = '#F4F0E5'

type FocalPoint = 'center' | 'top' | 'right' | 'bottom' | 'left'
type FadeDirection = 'all' | 'left' | 'right' | 'top' | 'bottom' | 'band'

export interface AtmosphericImageLayerProps {
  src: string
  alt?: string
  className?: string
  focal?: FocalPoint
  fade?: FadeDirection
  opacity?: number
  blur?: number
  rotate?: number
  scale?: number
  zIndex?: number
}

const focalPosition: Record<FocalPoint, string> = {
  center: 'center center',
  top: 'center top',
  right: 'right center',
  bottom: 'center bottom',
  left: 'left center',
}

const masks: Record<FadeDirection, string> = {
  all: 'radial-gradient(ellipse 76% 70% at 50% 50%, black 20%, rgba(0,0,0,0.82) 48%, transparent 86%)',
  left: 'radial-gradient(ellipse 74% 78% at 34% 50%, black 18%, rgba(0,0,0,0.84) 48%, transparent 86%)',
  right: 'radial-gradient(ellipse 74% 78% at 66% 50%, black 18%, rgba(0,0,0,0.84) 48%, transparent 86%)',
  top: 'radial-gradient(ellipse 84% 70% at 50% 34%, black 18%, rgba(0,0,0,0.82) 48%, transparent 86%)',
  bottom: 'radial-gradient(ellipse 84% 70% at 50% 66%, black 18%, rgba(0,0,0,0.82) 48%, transparent 86%)',
  band: 'radial-gradient(ellipse 92% 58% at 50% 42%, black 18%, rgba(0,0,0,0.76) 52%, transparent 88%)',
}

export function AtmosphericImageLayer({
  src,
  alt = '',
  className,
  focal = 'center',
  fade = 'all',
  opacity = 0.48,
  blur = 0,
  rotate = 0,
  scale = 1,
  zIndex = 0,
}: AtmosphericImageLayerProps) {
  const style: CSSProperties = {
    backgroundImage: `url(${src})`,
    backgroundPosition: focalPosition[focal],
    backgroundSize: 'cover',
    opacity,
    filter: blur ? `blur(${blur}px)` : undefined,
    mixBlendMode: 'multiply',
    transform: `rotate(${rotate}deg) scale(${scale})`,
    zIndex,
    maskImage: masks[fade],
    WebkitMaskImage: masks[fade],
  }

  return (
    <div
      aria-label={alt}
      role={alt ? 'img' : 'presentation'}
      className={cn('pointer-events-none absolute bg-no-repeat', className)}
      style={style}
    />
  )
}

export interface LayeredFactColumn {
  heading: string
  items: string[]
}

export interface LayeredFactBlockProps {
  title: string
  columns: LayeredFactColumn[]
  kicker?: string
  image?: AtmosphericImageLayerProps
  children?: ReactNode
  className?: string
}

export function LayeredFactBlock({
  title,
  columns,
  kicker,
  image,
  children,
  className,
}: LayeredFactBlockProps) {
  const [left, right] = columns

  return (
    <section
      className={cn(
        'relative isolate -mx-4 overflow-hidden px-4 py-8 sm:mx-0 sm:px-0 sm:py-12',
        className,
      )}
      style={{ backgroundColor: page }}
    >
      {image && (
        <AtmosphericImageLayer
          {...image}
          className={cn(
            'inset-x-[-18%] top-0 h-[78%] sm:inset-x-[-10%]',
            image.className,
          )}
        />
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-28"
        style={{
          background:
            'linear-gradient(180deg, #EAE6D8 0%, rgba(234,230,216,0) 78%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-32"
        style={{
          background:
            'linear-gradient(180deg, rgba(234,230,216,0), #EAE6D8 72%)',
        }}
      />

      <div
        className="relative z-10 mx-auto max-w-[760px] rounded-[28px] border px-5 py-6 sm:rounded-[32px] sm:px-12 sm:py-12"
        style={{
          backgroundColor: paper,
          borderColor: 'rgba(45,42,36,0.10)',
          boxShadow: '0 1px 0 rgba(45,42,36,0.04)',
        }}
      >
        {kicker && (
          <p
            className="mb-3 text-[10px] font-bold uppercase sm:mb-5 sm:text-[11px]"
            style={{
              fontFamily: sans,
              color: 'rgba(36,48,31,0.56)',
              letterSpacing: '0.22em',
            }}
          >
            {kicker}
          </p>
        )}
        <h2
          className="text-center text-[29px] leading-[0.98] sm:text-[48px]"
          style={{
            fontFamily: serif,
            fontWeight: 500,
            color: '#24301F',
            letterSpacing: 0,
          }}
        >
          {title}
        </h2>

        <div className="my-5 h-px w-full bg-[#2D2A24]/15 sm:my-9" />

        {left && right ? (
          <div className="grid grid-cols-[1fr_1px_1fr] gap-3 sm:gap-10">
            <LayeredFactColumnView column={left} />
            <div className="w-px bg-[#2D2A24]/15" aria-hidden />
            <LayeredFactColumnView column={right} />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

function LayeredFactColumnView({ column }: { column: LayeredFactColumn }) {
  return (
    <div>
      <h3
        className="mb-3 text-[22px] leading-none sm:mb-5 sm:text-[36px]"
        style={{
          fontFamily: serif,
          fontWeight: 500,
          color: '#24301F',
          letterSpacing: 0,
        }}
      >
        {column.heading}
      </h3>
      <ul className="m-0 list-none p-0">
        {column.items.map((item, index) => (
          <li
            key={item}
            className="py-2 text-[13.5px] leading-[1.38] sm:py-3 sm:text-[22px]"
            style={{
              borderTop: index === 0 ? undefined : '1px solid rgba(45,42,36,0.09)',
              color: 'rgba(36,48,31,0.76)',
              fontFamily: sans,
              fontWeight: 500,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface LayeredGuideHeroProps {
  title: string
  eyebrow?: string
  body?: string
  images: AtmosphericImageLayerProps[]
  children?: ReactNode
  className?: string
}

export function LayeredGuideHero({
  title,
  eyebrow,
  body,
  images,
  children,
  className,
}: LayeredGuideHeroProps) {
  return (
    <section
      className={cn(
        'relative isolate -mx-4 min-h-[560px] overflow-hidden px-4 py-10 sm:mx-0 sm:min-h-[620px] sm:px-8 sm:py-16',
        className,
      )}
      style={{ backgroundColor: page }}
    >
      {images.map((image, index) => (
        <AtmosphericImageLayer
          key={`${image.src}-${index}`}
          {...image}
          className={cn(
            index === 0 && 'left-[-55%] right-[-55%] top-[-14%] h-[62%]',
            index === 1 && 'bottom-[-6%] left-[-14%] h-[45%] w-[78%] sm:left-[-4%] sm:w-[54%]',
            index === 2 && 'bottom-[3%] right-[-22%] h-[52%] w-[86%] sm:right-[-8%] sm:w-[58%]',
            image.className,
          )}
          zIndex={image.zIndex ?? 0}
        />
      ))}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-36"
        style={{
          background:
            'linear-gradient(180deg, #EAE6D8 0%, rgba(234,230,216,0) 78%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44"
        style={{
          background:
            'linear-gradient(180deg, rgba(234,230,216,0), #EAE6D8 78%)',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[470px] max-w-5xl items-center justify-center sm:min-h-[500px]">
        <div
          className="w-full rounded-[30px] border px-7 py-10 sm:max-w-[760px] sm:rounded-[34px] sm:px-14 sm:py-14"
          style={{
            backgroundColor: paper,
            borderColor: 'rgba(45,42,36,0.10)',
          }}
        >
          {eyebrow && (
            <p
              className="mb-5 text-[11px] font-bold uppercase"
              style={{
                fontFamily: sans,
                color: 'rgba(36,48,31,0.56)',
                letterSpacing: '0.22em',
              }}
            >
              {eyebrow}
            </p>
          )}
          <h1
            className="text-[42px] leading-[0.95] sm:text-[64px]"
            style={{
              fontFamily: serif,
              fontWeight: 500,
              color: '#24301F',
              letterSpacing: 0,
            }}
          >
            {title}
          </h1>
          {body && (
            <p
              className="mt-5 max-w-[560px] text-[16px] leading-[1.65] sm:text-[18px]"
              style={{
                fontFamily: sans,
                color: 'rgba(36,48,31,0.68)',
                fontWeight: 500,
              }}
            >
              {body}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  )
}

export const layeredGuideSampleData = {
  hero: {
    eyebrow: 'Dyrkningsguide',
    title: 'Forskelle på chili og peberfrugter',
    body:
      'Begge er Capsicum, men styrke, frugtstørrelse og brug i køkkenet gør dem nemme at skelne i praksis.',
    images: [
      {
        src: '/images/makro/chili-habanero-orange/frugter.jpg',
        alt: 'Røde og orange chili som blødt makrolag',
        fade: 'band' as const,
        focal: 'center' as const,
        opacity: 0.24,
        blur: 1.5,
        scale: 1.04,
      },
      {
        src: '/images/makro/chili-habanero-orange/tvarsnit.jpg',
        alt: 'Chili i tværsnit som nedtonet baggrund',
        fade: 'bottom' as const,
        focal: 'bottom' as const,
        opacity: 0.25,
        rotate: -2,
        scale: 1.08,
      },
      {
        src: '/images/makro/peberfrugt-california-wonder/indre.jpg',
        alt: 'Peberfrugtens indre som blødt fotolag',
        fade: 'all' as const,
        focal: 'right' as const,
        opacity: 0.2,
        blur: 0.5,
        rotate: 1,
      },
    ],
  },
  fact: {
    title: 'Forskelle på chili og peberfrugter',
    image: {
      src: '/images/makro/chili-habanero-orange/frugter.jpg',
      alt: 'Chili og peberfrugt som atmosfærisk baggrund',
      fade: 'band' as const,
      focal: 'center' as const,
      opacity: 0.22,
      blur: 1.5,
      scale: 1.08,
    },
    columns: [
      {
        heading: 'Peberfrugt',
        items: [
          'Ingen eller meget mild styrke',
          'Store saftige frugter',
          'Tykt frugtkød',
          'Ofte spises rå',
        ],
      },
      {
        heading: 'Chili',
        items: [
          'Indeholder capsaicin',
          'Varierende styrke',
          'Typisk mindre frugter',
          'Bruges ofte som krydderi',
        ],
      },
    ],
  },
}
