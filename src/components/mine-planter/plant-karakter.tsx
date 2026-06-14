import type { PlantKarakter as Karakter } from '@/data/plant-karakter'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌿 KARAKTER — sortens personlighed, ikke dens data.
 *
 * Anna foretrækker fuld-bredde-formen (14. juni 2026): beskrivelsen bærer
 * sjælen som stor serif på fuld bredde, og de fire træk står i en rolig
 * række under en tynd skillelinje. Ingen ikoner, ingen badges — ren
 * typografi (spec). Personligheden læses før nogen data.
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

      {/* Sjælen — beskrivelsen i varm serif, fuld bredde. */}
      <p
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(21px, 5.6vw, 27px)',
          lineHeight: 1.3,
          letterSpacing: '0.004em',
          color: '#2D2A24',
          margin: '12px 0 0',
        }}
      >
        {karakter.beskrivelse}
      </p>

      {/* Personlighedskortet — fire træk under en tynd skillelinje. */}
      <div
        className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 pt-5 sm:grid-cols-4"
        style={{ borderTop: '1px solid rgba(36,48,31,0.12)' }}
      >
        {karakter.traits.map((t) => (
          <div key={t.label}>
            <p
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'rgba(36,48,31,0.48)',
                margin: 0,
              }}
            >
              {t.label}
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 14.5,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                color: '#24301F',
                margin: '4px 0 0',
              }}
            >
              {t.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
