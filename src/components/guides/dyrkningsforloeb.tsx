/**
 * Dyrkningsforløb — åben editorial-bro mellem inspirations-delen og guidekortene.
 *
 * IKKE et kort og IKKE en foto-hero: en ren, rolig tekst-bro på siden. Label +
 * Plex-titel + body + en diskret linje der peger ned i "Guides i felten", så
 * øjet læser intro + guidekort som ÉN guideverden. Bladfotoet er bevidst fjernet
 * — atmosfæren bæres af hero-baggrunden og guide-sektionen omkring.
 */

import { ChevronDown } from 'lucide-react'

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

      {/* Markant overgangs-/handlingslinje der leder direkte ned i guidekortene
          (ingen ekstra sektionsoverskrift imellem). Mørkere grøn + semibold +
          lille chevron ned = tydelig bro. */}
      <p
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          margin: '16px 0 0',
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 700,
          color: '#4E6138',
        }}
      >
        Find din planteguide nedenfor.
        <ChevronDown width={15} height={15} strokeWidth={2.5} aria-hidden />
      </p>
    </section>
  )
}
