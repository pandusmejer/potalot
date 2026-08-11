import Link from 'next/link'
import { OptagelseStatusIkon } from '@/components/havebog/optagelse-status-ikon'
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
          marginBottom: 46,
        }}
      >
        Fortæl om
        <br />
        din have
      </p>

      {/* Mikrofonen med glød-halo. Snæver container (haloen pulser frit
          udenfor via absolut position) — så den reserverer minimal luft. */}
      <div
        style={{
          position: 'relative',
          width: 104,
          height: 104,
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
        {/* Demo: mic'en er ingen tavs attrap. Den fører til opret-bruger, så
            brugeren forstår at diktafonen er en indlogget funktion (ingen
            falsk mikrofon-tilladelse). Den ægte recorder = TalOptager (indlogget). */}
        <Link
          href="/opret"
          aria-label="Opret bruger for at bruge din havediktafon"
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
            textDecoration: 'none',
            animation: 'tal-breath 4.4s ease-in-out infinite',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" fill="#F4EFDC" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="#F4EFDC" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </Link>
      </div>

      {/* Kort, rolig hjælpetekst (overskriften bærer handlingen). */}
      <p
        style={{
          fontFamily: serif,
          fontWeight: 400,
          fontSize: 'clamp(18px, 4.2cqw, 22px)',
          lineHeight: 1.32,
          color: 'rgba(36,48,31,0.72)',
          margin: 0,
          marginTop: 28,
          maxWidth: '22ch',
        }}
      >
        Log ind for at bruge din havediktafon.<br />Indtal, hvad du ser, så gemmer Potalot det rigtige sted.
      </p>
      <div className="flex items-center" style={{ gap: 18, marginTop: 16 }}>
        <Link
          href="/opret"
          style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: '#3B4A2F', textDecoration: 'underline' }}
        >
          Opret gratis bruger
        </Link>
        <Link
          href="/login"
          style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.5)', textDecoration: 'underline' }}
        >
          Log ind
        </Link>
      </div>

      {/* Seneste optagelser — beviset på at stemmen bliver til noget */}
      {optagelser.length > 0 && (
        <div style={{ width: '100%', marginTop: 68, textAlign: 'left' }}>
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
            {/* Se alle → optagelsesarkivet. */}
            <Link
              href="/havebog/optagelser"
              className="uppercase no-underline"
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.22em',
                color: '#6A7554',
                margin: 0,
              }}
            >
              Se alle
            </Link>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="divide-y divide-border/50">
            {optagelser.map((o, i) => (
              <li key={i} className="flex items-center" style={{ gap: 12, paddingBlock: 12 }}>
                <span aria-hidden style={{ flexShrink: 0 }}>
                  <OptagelseStatusIkon status={o.status} />
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
                <button
                  type="button"
                  aria-label="Afspil optagelse"
                  className="flex items-center justify-center flex-shrink-0 transition-colors hover:border-[#3B4A2F] hover:bg-[rgba(59,74,47,0.08)]"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(36,48,31,0.2)',
                    background: 'transparent',
                    color: '#24301F',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                    <path d="M2 1.5v9l8-4.5z" />
                  </svg>
                </button>
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
                fontSize: 'clamp(15px, 3cqw, 18px)',
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
