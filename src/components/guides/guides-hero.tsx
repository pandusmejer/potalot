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
      <h1
        style={{
          fontFamily: plex,
          fontWeight: 600,
          // cqw (ikke vw): app-indholdet bor i en fast max-w-[390px]-kolonne med
          // containerType:inline-size. Med vw voksede titlen med VIEWPORTEN, så
          // på skærme >592px ramte den 61px-cap og blev klippet af kolonnens
          // overflow-x-clip. cqw binder den til kolonnen → altid ~40px, fitter.
          fontSize: 'clamp(36px, 10.3cqw, 61px)',
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
          fontSize: 'clamp(13.5px, 3.5cqw, 16px)',
          fontWeight: 400,
          lineHeight: 1.42,
          color: '#55524A',
          margin: 0,
          maxWidth: 420,
        }}
      >
        Fra frø, jord og første blade til høst,
        <br />
        frøtagning og næste sæson.
      </p>
    </section>
  )
}
