import type { CSSProperties, ReactNode } from 'react'
import type { PotalotMacroOutput } from '@/lib/images/types'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  /**
   * Atmosfærisk makro-foto fra resolvePotalotMacro().
   * Hvis null renderes blokken UDEN makro-baggrund — ingen hardcoded
   * fallback-path. Forkert billede er værre end intet billede.
   */
  macroImage: PotalotMacroOutput | null
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
  macroImage,
  title = 'Potalot-tip',
  children,
  variant = 'soft',
  accent = '#7F8F6A',
}: Props) {
  const macroStyle: CSSProperties | null = macroImage
    ? {
        position: 'absolute',
        inset: '-48px 10px',
        backgroundImage: `url(${macroImage.src})`,
        backgroundSize: 'cover',
        backgroundPosition: macroImage.objectPosition,
        opacity: variant === 'paper' ? 0.32 : 0.4,
        mixBlendMode: 'multiply',
        filter: 'blur(0.75px) saturate(0.9)',
        transform: `rotate(${macroImage.rotation}) scale(${macroImage.scale})`,
        maskImage:
          'radial-gradient(ellipse 54% 68% at center, black 0%, rgba(0,0,0,0.76) 38%, transparent 74%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 54% 68% at center, black 0%, rgba(0,0,0,0.76) 38%, transparent 74%)',
        pointerEvents: 'none',
        zIndex: 0,
      }
    : null

  return (
    <aside
      className="relative isolate my-14 overflow-visible px-6 py-9"
      style={{ maxWidth: '100%' }}
    >
      {macroStyle && (
        <div
          aria-label={macroImage?.alt ?? ''}
          role={macroImage?.alt ? 'img' : 'presentation'}
          style={macroStyle}
        />
      )}

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
