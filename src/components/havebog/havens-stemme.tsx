import type { DagensOpslag } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  opslag: DagensOpslag
}

const kickerStyle = {
  fontFamily: sans,
  fontWeight: 700,
  letterSpacing: '0.24em',
  textTransform: 'uppercase' as const,
  color: 'rgba(36,48,31,0.42)',
  margin: 0,
}

/**
 * ILDSTEDET (V16) — "Havens stemme i dag" som en DAGSSIDE.
 *
 * Ikke et brev med fire ligeværdige afsnit (V15), men en redaktion:
 * en datolinje, ÉN hovedhistorie (kæmpe — ét bål i centrum), og
 * støtte-takter med små rubrik-etiketter, stepped down. Apple
 * Journal / Moleskine / magasin-opslag.
 *
 * Ingen boks, intet kort, ingen "sektion" — bare en side man kan
 * opholde sig ved. Stor serif, massiv luft, hierarki frem for
 * sammenstilling. Ændrer sig dagligt (takterne roterer i actionen).
 */
export function HavensStemme({ opslag }: Props) {
  if (!opslag.lead?.tekst) return null

  return (
    <section
      style={{
        paddingBlock: '0 clamp(16px, 6vw, 40px)',
      }}
    >
      {/* Datolinjen er fjernet — adressen (HavebogDateline) under hero-
          bølgen ejer nu datoen. Ildstedet starter direkte på hovedhistorien. */}
      {/* Hovedhistorien — ét bål i centrum */}
      <p style={{ ...kickerStyle, fontSize: 11, color: 'rgba(36,48,31,0.5)' }}>
        {opslag.lead.kicker}
      </p>
      <p
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(34px, 8.4vw, 54px)',
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: '#24301F',
          margin: 0,
          marginTop: 14,
          maxWidth: '18ch',
        }}
      >
        {opslag.lead.tekst}
      </p>

      {/* Støtte-takter — hver med sin rubrik, stepped down */}
      {opslag.beats.map((b, i) => (
        <div key={i} style={{ marginTop: 'clamp(34px, 9vw, 56px)' }}>
          <p style={{ ...kickerStyle, fontSize: 10.5 }}>{b.kicker}</p>
          <p
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: 'clamp(22px, 5.2vw, 31px)',
              lineHeight: 1.26,
              letterSpacing: '-0.01em',
              color: 'rgba(36,48,31,0.8)',
              margin: 0,
              marginTop: 10,
              maxWidth: '24ch',
            }}
          >
            {b.tekst}
          </p>
        </div>
      ))}
    </section>
  )
}
