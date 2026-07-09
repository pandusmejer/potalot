import type { Optagelse, OptagelseStatus } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  eksempler: string[]
  optagelser?: Optagelse[]
}

// Diktafon = indbakke til haven: hver optagelse har en status (hvad den
// er blevet til). Menneskelige etiketter til det lille status-chip.
const STATUS_LABEL: Record<OptagelseStatus, string> = {
  unprocessed: 'Ikke behandlet',
  log: 'Føjet til log',
  opgave: 'Opgave oprettet',
  minde: 'Minde gemt',
  observation: 'Observation gemt',
}

/**
 * RUM 3 (V18-fidelitet) · Tal til din have.
 *
 * Den hurtigste inputmetode — på sigt Potalots største feature. Et
 * varmt, glødende mikrofon-objekt; brugeren taler 15 sekunder og
 * lægger telefonen væk. Stemmen bliver til noter, minder og opgaver.
 *
 * V18 (Annas mockup): glød-halo bag mikrofonen + "Seneste optagelser"
 * der viser at det talte faktisk bliver til noget.
 *
 * PROTOTYPE: optagelse/transskription/AI er ikke koblet endnu —
 * mikrofon og afspilning er visuelle. Demo-only.
 */
export function TalTilDinHave({ eksempler, optagelser = [] }: Props) {
  return (
    <section className="flex flex-col items-center" style={{ textAlign: 'center' }}>
      {/* Idle "vejrtrækning": knappen lever, men roligt — ikke en alarm.
          Respekterer prefers-reduced-motion. */}
      <style>{`
        @keyframes tal-breath {
          0%, 100% { transform: scale(1); box-shadow: 0 12px 30px rgba(31,45,29,0.18); }
          50%      { transform: scale(1.035); box-shadow: 0 18px 42px rgba(31,45,29,0.22); }
        }
        @keyframes tal-halo {
          0%, 100% { transform: scale(0.92); opacity: 0; }
          50%      { transform: scale(1.18); opacity: 0.16; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tal-breath, .tal-halo { animation: none !important; }
        }
      `}</style>

      {/* Overskrift forklarer selv handlingen (to linjer). */}
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.26em',
          lineHeight: 1.5,
          color: 'rgba(36,48,31,0.5)',
          margin: 0,
          marginBottom: 28,
        }}
      >
        Tryk og tal
        <br />
        til din have
      </p>

      {/* Mikrofonen med glød-halo */}
      <div
        style={{
          position: 'relative',
          width: 168,
          height: 168,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Pulserende halo bag knappen */}
        <div
          aria-hidden
          className="tal-halo"
          style={{
            position: 'absolute',
            width: 132,
            height: 132,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(55,76,45,0.55) 0%, rgba(55,76,45,0.22) 45%, rgba(55,76,45,0) 72%)',
            animation: 'tal-halo 4.4s ease-in-out infinite',
          }}
        />
        <button
          type="button"
          aria-label="Tryk og tal til din have"
          className="tal-breath"
          style={{
            position: 'relative',
            width: 92,
            height: 92,
            borderRadius: '50%',
            border: 'none',
            background: '#3B4A2F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(31,45,29,0.18)',
            cursor: 'pointer',
            animation: 'tal-breath 4.4s ease-in-out infinite',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" fill="#F4EFDC" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="#F4EFDC" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Kort, rolig hjælpetekst (overskriften bærer handlingen). */}
      <p
        style={{
          fontFamily: serif,
          fontWeight: 400,
          fontSize: 'clamp(18px, 4.2vw, 22px)',
          lineHeight: 1.32,
          color: 'rgba(36,48,31,0.72)',
          margin: 0,
          marginTop: 22,
          maxWidth: '22ch',
        }}
      >
        Fortæl hvad du ser. Potalot hjælper dig med at gemme det rigtigt.
      </p>

      {/* Seneste optagelser — beviset på at stemmen bliver til noget */}
      {optagelser.length > 0 && (
        <div style={{ width: '100%', marginTop: 34, textAlign: 'left' }}>
          <div className="flex items-baseline justify-between" style={{ marginBottom: 14 }}>
            <p
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: 'rgba(36,48,31,0.42)',
                margin: 0,
              }}
            >
              Seneste optagelser
            </p>
            {/* Se alle → optagelsesarkivet (bygges i eget sprint). */}
            <span
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#6A7554',
                margin: 0,
              }}
            >
              Se alle
            </span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="divide-y divide-border/50">
            {optagelser.map((o, i) => (
              <li key={i} className="flex items-center" style={{ gap: 12, paddingBlock: 12 }}>
                <span aria-hidden style={{ flexShrink: 0, color: '#3B4A2F' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 20c0-5 0-9 5-12-4 0-7 2-8 6-1-3-3-4-6-4 3 2 4 5 4 10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: sans,
                      fontSize: 14.5,
                      fontWeight: 600,
                      color: '#24301F',
                      lineHeight: 1.3,
                    }}
                  >
                    {o.tekst}
                  </span>
                  <span className="flex items-center" style={{ gap: 8, marginTop: 2 }}>
                    <span
                      style={{
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'rgba(36,48,31,0.45)',
                      }}
                    >
                      {o.tid}
                    </span>
                    {o.status && (
                      <span
                        style={{
                          fontFamily: sans,
                          fontSize: 10.5,
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          color: o.status === 'unprocessed' ? 'rgba(36,48,31,0.4)' : '#5F6B47',
                          background: o.status === 'unprocessed' ? 'rgba(36,48,31,0.06)' : 'rgba(106,117,84,0.12)',
                          padding: '1px 8px',
                          borderRadius: 999,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {STATUS_LABEL[o.status]}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(36,48,31,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="#24301F" aria-hidden>
                    <path d="M2 1.5v9l8-4.5z" />
                  </svg>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Eksempler — hvad man kan sige */}
      <div style={{ width: '100%', marginTop: 28, textAlign: 'left' }}>
        <p
          className="uppercase"
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'rgba(36,48,31,0.42)',
            margin: 0,
            marginBottom: 10,
          }}
        >
          Eksempler
        </p>
        <div className="space-y-1.5">
          {eksempler.map((e, i) => (
            <p
              key={i}
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(15px, 3vw, 18px)',
                lineHeight: 1.4,
                color: 'rgba(36,48,31,0.6)',
                margin: 0,
              }}
            >
              {e}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
