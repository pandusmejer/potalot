import type { PlantKarakter as Karakter } from '@/data/plant-karakter'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌿 KARAKTER — sortens personlighed, ikke dens data.
 *
 * Anna (spec): "Den vigtigste nye sektion. Ikke fakta. Karakter. Stor
 * serif. Ingen ikoner. Ingen badges." Derfor bærer den store serif-
 * essens ('Rolig · Lang · Tålmodig') og den varme uddybning sjælen til
 * venstre; de fire træk står som et rent, ordløst personlighedskort til
 * højre — støtte, ikke hovedperson. Ingen ikoner: typografien alene.
 *
 * Statisk indhold (src/data/plant-karakter.ts) i fase 1 — kobles til
 * guide/vidensmodel senere uden at røre komponenten.
 */
export function PlantKarakter({ karakter }: { karakter: Karakter }) {
  return (
    <section
      className="relative overflow-hidden rounded-[22px]"
      style={{
        background: 'linear-gradient(155deg, #F4F0E2 0%, #EFEADB 100%)',
        border: '1px solid rgba(36,48,31,0.10)',
        padding: 22,
      }}
    >
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
        }}
      >
        Karakter
      </p>

      <div className="mt-3 flex gap-4">
        {/* SJÆLEN — essens (stor serif) + uddybning. */}
        <div className="min-w-0 flex-1">
          <h2
            style={{
              fontFamily: serif,
              fontWeight: 600,
              fontSize: 'clamp(25px, 6.8vw, 31px)',
              lineHeight: 1.06,
              letterSpacing: '0.004em',
              color: '#2D2A24',
              margin: 0,
            }}
          >
            {karakter.essens}
          </h2>
          <p
            className="mt-2.5"
            style={{
              fontFamily: sans,
              fontSize: 14,
              fontWeight: 400,
              lineHeight: 1.5,
              color: 'rgba(45,42,36,0.74)',
              margin: 0,
            }}
          >
            {karakter.uddybning}
          </p>
        </div>

        {/* PERSONLIGHEDSKORTET — fire træk, 2×2, ren typografi (ingen ikoner). */}
        <div className="grid w-[43%] shrink-0 grid-cols-2 gap-x-3 gap-y-3.5 self-center">
          {karakter.traits.map((t) => (
            <div key={t.label} className="min-w-0">
              <p
                className="uppercase"
                style={{
                  fontFamily: sans,
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'rgba(36,48,31,0.46)',
                  margin: 0,
                }}
              >
                {t.label}
              </p>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '-0.005em',
                  lineHeight: 1.2,
                  color: '#24301F',
                  margin: '2px 0 0',
                }}
              >
                {t.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
