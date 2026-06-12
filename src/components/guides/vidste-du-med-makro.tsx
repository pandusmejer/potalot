import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
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
  align?: 'left' | 'right' | 'center'
  intensity?: 'soft' | 'medium'
}

const alignClass: Record<NonNullable<Props['align']>, string> = {
  left: 'mr-auto text-left',
  right: 'ml-auto text-left',
  center: 'mx-auto text-center',
}

const opacity: Record<NonNullable<Props['intensity']>, number> = {
  soft: 0.32,
  medium: 0.44,
}

/**
 * V4 layered note:
 * Lag 2 = atmospheric macro photo, Lag 4 = note divider,
 * Lag 5 = Cormorant/Manrope typography.
 */
export function VidsteDuMedMakro({
  macroImage,
  title = 'Vidste du?',
  children,
  align = 'left',
  intensity = 'soft',
}: Props) {
  const macroStyle: CSSProperties | null = macroImage
    ? {
        position: 'absolute',
        inset: '-40px 16px',
        backgroundImage: `url(${macroImage.src})`,
        backgroundSize: 'cover',
        backgroundPosition: macroImage.objectPosition,
        opacity: opacity[intensity],
        mixBlendMode: 'multiply',
        filter: 'blur(0.5px) saturate(0.9)',
        transform: `rotate(${macroImage.rotation}) scale(${macroImage.scale})`,
        maskImage:
          'radial-gradient(ellipse 48% 62% at center, black 0%, rgba(0,0,0,0.72) 34%, transparent 68%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 48% 62% at center, black 0%, rgba(0,0,0,0.72) 34%, transparent 68%)',
        pointerEvents: 'none',
        zIndex: 0,
      }
    : null

  return (
    <aside
      className="relative isolate my-12 overflow-visible px-6 py-8"
      style={{
        maxWidth: '100%',
      }}
    >
      {macroStyle && (
        <div
          aria-label={macroImage?.alt ?? ''}
          role={macroImage?.alt ? 'img' : 'presentation'}
          style={macroStyle}
        />
      )}

      <div
        className={cn('relative z-10 max-w-[520px] border-t pt-5', alignClass[align])}
        style={{
          borderTopColor: 'rgba(36,48,31,0.16)',
        }}
      >
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#7F8F6A',
            margin: 0,
            marginBottom: 12,
          }}
        >
          {title}
        </p>
        <div
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1.45,
            color: '#2D2A24',
          }}
        >
          {children}
        </div>
      </div>
    </aside>
  )
}
