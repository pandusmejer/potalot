import { BleedBand, BleedFromLeft, BleedFromRight } from './bleed-blocks'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'

export function BleedBlocksDemo() {
  return (
    <section
      className="overflow-x-clip pb-16 pt-7"
      style={{ background: '#EAE6D8', minHeight: '100dvh' }}
    >
      <p
        className="mx-8 mb-6 uppercase"
        style={{
          color: 'rgba(45,42,36,0.58)',
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.14em',
          lineHeight: 1.2,
        }}
      >
        Eksempler på bleed
      </p>

      <div className="space-y-0 overflow-x-clip">
        <BleedFromLeft
          imageSrc="/images/makro/tomat.jpg"
          alt="Makro af tomat med dug"
          label="Bleed fra venstre"
          description="Fader ud mod højre"
        />

        <BleedFromRight
          imageSrc="/images/makro/blad.jpg"
          alt="Makro af bladstruktur"
          label="Bleed fra højre"
          description="Fader ud mod venstre"
        />

        <BleedBand
          imageSrc="/images/makro/dahlia.jpg"
          alt="Makro af dahlia kronblade"
          label="Bleed som bånd"
          description="Top og bund fader blødt"
        />
      </div>
    </section>
  )
}
