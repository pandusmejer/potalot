import type { Bedrift } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  bedrifter: Bedrift[]
}

/**
 * RUM 14 (V1.0-prototype) · Bedrifter.
 *
 * Milepæle markeret som indgraverede hædersmærker — ikke badges, ikke
 * achievements, ikke Xbox 2014. Mere som mærker i en botanisk bog:
 * titel + årstal, roligt og værdigt.
 *
 * PROTOTYPE: bedrifterne er demo. Afledning fra logs (første høst,
 * første overvintring, første frøavl …) er en senere sprint.
 * Overlapper med Minder — forholdet afklares når hierarkiet sættes.
 */
export function Bedrifter({ bedrifter }: Props) {
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
          marginBottom: 22,
        }}
      >
        Dine bedrifter
      </p>

      <div className="space-y-7">
        {bedrifter.map((b, i) => (
          <div key={i} className="flex flex-col items-center" style={{ textAlign: 'center' }}>
            {/* Indgraveret mærke — diskret botanik-glyf */}
            <span aria-hidden style={{ fontSize: 16, color: 'rgba(36,48,31,0.35)', lineHeight: 1 }}>
              ✿
            </span>
            <p
              style={{
                fontFamily: serif,
                fontWeight: 500,
                fontSize: 'clamp(24px, 5.4cqw, 32px)',
                lineHeight: 1.1,
                color: '#24301F',
                margin: 0,
                marginTop: 8,
              }}
            >
              {b.titel}
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: 'rgba(36,48,31,0.45)',
                margin: 0,
                marginTop: 4,
              }}
            >
              {b.aar}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
