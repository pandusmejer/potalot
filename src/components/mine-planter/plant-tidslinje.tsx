import type { DetailMilestone } from '@/data/plant-detail'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const GREEN = '#617345'

/**
 * TIDSLINJE — plantens livshistorie, fortalt. IKKE proces.
 *
 * Anna (14. juni 2026): den gamle vandrette ikon-stribe føltes som
 * "✓ sået ✓ spiret ✓ ompottet" — korrekt, men ikke interessant. Den nye
 * er lodret og narrativ: hver milepæl er en dato + én sætning historie.
 * Teksten er hovedpersonen. Det kommende (høst) står som en stiplet,
 * ventende node.
 */
export function PlantTidslinje({ milestones }: { milestones: DetailMilestone[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2
          className="uppercase"
          style={{
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'rgba(36,48,31,0.52)',
          }}
        >
          Tidslinje
        </h2>
        {/* "Se alle" fjernet (Anna PLT-0202): var et dødt span uden handling. */}
      </div>

      <ol className="relative mt-5" style={{ paddingLeft: 28 }}>
        {/* Lodret rail. */}
        <span
          aria-hidden
          className="absolute"
          style={{ left: 5, top: 8, bottom: 16, width: 2, background: 'rgba(97,115,69,0.22)' }}
        />
        {milestones.map((m) => {
          const fremtid = m.dato === null
          return (
            <li key={m.label} className="relative" style={{ paddingBottom: 22 }}>
              {/* Node på rail'en — fyldt når sket, stiplet når kommende. */}
              <span
                aria-hidden
                className="absolute rounded-full"
                style={
                  fremtid
                    ? {
                        left: -28 + 5 - 5,
                        top: 6,
                        width: 12,
                        height: 12,
                        background: 'var(--background)',
                        border: '2px dashed rgba(97,115,69,0.6)',
                      }
                    : {
                        left: -28 + 5 - 4,
                        top: 7,
                        width: 11,
                        height: 11,
                        background: GREEN,
                        boxShadow: '0 0 0 4px rgba(97,115,69,0.12)',
                      }
                }
              />
              {/* Dato (eller stadie-navn for det kommende) — overskrift. */}
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 13.5,
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  color: fremtid ? 'rgba(36,48,31,0.5)' : '#24301F',
                  margin: 0,
                }}
              >
                {m.dato ?? m.label}
              </p>
              {/* Historien — hovedteksten, i varm serif. */}
              <p
                className="mt-1 max-w-[40ch]"
                style={{
                  fontFamily: serif,
                  fontWeight: 500,
                  fontSize: 'clamp(17px, 4.6vw, 19px)',
                  lineHeight: 1.32,
                  letterSpacing: '0.004em',
                  color: fremtid ? 'rgba(45,42,36,0.62)' : '#2D2A24',
                  margin: '4px 0 0',
                }}
              >
                {m.historie}
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
