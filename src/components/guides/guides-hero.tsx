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
      {/* Eyebrow — samme tekniske etiket-stil som "Et godt sted at starte"
          (sans, 11px, 700, 0.18em, uppercase). Kategori-ordet flyttet op hertil,
          så h1 kan bære den redaktionelle linje. */}
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.72)',
          margin: '0 0 12px',
        }}
      >
        Dyrkningsguides
      </p>
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
        }}
      >
        Fra første frø
        <br />
        til sidste høst
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
        Brug Potalots guides som en sikker vej gennem
        <br />
        sæsonen — fra valg af sort til såning, udplantning,
        <br />
        pleje og høst.
      </p>
    </section>
  )
}
