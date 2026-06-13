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
 * PROTOTYPE: færdighederne er demo. Afledning fra guider/aktiviteter/
 * noter/sæsonhistorik er en senere sprint.
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
                marginBottom: 10,
              }}
            >
              {o.omraade}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="space-y-1.5">
              {o.faerdigheder.map(f => (
                <li
                  key={f.navn}
                  className="flex items-center"
                  style={{
                    gap: 10,
                    fontFamily: sans,
                    fontSize: 15.5,
                    fontWeight: 500,
                    color: f.opnaaet ? '#24301F' : 'rgba(36,48,31,0.45)',
                  }}
                >
                  <span aria-hidden style={{ fontSize: 14, color: f.opnaaet ? '#3B4A2F' : 'rgba(36,48,31,0.3)' }}>
                    {f.opnaaet ? '✓' : '○'}
                  </span>
                  {f.navn}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
