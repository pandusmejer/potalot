/**
 * GuidesHero — eget hero-layout for Dyrkningsguides.
 *
 * IKKE en wrapper om PageHero. Guides er Potalots mest editorial side
 * (naturhåndbog, ikke dashboard), og hero'en skal bære den tone:
 * rolig, fordybende, ingen KPI'er, ingen stats, ingen dashboard-blok.
 *
 * Bruger eksisterende fonte-tokens (Manrope + Cormorant) og master-
 * spacing — ingen nye design-spor, ingen ny visuel identitet ud over
 * det Potalot-univers vi allerede har.
 */

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

export function GuidesHero() {
  return (
    <section className="space-y-5 pt-2 sm:pt-3">
      <h1
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(46px, 11vw, 78px)',
          lineHeight: 0.95,
          letterSpacing: '-0.025em',
          color: '#24301F',
          margin: 0,
        }}
      >
        Dyrkningsguides
      </h1>
      <p
        style={{
          fontFamily: sans,
          fontSize: 'clamp(15px, 2.4vw, 18px)',
          fontWeight: 400,
          lineHeight: 1.45,
          color: 'rgba(36,48,31,0.62)',
          margin: 0,
          maxWidth: 480,
        }}
      >
        Lær hvordan planter dyrkes fra frø til høst.
      </p>
    </section>
  )
}
