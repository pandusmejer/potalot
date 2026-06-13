const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  eksempler: string[]
}

/**
 * RUM 3 (V1.0-prototype) · Tal til din have.
 *
 * Den hurtigste inputmetode — på sigt Potalots største feature.
 * Ikke en knap gemt i en menu; et varmt, centralt mikrofon-objekt.
 * Brugeren taler 15 sekunder, så lægger telefonen væk.
 *
 * PROTOTYPE: mikrofonen er endnu ikke koblet til optagelse/AI. Dette
 * er førsteudgaven så rummet kan ses i huset. Lyd → transskription →
 * forståelse → forslag → godkendelse er en senere sprint.
 */
export function TalTilDinHave({ eksempler }: Props) {
  return (
    <section className="flex flex-col items-center" style={{ textAlign: 'center' }}>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.26em',
          color: 'rgba(36,48,31,0.5)',
          margin: 0,
          marginBottom: 24,
        }}
      >
        Tal til din have
      </p>

      {/* Mikrofonen — stort, varmt, taktilt objekt */}
      <button
        type="button"
        aria-label="Tal til din have"
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          border: 'none',
          background: '#3B4A2F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(36,48,31,0.22)',
          cursor: 'pointer',
        }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" fill="#F4EFDC" />
          <path
            d="M5 11a7 7 0 0 0 14 0M12 18v3"
            stroke="#F4EFDC"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <p
        style={{
          fontFamily: serif,
          fontWeight: 400,
          fontSize: 'clamp(22px, 5vw, 30px)',
          lineHeight: 1.25,
          color: '#24301F',
          margin: 0,
          marginTop: 22,
          maxWidth: '18ch',
        }}
      >
        Fortæl hvad du så, gjorde eller planlægger.
      </p>

      {/* Eksempler — hvad man kan sige */}
      <div className="space-y-2" style={{ marginTop: 20 }}>
        {eksempler.map((e, i) => (
          <p
            key={i}
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(15px, 3vw, 18px)',
              lineHeight: 1.4,
              color: 'rgba(36,48,31,0.55)',
              margin: 0,
            }}
          >
            {e}
          </p>
        ))}
      </div>
    </section>
  )
}
