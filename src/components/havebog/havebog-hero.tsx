import type { HeroStats, Tidslinje } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  stats: HeroStats | null
  tidslinje?: Tidslinje
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
export function HavebogHero({ stats, tidslinje }: Props) {
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
      {tidslinje && <TidslinjeLine tidslinje={tidslinje} />}
      {hasData && stats && <StatsLine stats={stats} />}
    </section>
  )
}

/**
 * "Du er her"-linjen — én rolig editorial sætning under tagline.
 *
 * Format:
 *   Ny bruger:        "Søndag d. 7. juni"
 *   Med milestone:    "Søndag d. 7. juni · 12 dage siden du satte agurkerne ud"
 *   Aktiv bruger:     "Søndag d. 7. juni · 12 dage siden du satte agurkerne ud
 *                      · 3 noter fra denne uge"
 *
 * Cormorant italic — bevidst LITTERÆR, ikke metadata. Manrope ville
 * have læst som "endnu en stats-linje under den eksisterende stats-
 * linje". Serif italic placerer den som forfatter-stemme: en lille
 * dagbogs-overskrift, ikke en data-rapport.
 *
 * Tom-tilstand er sin egen typografi (bare datoen, ingen ·) — vi
 * tvinger ikke separatorer ind i en sætning der består af én del.
 *
 * BEVIDST IKKE en CTA, IKKE en panel-sektion, IKKE en dashboard-
 * statuslinje. Bare tids-orientering.
 */
function TidslinjeLine({ tidslinje }: { tidslinje: Tidslinje }) {
  const parts: string[] = [tidslinje.dateText]
  if (tidslinje.milestoneText) parts.push(tidslinje.milestoneText)
  if (tidslinje.weekNoteCount > 0) {
    parts.push(
      `${tidslinje.weekNoteCount} ${tidslinje.weekNoteCount === 1 ? 'note' : 'noter'} fra denne uge`,
    )
  }
  return (
    <p
      style={{
        fontFamily: serif,
        fontStyle: 'italic',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: 1.5,
        color: 'rgba(36,48,31,0.58)',
        letterSpacing: 0,
        margin: 0,
        maxWidth: 520,
      }}
    >
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                marginInline: 10,
                opacity: 0.55,
              }}
            >
              ·
            </span>
          )}
          {part}
        </span>
      ))}
    </p>
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
