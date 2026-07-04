/**
 * Dyrkningsforløb — kompakt bro mellem inspirations-delen og guidekortene.
 *
 * Erstatter den store EditorialBleedCard-"stemningshero" ("Fra første frø til
 * sidste høst"), der føltes som en anden hero midt på siden. Nu en lavere,
 * mere funktionel feltguide-bro: den forklarer at Guides følger planten gennem
 * hele sæsonen (sortvalg → høst) via små stage-chips. Bladfotoet er atmosfærisk
 * BAGGRUND (dæmpet af en creme-scrim), ikke hovedmotiv. Plex til titlen, sans
 * til alt andet. Ingen CTA — guidekortene ligger lige under.
 */

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const plex = 'var(--font-plex-condensed), sans-serif'

const STAGES = ['Sortvalg', 'Såning', 'Udplantning', 'Pleje', 'Høst']

export function Dyrkningsforloeb({
  imageSrc,
  imageAlt,
}: {
  imageSrc: string
  imageAlt: string
}) {
  return (
    <section
      aria-labelledby="dyrkningsforloeb-titel"
      className="relative isolate overflow-hidden"
      style={{
        borderRadius: 24,
        minHeight: 168,
        border: '1px solid rgba(45,42,36,0.12)',
        background: '#F4F0E5',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: '50% 42%' }}
      />
      {/* Creme-scrim: samler teksten til venstre, lader bladet ånde til højre.
          Kontrolleret nok til at den mørke tekst er læsbar. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(112deg, rgba(244,240,229,0.96) 0%, rgba(244,240,229,0.88) 44%, rgba(244,240,229,0.52) 80%, rgba(244,240,229,0.3) 100%)',
        }}
      />

      <div className="relative z-10" style={{ padding: '20px 22px 22px' }}>
        <p
          style={{
            margin: 0,
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.58)',
          }}
        >
          Dyrkningsforløb
        </p>
        <h3
          id="dyrkningsforloeb-titel"
          style={{
            margin: '8px 0 0',
            fontFamily: plex,
            fontWeight: 600,
            fontSize: 'clamp(27px, 8vw, 35px)',
            lineHeight: 0.96,
            letterSpacing: '-0.01em',
            color: '#242019',
          }}
        >
          Fra første frø
          <br />
          til sidste høst
        </h3>
        <p
          style={{
            margin: '10px 0 0',
            maxWidth: 340,
            fontFamily: sans,
            fontSize: 13.5,
            fontWeight: 500,
            lineHeight: 1.45,
            color: '#4A4636',
          }}
        >
          Brug Potalots guides som en rolig vej gennem sæsonen — fra valg af sort
          til såning, udplantning, pleje og høst.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {STAGES.map(stage => (
            <span
              key={stage}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: sans,
                fontSize: 11.5,
                fontWeight: 600,
                color: '#4E6138',
                padding: '5px 11px',
                borderRadius: 999,
                border: '1px solid rgba(86,111,60,0.30)',
                background: 'rgba(244,240,229,0.55)',
              }}
            >
              {stage}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
