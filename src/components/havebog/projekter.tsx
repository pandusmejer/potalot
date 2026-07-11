import type { ProjektForslag } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  projekt: ProjektForslag
}

/**
 * RUM 13 (V1.0-prototype) · Projekter.
 *
 * Større ambitioner — det der løfter haven ud over den daglige
 * pasning: nye højbede, skærehave, drivhus, insekthotel. ÉT forslag
 * ad gangen, roligt, som en invitation frem for en opgave.
 *
 * PROTOTYPE: forslaget er demo. Afledning fra haven (plads, sorter,
 * sæson) + en projekt-bank er en senere sprint.
 */
export function Projekter({ projekt }: Props) {
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
        {projekt.kicker}
      </p>

      <p
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(30px, 7cqw, 44px)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: '#24301F',
          margin: 0,
          maxWidth: '16ch',
        }}
      >
        {projekt.titel}
      </p>
    </section>
  )
}
