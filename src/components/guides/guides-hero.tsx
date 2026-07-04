/**
 * GuidesHero — eget hero-layout for Dyrkningsguides.
 *
 * IKKE en wrapper om PageHero. Guides er Potalots feltguide/dyrkningsmanual —
 * faglig, rolig, systematisk. Hero'en bærer den tone: lille teknisk etiket,
 * stor Plex Condensed-display-overskrift (feltmanual, ikke romantisk herbarium),
 * kort sans-underrubrik. Ingen KPI'er, ingen dashboard-blok.
 *
 * Display = IBM Plex Sans Condensed (--font-plex-condensed). Alt praktisk/læsbart
 * = Manrope. Ingen nye fontfiler.
 */

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

export function GuidesHero() {
  return (
    <section className="pt-2 sm:pt-3">
      <p
        style={{
          fontFamily: sans,
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.52)',
          margin: '0 0 14px',
        }}
      >
        Potalot feltguide
      </p>
      <h1
        style={{
          fontFamily: plex,
          fontWeight: 600,
          fontSize: 'clamp(40px, 11.4vw, 68px)',
          lineHeight: 0.92,
          letterSpacing: '-0.02em',
          color: '#242019',
          margin: '0 0 18px',
          whiteSpace: 'nowrap',
        }}
      >
        Dyrkningsguides
      </h1>
      <p
        style={{
          fontFamily: sans,
          fontSize: 'clamp(15px, 3.9vw, 18px)',
          fontWeight: 400,
          lineHeight: 1.42,
          color: '#6A665C',
          margin: 0,
          maxWidth: 420,
        }}
      >
        Fra frø, jord og første blade til høst, frøtagning og næste sæson.
      </p>
    </section>
  )
}
