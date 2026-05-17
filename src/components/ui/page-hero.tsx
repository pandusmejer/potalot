import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeroProps {
  /** Stor serif-titel (hvid på farveblok) */
  title: React.ReactNode
  /** Kort underlinje under titlen */
  subtitle?: React.ReactNode
  /** Lille versal-kicker over titlen */
  kicker?: string
  /** Højrestillede handlinger (knapper) — wrapper på mobil */
  actions?: React.ReactNode
  /** Ekstra indhold under titel/underlinje (chips, tal …) */
  children?: React.ReactNode
  className?: string
}

/**
 * Sæsondrevet hero-bånd — den markante farveblok øverst på
 * hver side. Fyldt primær-flade m. varm dekorativ diagonal
 * (surface-band), hvid serif-titel. Erstatter de tidligere
 * ens "h1 + grå p"-headere, så sæsonfarven står stærkt på
 * alle sider, ikke kun frøbank/planter.
 */
export function PageHero({
  title,
  subtitle,
  kicker,
  actions,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'surface-band rounded-2xl px-5 py-7',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          {kicker && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--primary-foreground)]/65">
              {kicker}
            </p>
          )}
          <h1 className="mt-1 font-sans text-[2rem] font-bold leading-[1.1] tracking-tight text-[var(--primary-foreground)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-[var(--primary-foreground)]/80">
              {subtitle}
            </p>
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
