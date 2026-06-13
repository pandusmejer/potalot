import type { InspirerForslag } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  forslag: InspirerForslag
}

/**
 * RUM 4 (V1.0-prototype) · Inspirér mig.
 *
 * Opdage nye ting — ÉT forslag ad gangen, aldrig et feed. Trækker
 * forbindelser mellem frøbank, planter, guides, historik og årstid.
 * Motoren findes (src/lib/inspiration.ts); dette er rummet hvor ét
 * forslag får plads til at trække vejret.
 *
 * PROTOTYPE: viser ét kurateret forslag. "Træk et nyt"-interaktion
 * og link til sort/guide er en senere sprint (ingen døde links nu).
 */
export function InspirerMig({ forslag }: Props) {
  return (
    <section>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.26em',
          color: 'rgba(36,48,31,0.5)',
          margin: 0,
          marginBottom: 18,
        }}
      >
        {forslag.kicker}
      </p>

      <p
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(30px, 7vw, 44px)',
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: '#24301F',
          margin: 0,
        }}
      >
        {forslag.navn}
      </p>
      <p
        style={{
          fontFamily: serif,
          fontWeight: 400,
          fontSize: 'clamp(19px, 4.4vw, 25px)',
          lineHeight: 1.3,
          color: 'rgba(36,48,31,0.7)',
          margin: 0,
          marginTop: 12,
          maxWidth: '22ch',
        }}
      >
        {forslag.begrundelse}
      </p>
    </section>
  )
}
