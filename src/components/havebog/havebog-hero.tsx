import type { HeroStats } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  stats: HeroStats | null
}

/**
 * "Din Havebog" — eget hero-layout for Havebog.
 *
 * IKKE en wrapper om PageHero. Havebog er den første side folk åbner;
 * den skal have sin egen identitet. Greeting-pattern ("Godaften Maj /
 * Din havebog") tilhører dashboard-verdenen og er bevidst fraværende
 * her.
 *
 * Visuelt: rolig vertikal stacking, kraftig Cormorant-titel som første
 * blik, dæmpet Manrope-tagline, og en lille faktuel metadata-pille
 * (noter · sorter · høster). Ingen kicker. Ingen CTA.
 *
 * Designunivers: bruger eksisterende fonte-tokens (Manrope + Cormorant)
 * og master-spacing — ingen nye design-spor.
 */
export function HavebogHero({ stats }: Props) {
  const hasData =
    stats !== null && (stats.notes > 0 || stats.varieties > 0 || stats.harvests > 0)
  const tagline = hasData
    ? 'Din dyrkningsrejse samlet ét sted.'
    : 'Din første sæson begynder her.'

  return (
    <section className="space-y-5 pt-2 sm:pt-3">
      <h1
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(48px, 12vw, 84px)',
          lineHeight: 0.92,
          letterSpacing: '-0.025em',
          color: '#24301F',
          margin: 0,
        }}
      >
        Din Havebog
      </h1>
      <p
        style={{
          fontFamily: sans,
          fontSize: 'clamp(15px, 2.4vw, 18px)',
          fontWeight: 400,
          lineHeight: 1.45,
          color: 'rgba(36,48,31,0.62)',
          margin: 0,
          maxWidth: 460,
        }}
      >
        {tagline}
      </p>
      {hasData && stats && <StatsLine stats={stats} />}
    </section>
  )
}

function StatsLine({ stats }: { stats: HeroStats }) {
  const items: { value: number; label: string }[] = [
    { value: stats.notes, label: stats.notes === 1 ? 'note' : 'noter' },
    { value: stats.varieties, label: stats.varieties === 1 ? 'sort' : 'sorter' },
    {
      value: stats.harvests,
      label: `${stats.harvests === 1 ? 'høst' : 'høster'} i år`,
    },
  ]
  return (
    <p
      style={{
        fontFamily: sans,
        fontSize: 13.5,
        fontWeight: 600,
        color: 'rgba(36,48,31,0.55)',
        letterSpacing: '0.01em',
        margin: 0,
      }}
    >
      {items.map((it, i) => (
        <span key={it.label} className="inline-flex items-center gap-2.5">
          {i > 0 && (
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'currentColor',
                opacity: 0.5,
                marginInline: 6,
              }}
            />
          )}
          {it.value} {it.label}
        </span>
      ))}
    </p>
  )
}
