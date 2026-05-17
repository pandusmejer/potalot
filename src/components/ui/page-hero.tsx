import * as React from 'react'
import { cn } from '@/lib/utils'

export type PageHeroTone = 'primary' | 'coral' | 'strong' | 'sun' | 'fresh'

/** Flad palette-blokfarve + læsbar tekstfarve pr. tone */
const TONES: Record<PageHeroTone, { bg: string; fg: string }> = {
  primary: { bg: 'var(--primary)', fg: 'var(--primary-foreground)' },
  coral: { bg: 'var(--accent)', fg: 'var(--accent-foreground)' },
  strong: { bg: 'var(--accent-strong)', fg: 'var(--primary-foreground)' },
  sun: { bg: 'var(--block-sun)', fg: 'var(--foreground)' },
  fresh: { bg: 'var(--block-fresh)', fg: 'var(--foreground)' },
}

interface PageHeroProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  kicker?: string
  /** Flad blokfarve fra sæson-paletten (varier pr. side) */
  tone?: PageHeroTone
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/**
 * Sæsondrevet hero-blok — den markante flade farveblok øverst
 * på hver side. Tone vælger palettefarve (grøn/koral/gul/lime…)
 * så appen varierer og ikke er dæmpet grøn. Fed sans-titel.
 */
export function PageHero({
  title,
  subtitle,
  kicker,
  tone = 'primary',
  actions,
  children,
  className,
}: PageHeroProps) {
  const { bg, fg } = TONES[tone]
  return (
    <section
      className={cn('rounded-2xl px-5 py-7', className)}
      style={{ backgroundColor: bg, color: fg }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          {kicker && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-65">
              {kicker}
            </p>
          )}
          <h1 className="mt-1 font-sans text-[2rem] font-bold leading-[1.1] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm opacity-80">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}
