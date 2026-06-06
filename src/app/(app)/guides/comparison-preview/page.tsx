/**
 * Comparison preview-route
 *
 * Isoleret visning af Codex's to comparison-komponenter:
 *
 *   1. GuideComparisonList — tabel-stil (rækker med VS-badge i midten)
 *   2. GuideComparisonBadge — portræt-stil (to runde fotos + dotted line)
 *
 * Ingen integration i live guides. Ingen ændringer i guide-detail.
 * Bruges udelukkende til at vurdere komponenterne i app-kontekst på
 * mobile før evt. integration.
 *
 * URL: /guides/comparison-preview
 */

import { CalendarDays, Circle, Leaf, Sprout } from 'lucide-react'
import {
  GuideComparisonBadge,
  GuideComparisonList,
  type ComparisonRow,
} from '@/components/guides/guide-comparison'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

// Demo-rækker fra Codex's guide-comparison-demo.tsx (kopieret så preview-
// siden er selvforsynet og overlever hvis demo-filen flyttes/slettes).
const comparisonRows: ComparisonRow[] = [
  {
    label: 'Frugt',
    icon: <Circle />,
    left: 'Slanke, aflange frugter',
    right: 'Ovale, bredere frugter',
  },
  {
    label: 'Konsistens',
    icon: <Leaf />,
    left: 'Få kerner og fast frugtkød',
    right: 'Mere kød end San Marzano',
  },
  {
    label: 'Anvendelse',
    icon: <Sprout />,
    left: 'Perfekt til sauce',
    right: 'God til sauce og konservering',
  },
  {
    label: 'Modning',
    icon: <CalendarDays />,
    left: 'Middeltidlig sort',
    right: 'Middeltidlig sort',
  },
]

// Demo-portrætter. San Marzano peger på et eksisterende plantekort.
// Roma peger på placeholder fordi der endnu ikke findes et Roma-asset
// (Codex's demo-data brugte /images/placeholder/tomat-roma-comparison.jpg
// som ikke findes — vi viser canonical placeholder-card.svg i stedet, så
// browseren ikke render broken-image-ikon).
const sanMarzanoPortrait = {
  title: 'San Marzano',
  subtitle: 'Ranketomat',
  imageSrc: '/images/plantekort/tomat-san-marzano.jpg',
  imageAlt: 'San Marzano tomater på planten',
  description:
    'Slanke, aflange frugter med få kerner og fast frugtkød. Perfekt til sauce.',
}

const romaPortrait = {
  title: 'Roma',
  subtitle: 'Ranketomat',
  imageSrc: '/images/ui/placeholder-card.svg',
  imageAlt: 'Placeholder for Roma tomat — asset mangler',
  description:
    'Ovale frugter med mere kød end San Marzano. God til sauce og konservering.',
}

export default function ComparisonPreviewPage() {
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
          Comparison-komponenter
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
          Begge varianter af "Sammenlign med Roma" — tabel og portræt.
          Vurdér læsbarhed, tekst-tæthed og mobile-layout.
        </p>
      </div>

      <ComponentLabel
        eyebrow="01"
        title="GuideComparisonList"
        subtitle="Tabel-stil. Rækker af attribut + venstre/højre værdi. VS-badge i midten."
      />
      <GuideComparisonList
        leftTitle="San Marzano"
        rightTitle="Roma"
        rows={comparisonRows}
        ctaLabel="Se guide til Roma"
      />

      <div className="my-14" />

      <ComponentLabel
        eyebrow="02"
        title="GuideComparisonBadge"
        subtitle="Portræt-stil. To runde fotos + stiplet midterlinje + kort beskrivelse."
      />
      <GuideComparisonBadge
        highlight="God til sauce"
        ctaLabel="Se guide til Roma"
        left={sanMarzanoPortrait}
        right={romaPortrait}
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
