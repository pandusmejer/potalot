import type { CSSProperties, ReactNode } from 'react'
import type { SelectedGuideImage } from '@/lib/guides/select-guide-image'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  macroSrc: string
  macroAlt?: string
  macroImage?: SelectedGuideImage | null
  title?: string
  children: ReactNode
  variant?: 'soft' | 'paper'
  accent?: string
}

/**
 * V4 layered practical tip:
 * Lag 2 = atmospheric macro photo, Lag 4 = tip-panel,
 * Lag 5 = Potalot typography.
 */
export function PotalotTipMedMakro({
  macroSrc,
  macroAlt = '',
  macroImage,
  title = 'Potalot-tip',
  children,
  variant = 'soft',
  accent = '#7F8F6A',
}: Props) {
  const imageSrc = macroImage?.src ?? macroSrc
  const imageAlt = macroImage?.alt ?? macroAlt
  const objectPosition = macroImage?.objectPosition ?? '56% center'
  const scale = macroImage?.scale ?? 1
  const rotation = macroImage?.rotation ?? '1deg'

  const macroStyle: CSSProperties = {
    position: 'absolute',
    inset: '-48px 10px',
    backgroundImage: `url(${imageSrc})`,
    backgroundSize: 'cover',
    backgroundPosition: objectPosition,
    opacity: variant === 'paper' ? 0.32 : 0.4,
    mixBlendMode: 'multiply',
    filter: 'blur(0.75px) saturate(0.9)',
    transform: `rotate(${rotation}) scale(${scale})`,
    maskImage:
      'radial-gradient(ellipse 54% 68% at center, black 0%, rgba(0,0,0,0.76) 38%, transparent 74%)',
    WebkitMaskImage:
      'radial-gradient(ellipse 54% 68% at center, black 0%, rgba(0,0,0,0.76) 38%, transparent 74%)',
    pointerEvents: 'none',
    zIndex: 0,
  }

  return (
    <aside
      className="relative isolate my-14 overflow-visible px-6 py-9"
      style={{ maxWidth: '100%' }}
    >
      <div
        aria-label={imageAlt}
        role={imageAlt ? 'img' : 'presentation'}
        style={macroStyle}
      />

      <div
        className="relative z-[2] max-w-[560px] rounded-r-[28px] py-6 pr-6 pl-[22px]"
        style={{
          background:
            variant === 'paper' ? '#F4F0E5' : 'rgba(244,240,229,0.68)',
          borderLeft: `4px solid ${accent}`,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      >
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: accent,
            margin: 0,
            marginBottom: 10,
          }}
        >
          {title}
        </p>
        <div
          style={{
            fontFamily: serif,
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1.5,
            color: '#2D2A24',
          }}
        >
          {children}
        </div>
      </div>
    </aside>
  )
}
