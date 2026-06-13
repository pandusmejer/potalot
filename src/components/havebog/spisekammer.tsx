import type { SpisekammerData } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  data: SpisekammerData
}

/**
 * RUM 10 (V1.0-prototype) · Spisekammer.
 *
 * Fra have til bord — den mest livsstils-agtige funktion. Ikke
 * lagerstyring; inspiration: høstklar nu → hvad kan det blive til.
 * Have → høst → køkken → liv.
 *
 * PROTOTYPE: høst-mængder og opskrifter er demo. Rigtige mængder
 * kræver høst-registrering; opskrifter kræver en kurateret art→ret-
 * mapping. Begge er senere sprints.
 */
export function Spisekammer({ data }: Props) {
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
          marginBottom: 20,
        }}
      >
        I dit spisekammer · denne uge
      </p>

      {/* Høstklar nu — store tal, små navne */}
      <div className="space-y-3">
        {data.hoest.map(h => (
          <p key={h.navn} style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span
              style={{
                fontFamily: sans,
                fontSize: 'clamp(26px, 6vw, 34px)',
                fontWeight: 700,
                color: '#24301F',
                fontVariantNumeric: 'tabular-nums',
                minWidth: '2.2ch',
              }}
            >
              {h.antal}
            </span>
            <span
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: 'clamp(20px, 4.6vw, 26px)',
                color: 'rgba(36,48,31,0.72)',
              }}
            >
              {h.navn}
            </span>
          </p>
        ))}
      </div>

      {/* Hvad det kan blive til */}
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: 'rgba(36,48,31,0.42)',
          margin: 0,
          marginTop: 28,
          marginBottom: 10,
        }}
      >
        Prøv
      </p>
      <div className="space-y-1.5">
        {data.opskrifter.map(o => (
          <p
            key={o}
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: 'clamp(21px, 4.8vw, 28px)',
              lineHeight: 1.2,
              color: '#24301F',
              margin: 0,
            }}
          >
            {o}
          </p>
        ))}
      </div>
    </section>
  )
}
