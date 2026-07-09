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
        // Ekstra bund-padding, så sidste støtte-takt ikke lander for tæt
        // på den fixed bundnav.
        paddingBlock: '0 clamp(48px, 13vw, 80px)',
        // Samlet side-padding ~28-32px (main har 16px → +12-16px her).
        paddingInline: 'clamp(12px, 3.5vw, 16px)',
      }}
    >
      {/* Datolinjen er fjernet — adressen (HavebogDateline) under hero-
          bølgen ejer nu datoen. Ildstedet starter direkte på hovedhistorien
          som et stort editorial-opslag, ikke en fortsættelse af heroen. */}
      {/* Eyebrow */}
      <p style={{ ...kickerStyle, fontSize: 12, color: '#96998A' }}>
        {opslag.lead.kicker}
      </p>
      {/* Hovedhistorien — ét bål i centrum. Kort titel; sammenligningen
          ("aha"-laget) hører til underrubrikken. */}
      <p
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(44px, 12.8vw, 56px)',
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
          color: '#1F2D1D',
          margin: 0,
          marginTop: 16,
          maxWidth: '15ch',
        }}
      >
        {opslag.lead.tekst}
      </p>
      {opslag.lead.underrubrik && (
        <p
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: 'clamp(26px, 7vw, 32px)',
            lineHeight: 1.22,
            color: '#6F7465',
            margin: 0,
            marginTop: 22,
            maxWidth: '20ch',
          }}
        >
          {opslag.lead.underrubrik}
        </p>
      )}

      {/* Støtte-takter — sekundære og mere kompakte, så sektionen ikke
          føles som én lang serif-blok. Første takt får ekstra luft, så
          den tydeligt skiller sig fra hovedhistorien. */}
      {opslag.beats.map((b, i) => (
        <div
          key={i}
          style={{
            marginTop:
              i === 0 ? 'clamp(52px, 14vw, 76px)' : 'clamp(28px, 7.5vw, 42px)',
          }}
        >
          <p style={{ ...kickerStyle, fontSize: 10.5 }}>{b.kicker}</p>
          <p
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: 'clamp(19px, 4.6vw, 26px)',
              lineHeight: 1.32,
              letterSpacing: '-0.01em',
              color: 'rgba(36,48,31,0.68)',
              margin: 0,
              marginTop: 9,
              maxWidth: '26ch',
            }}
          >
            {b.tekst}
          </p>
        </div>
      ))}
    </section>
  )
}
