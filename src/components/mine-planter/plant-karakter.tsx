import type { PlantKarakter as Karakter } from '@/data/plant-karakter'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌿 KARAKTER — sortens personlighed, det første du møder på en planteside.
 *
 * Annas dom (14. juni 2026): byg oplevelsen før ledningerne. Karakteren
 * defineres FØRST, fordi den gør planten til et væsen med temperament,
 * ikke en database-række. Beskrivelsen bærer sjælen (Cormorant, varm);
 * de fire træk er plantens "personlighedskort".
 *
 * Statisk indhold (src/data/plant-karakter.ts) i fase 1 — kobles til
 * guide/vidensmodel senere uden at røre komponenten.
 */
export function PlantKarakter({ karakter }: { karakter: Karakter }) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        borderRadius: 24,
        background: 'linear-gradient(155deg, #F4F0E2 0%, #EFEADB 100%)',
        border: '1px solid rgba(36,48,31,0.10)',
        padding: '22px 22px 18px',
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

      {/* Sjælen — beskrivelsen i varm serif. */}
      <p
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(20px, 5.2vw, 25px)',
          lineHeight: 1.32,
          letterSpacing: '0.005em',
          color: '#2D2A24',
          margin: '10px 0 0',
        }}
      >
        {karakter.beskrivelse}
      </p>

      {/* Personlighedskortet — fire træk under en tynd skillelinje. */}
      <div
        className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 pt-4 sm:grid-cols-4"
        style={{ borderTop: '1px solid rgba(36,48,31,0.10)' }}
      >
        {karakter.traits.map((t) => (
          <div key={t.label}>
            <p
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: 'rgba(36,48,31,0.48)',
                margin: 0,
              }}
            >
              {t.label}
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: '#24301F',
                margin: '3px 0 0',
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
