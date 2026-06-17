import type { PlantKarakter as Karakter } from '@/data/plant-karakter'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌿 KARAKTER — sortens personlighed, ikke dens data.
 *
 * Anna (14. juni 2026): teksten skal arbejde hårdere. Første sætning
 * gøres MEGET stor (sortens essens — "Den klassiske italienske
 * saucetomat."), forklaringen står mindre nedenunder. De fire træk i en
 * rolig række under en tynd streg. Ingen ikoner — ren typografi.
 */
export function PlantKarakter({ karakter }: { karakter: Karakter }) {
  // Del beskrivelsen: første sætning bærer pondus, resten forklarer.
  const idx = karakter.beskrivelse.indexOf('. ')
  const foersteSaetning = idx === -1 ? karakter.beskrivelse : karakter.beskrivelse.slice(0, idx + 1)
  const resten = idx === -1 ? '' : karakter.beskrivelse.slice(idx + 2)

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

      {/* Sjælen — første sætning stor, med pondus. */}
      <p
        style={{
          fontFamily: serif,
          fontWeight: 600,
          fontSize: 'clamp(30px, 9vw, 42px)',
          lineHeight: 1.04,
          letterSpacing: '-0.005em',
          color: '#24301F',
          margin: '12px 0 0',
        }}
      >
        {foersteSaetning}
      </p>

      {/* Forklaringen — mindre, rolig. */}
      {resten && (
        <p
          className="max-w-[44ch]"
          style={{
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.5,
            color: 'rgba(45,42,36,0.72)',
            margin: '14px 0 0',
          }}
        >
          {resten}
        </p>
      )}

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
