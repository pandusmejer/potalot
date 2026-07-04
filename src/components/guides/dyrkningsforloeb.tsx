/**
 * Dyrkningsforløb — åben editorial-bro mellem inspirations-delen og guidekortene.
 *
 * IKKE et lukket kort. En fuld-bredde atmosfærisk sektion, hvor bladfotoet
 * bleeder ud i sidekanterne og BUNDEN fader ud i side-baggrunden — så der ikke
 * er en hård kort-kant. Den opløses ned mod "Guides i felten", så øjet læser
 * intro + guidekort som ÉN guideverden, ikke to adskilte moduler. Ingen hero-
 * følelse: modest højde, rolig copy, Plex til titel, sans til resten.
 */

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const plex = 'var(--font-plex-condensed), sans-serif'
const page = '#EAE6D8'

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
      className="relative isolate -mx-4 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: '50% 42%' }}
      />
      {/* Venstre-vægtet creme-scrim: samler teksten, lader bladet ånde til højre. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(110deg, rgba(238,234,219,0.95) 0%, rgba(238,234,219,0.86) 40%, rgba(238,234,219,0.5) 78%, rgba(238,234,219,0.3) 100%)',
        }}
      />
      {/* Top: emergér blødt fra side-baggrunden (ingen hård overkant). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-10"
        style={{ background: `linear-gradient(to bottom, ${page}, rgba(234,230,216,0))` }}
      />
      {/* Bund: opløs ned mod "Guides i felten" — ingen kort-slutning. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
        style={{
          background: `linear-gradient(to top, ${page} 0%, rgba(234,230,216,0.72) 44%, rgba(234,230,216,0) 100%)`,
        }}
      />

      <div className="relative z-10 px-4" style={{ paddingTop: 20, paddingBottom: 26 }}>
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
          Brug Potalots guides som en sikker vej gennem sæsonen — fra valg af sort
          til såning, udplantning, pleje og høst.
        </p>

        {/* Diskret bro-linje der peger ind i næste sektion, ikke sidste element
            i et card. */}
        <p
          style={{
            margin: '14px 0 0',
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
            color: 'rgba(78,97,56,0.72)',
          }}
        >
          Vælg en planteguide nedenfor.
        </p>
      </div>
    </section>
  )
}
