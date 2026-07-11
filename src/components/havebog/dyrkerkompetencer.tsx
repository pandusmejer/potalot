import type { Kompetenceomraade } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  omraader: Kompetenceomraade[]
}

/**
 * RUM 6 (V1.0-prototype) · Dyrkerkompetencer.
 *
 * Udvikling — det man bliver bedre til. Ikke "X af Y skills" (SaaS-
 * dashboard); kompetenceområder med opnåede færdigheder og næste
 * skridt. Mennesker vil ikke føle sig som spillere — de vil føle sig
 * dygtigere.
 *
 * Afledt af faktiske log-handlinger (byggKompetencer): område pr. art +
 * korte færdighedsord. Ingen "X af Y", ingen opnået-badges — bare hvad
 * brugeren har gjort, læst som en rolig linje.
 */
export function Dyrkerkompetencer({ omraader }: Props) {
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
        Dine kompetencer
      </p>

      <div className="space-y-8">
        {omraader.map(o => (
          <div key={o.omraade}>
            <p
              style={{
                fontFamily: serif,
                fontWeight: 500,
                fontSize: 'clamp(23px, 5vw, 30px)',
                lineHeight: 1.1,
                color: '#24301F',
                margin: 0,
                marginBottom: 6,
              }}
            >
              {o.omraade}
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '0.01em',
                color: 'rgba(36,48,31,0.62)',
                margin: 0,
              }}
            >
              {o.faerdigheder.join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
