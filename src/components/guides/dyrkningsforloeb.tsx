/**
 * Dyrkningsforløb — åben editorial-bro mellem inspirations-delen og guidekortene.
 *
 * IKKE et kort og IKKE en foto-hero: en ren, rolig tekst-bro på siden. Label +
 * Plex-titel + body + en diskret linje der peger ned i "Guides i felten", så
 * øjet læser intro + guidekort som ÉN guideverden. Bladfotoet er bevidst fjernet
 * — atmosfæren bæres af hero-baggrunden og guide-sektionen omkring.
 */

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const plex = 'var(--font-plex-condensed), sans-serif'

export function Dyrkningsforloeb() {
  return (
    <section aria-labelledby="dyrkningsforloeb-titel" className="relative pl-2">
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

      {/* Én kort overgang der leder direkte ned i guidekortene (ingen ekstra
          "Guides i felten"-overskrift imellem). */}
      <p
        style={{
          margin: '14px 0 0',
          fontFamily: sans,
          fontSize: 12.5,
          fontWeight: 600,
          color: 'rgba(78,97,56,0.72)',
        }}
      >
        Vælg den plante, du står med.
      </p>
    </section>
  )
}
