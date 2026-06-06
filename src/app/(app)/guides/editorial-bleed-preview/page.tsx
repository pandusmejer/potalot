/**
 * EditorialBleedCard preview-route
 *
 * Isoleret visning af Codex's tre EditorialBleedCard-varianter:
 *
 *   1. variant="left"   — foto til venstre, tekst lander i fade-zonen
 *   2. variant="right"  — foto til højre, tekst lander i fade-zonen
 *   3. variant="band"   — full-bleed top-foto, tekst lander nedunder
 *                          i fade-overgangen mod cremepapir
 *
 * Formål: vurdér om komponenten faktisk løser "blok på blok"-problemet
 * — kan billede og tekst smelte sammen i stedet for at stable sig som
 * papkasser? Ingen integration i live guides før beslutningen er taget.
 *
 * URL: /guides/editorial-bleed-preview
 */

import { EditorialBleedCard } from '@/components/guides/editorial-bleed-card'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

export default function EditorialBleedPreviewPage() {
  return (
    <main
      className="overflow-x-clip pb-24 pt-6"
      style={{ background: '#EAE6D8', minHeight: '100dvh' }}
    >
      <div className="mx-6 mb-8 max-w-[440px]">
        <p
          className="m-0 uppercase"
          style={{
            color: 'rgba(36,48,31,0.55)',
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            lineHeight: 1.25,
          }}
        >
          Preview · ikke i live guides
        </p>
        <h1
          className="mt-3"
          style={{
            color: '#2D2A24',
            fontFamily: serif,
            fontSize: 'clamp(32px, 9vw, 42px)',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1.0,
            margin: 0,
          }}
        >
          EditorialBleedCard
        </h1>
        <p
          className="mt-3"
          style={{
            color: 'rgba(36,48,31,0.62)',
            fontFamily: serif,
            fontSize: 'clamp(16px, 4vw, 18px)',
            fontStyle: 'italic',
            lineHeight: 1.45,
            margin: 0,
          }}
        >
          Tekst skal lande ovenpå fade-zonen i billedet, ikke ved siden af.
          Billede + tekst skal opleves som samme rytme, ikke som to
          separate blokke.
        </p>
      </div>

      <ComponentLabel
        eyebrow="01"
        title='variant="left"'
        subtitle="Foto fylder venstre side, fader mod højre. Tekst lander i fade-zonen."
      />
      <EditorialBleedCard
        eyebrow="Guidetype"
        title="Planteguide"
        description="Primært tekst med makrodetaljer, der bryder layoutet."
        ctaLabel="Vidensdybde"
        imageSrc="/images/plantekort/tomat-san-marzano.jpg"
        imageAlt="San Marzano tomater på planten"
        variant="left"
        objectPosition="34% 48%"
        imageScale={1.08}
      />

      <div className="my-12" />

      <ComponentLabel
        eyebrow="02"
        title='variant="right"'
        subtitle="Foto fylder højre side, fader mod venstre. Tekst lander i fade-zonen."
      />
      <EditorialBleedCard
        eyebrow="Sortsvalg"
        title="Tættere på sorten"
        description="Makrofotoet ligger som materiale bag teksten, ikke som et separat billede."
        ctaLabel="Se sorten"
        imageSrc="/images/makro/agurk/blad.jpg"
        imageAlt="Makro af agurkblad"
        variant="right"
        objectPosition="58% 50%"
        imageScale={1.16}
      />

      <div className="my-12" />

      <ComponentLabel
        eyebrow="03"
        title='variant="band"'
        subtitle="Full-bleed top-foto, fader top + bund. Tekst lander i bund-fade."
      />
      <EditorialBleedCard
        eyebrow="Sanselig note"
        title="Når billedet bliver overgang"
        description="Teksten lander i fade-zonen, så billedet og næste afsnit opleves som samme rytme."
        imageSrc="/images/plantekort/dahlia-cafe-au-lait.jpg"
        imageAlt="Dahlia Café au Lait kronblade"
        variant="band"
        objectPosition="50% 45%"
        imageScale={1.1}
      />
    </main>
  )
}

function ComponentLabel({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <div className="mx-6 mb-4 max-w-[440px]">
      <p
        className="m-0 uppercase"
        style={{
          color: '#7F8F6A',
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.18em',
          lineHeight: 1.25,
        }}
      >
        {eyebrow} · {title}
      </p>
      <p
        className="mt-2 max-w-[36ch]"
        style={{
          color: 'rgba(36,48,31,0.62)',
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.45,
          margin: 0,
        }}
      >
        {subtitle}
      </p>
    </div>
  )
}
