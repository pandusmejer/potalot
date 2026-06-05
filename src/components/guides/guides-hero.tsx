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
    <section className="pt-2 sm:pt-3">
      <h1
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(46px, 11vw, 78px)',
          lineHeight: 0.95,
          letterSpacing: '-0.025em',
          color: '#2D2A24',
          margin: 0,
          marginBottom: 32, // V3 §15.4 — mere luft mellem H1 og under
        }}
      >
        Dyrkningsguides
      </h1>
      <p
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontSize: 'clamp(20px, 4.5vw, 28px)',
          fontWeight: 400,
          lineHeight: 1.3,
          color: '#6A665C',
          margin: 0,
          maxWidth: 520,
        }}
      >
        Lær hvordan planter dyrkes fra frø til høst.
      </p>
    </section>
  )
}
