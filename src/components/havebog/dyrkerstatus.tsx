import type { Dyrkerstatus as DyrkerstatusData } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  status: DyrkerstatusData
}

/**
 * RUM 5 (V1.0-prototype) · Dyrkerstatus.
 *
 * Identitet, IKKE gamification. Ingen XP, ingen points, ingen
 * Bronze-Tomat. Tænk luksusur, mesterlære, laug — en titel man har
 * gjort sig fortjent til. Stor typografi, stor stolthed, lav støj.
 *
 * PROTOTYPE: titlen er demo. Afledning fra logs/sæsoner/guider er en
 * senere sprint. Niveau-prikkerne markerer rejsen, ikke "score".
 */
export function Dyrkerstatus({ status }: Props) {
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
          marginBottom: 14,
        }}
      >
        Din status som dyrker
      </p>

      <h2
        className="uppercase"
        style={{
          fontFamily: sans,
          fontWeight: 800,
          fontSize: 'clamp(30px, 7.6vw, 46px)',
          letterSpacing: '0.04em',
          lineHeight: 1,
          color: '#24301F',
          margin: 0,
        }}
      >
        {status.titel}
      </h2>

      {/* Niveau-rejsen — diskrete prikker, ikke en progress-bar */}
      <div className="flex items-center" style={{ gap: 7, marginTop: 18 }}>
        {Array.from({ length: status.afMax }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              width: i < status.niveau ? 9 : 7,
              height: i < status.niveau ? 9 : 7,
              borderRadius: '50%',
              background: i < status.niveau ? '#3B4A2F' : 'rgba(36,48,31,0.18)',
            }}
          />
        ))}
        <span
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.5)',
            marginLeft: 8,
          }}
        >
          Niveau {status.niveau} af {status.afMax}
        </span>
      </div>

      <p
        style={{
          fontFamily: serif,
          fontWeight: 400,
          fontSize: 'clamp(19px, 4.2vw, 24px)',
          lineHeight: 1.32,
          color: 'rgba(36,48,31,0.72)',
          margin: 0,
          marginTop: 18,
          maxWidth: '26ch',
        }}
      >
        {status.beskrivelse}
      </p>
    </section>
  )
}
