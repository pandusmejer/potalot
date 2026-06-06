/**
 * QA-route: alle guide-komponenter isoleret med label + status.
 *
 * Formål: kirurgisk vurdering. "Den her boks er 12px for høj",
 * "Den her typografi stikker ud", "Den her komponent skal dø i
 * stilhed."
 *
 * Status-skala:
 *   - canonical:    Integreret i live guides og låst i designsystem
 *   - kandidat:     Bygget men endnu ikke integreret
 *   - specialvariant: Sparsom brug, kun til specifikke tilfælde
 *   - deprecated:   Skal udfases (ingen lige nu)
 *
 * URL: /guides/qa/components
 */

import { CalendarDays, Circle, Leaf, Sprout } from 'lucide-react'
import { HeroIdentityStack } from '@/components/guides/hero-identity-stack'
import { GuideHeroEditorial } from '@/components/guides/guide-hero-editorial'
import { LayeredFactBlock } from '@/components/guides/layered-guide'
import {
  BleedFromLeft,
  BleedFromRight,
  BleedBand,
} from '@/components/guides/bleed-blocks'
import { EditorialBleedCard } from '@/components/guides/editorial-bleed-card'
import { VidsteDuMedMakro } from '@/components/guides/vidste-du-med-makro'
import { PotalotTipMedMakro } from '@/components/guides/potalot-tip-med-makro'
import { KalenderRytmeKapitel } from '@/components/guides/kalender-rytme-kapitel'
import {
  GuideComparisonList,
  GuideComparisonBadge,
} from '@/components/guides/guide-comparison'
import { GuideCardEditorial } from '@/components/guides/guide-card-editorial'
import { resolvePotalotMacro } from '@/lib/images/resolve-potalot-image'
import type { Guide } from '@/lib/types'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

type Status = 'canonical' | 'kandidat' | 'specialvariant' | 'deprecated'

const statusColor: Record<Status, string> = {
  canonical: '#7F8F6A',
  kandidat: '#C89A35',
  specialvariant: '#A57A52',
  deprecated: '#B85C46',
}

export default async function QaComponentsPage() {
  // Realistiske makro-data fra tomat-san-marzano sættet
  const noteMacro = resolvePotalotMacro({
    guideId: 'tomat-san-marzano',
    slot: 'qa-note',
    preferredRoles: ['atmosphere'],
  })
  const tipMacro = resolvePotalotMacro({
    guideId: 'tomat-san-marzano',
    slot: 'qa-tip',
    preferredRoles: ['structure', 'detail'],
    avoidSrcs: noteMacro ? new Set([noteMacro.src]) : undefined,
  })

  return (
    <main
      className="overflow-x-clip pb-24 pt-6"
      style={{ background: '#EAE6D8', minHeight: '100dvh' }}
    >
      <PageHeader />

      <ComponentSection
        index="01"
        name="HeroIdentityStack"
        status="kandidat"
        usedIn="Artsguide hero (kandidat)"
        note="Alternativ artshero. To kandidater til canonical (HeroIdentityStack vs GuideHeroEditorial)."
      >
        <HeroIdentityStack
          title="Tomat"
          latinName="Solanum lycopersicum"
          heroImage="/images/arts/tomat.jpg"
          atmosphereImage="/images/makro/tomat/blad-lys.jpg"
          category="Frø"
          difficulty="Middel"
          sun="Sol"
          sowMonths={['Mar', 'Apr']}
          harvestMonths={['Jul', 'Aug', 'Sep']}
          intro="Tomater elsker varme, lys og en lang sæson. Start dem tidligt og giv dem støtte, luft og jævn vanding."
        />
      </ComponentSection>

      <ComponentSection
        index="02"
        name="GuideHeroEditorial"
        status="kandidat"
        usedIn="Artsguide hero (kandidat)"
        note="Magasin-/bog-stil med organic-shape image. Den anden hero-kandidat."
      >
        <GuideHeroEditorial
          badge="Potalot-guide"
          category="Frø"
          title="Tomat"
          subtitle="San Marzano"
          latinName="Solanum lycopersicum"
          tag="Ranketomat"
          imageSrc="/images/plantekort/tomat-san-marzano.jpg"
          imageAlt="San Marzano tomater på planten"
          imageShape="tall-left"
          imageObjectPosition="42% 48%"
          imageScale={1.05}
          description="Klassisk italiensk pastatomat med fast frugtkød og lavt vandindhold. Perfekt til sauce, konservering og lagring."
        />
      </ComponentSection>

      <ComponentSection
        index="03"
        name="LayeredFactBlock"
        status="kandidat"
        usedIn="Faktablok med billedlag (ikke integreret)"
        note="Sammenligning af to typer med atmospheric makro-baggrund. Konkurrerer med GuideFactCard."
      >
        <LayeredFactBlock
          kicker="Sortsvalg"
          title="San Marzano eller salattomat?"
          columns={[
            {
              heading: 'San Marzano',
              items: [
                'Fast frugtkød',
                'Få kerner',
                'Lavt vandindhold',
                'Velegnet til sauce',
              ],
            },
            {
              heading: 'Salattomat',
              items: [
                'Mere saftig',
                'Flere kerner',
                'Højere vandindhold',
                'Frisk og snackklar fra planten',
              ],
            },
          ]}
        />
      </ComponentSection>

      <ComponentSection
        index="04"
        name="BleedFromLeft"
        status="canonical"
        usedIn="Sortsguider — efter prose med strukturel makro"
        note="Foto fader fra venstre. Til struktur/blade/stængler. Maks 3 bleeds pr. sortsguide (R1)."
      >
        <BleedFromLeft
          imageSrc="/images/makro/tomat-san-marzano/klase.jpg"
          alt="Klase af San Marzano-frugter"
        />
      </ComponentSection>

      <ComponentSection
        index="05"
        name="BleedFromRight"
        status="canonical"
        usedIn="Sortsguider — efter prose med frugtrolle"
        note="Foto fader fra højre. Til frugter/blomster/høst."
      >
        <BleedFromRight
          imageSrc="/images/makro/tomat-san-marzano/umodne.jpg"
          alt="Flere umodne San Marzano-frugter"
        />
      </ComponentSection>

      <ComponentSection
        index="06"
        name="BleedBand"
        status="canonical"
        usedIn="Sortsguider — atmosfærisk pause"
        note="Full-bleed bånd med top/bund-fade. Til sanselig overgang."
      >
        <BleedBand
          imageSrc="/images/makro/tomat-san-marzano/blad-dug.jpg"
          alt="Dug på San Marzano-blad"
        />
      </ComponentSection>

      <ComponentSection
        index="07"
        name='EditorialBleedCard variant="left"'
        status="kandidat"
        usedIn="Ikke integreret (preview-only)"
        note="Foto + tekst i samme blok. Løser blok-på-blok-problemet. Konkurrerer med BleedFromLeft."
      >
        <EditorialBleedCard
          eyebrow="Guidetype"
          title="Planteguide"
          description="Primært tekst med makrodetaljer, der bryder layoutet."
          ctaLabel="Vidensdybde"
          ctaHref="#"
          imageSrc="/images/plantekort/tomat-san-marzano.jpg"
          imageAlt="San Marzano tomater på planten"
          variant="left"
          objectPosition="34% 48%"
          imageScale={1.08}
        />
      </ComponentSection>

      <ComponentSection
        index="08"
        name='EditorialBleedCard variant="right"'
        status="kandidat"
        usedIn="Ikke integreret (preview-only)"
        note="Spejlbillede af 07. Tekst venstre, foto højre."
      >
        <EditorialBleedCard
          eyebrow="Sortsvalg"
          title="Tættere på sorten"
          description="Makrofotoet ligger som materiale bag teksten, ikke som et separat billede."
          ctaLabel="Se sorten"
          ctaHref="#"
          imageSrc="/images/makro/agurk/blad.jpg"
          imageAlt="Makro af agurkblad"
          variant="right"
          objectPosition="58% 50%"
          imageScale={1.16}
        />
      </ComponentSection>

      <ComponentSection
        index="09"
        name='EditorialBleedCard variant="band"'
        status="kandidat"
        usedIn="Ikke integreret (preview-only)"
        note="Full-bleed top-foto. Egner sig sandsynligvis bedst til guides landing."
      >
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
      </ComponentSection>

      <ComponentSection
        index="10"
        name="VidsteDuMedMakro"
        status="canonical"
        usedIn="Sortsguider — signatur 1/3 efter prose-flow"
        note="Maks 1 pr. guide (R4). Atmosfærisk makro-baggrund."
      >
        <VidsteDuMedMakro macroImage={noteMacro} intensity="soft">
          San Marzano har fast frugtkød og lavt vandindhold, hvilket gør sorten
          særlig velegnet til sauce og konservering.
        </VidsteDuMedMakro>
      </ComponentSection>

      <ComponentSection
        index="11"
        name="PotalotTipMedMakro"
        status="canonical"
        usedIn="Sortsguider — signatur 2/3, sidste praktiske råd"
        note="Maks 1 pr. guide (R4). Strukturel makro-baggrund."
      >
        <PotalotTipMedMakro macroImage={tipMacro}>
          Vand dybt og regelmæssigt frem for lidt hver dag. San Marzano
          kvitterer for jævn fugt med færre revner og mere koncentreret smag.
        </PotalotTipMedMakro>
      </ComponentSection>

      <ComponentSection
        index="12"
        name="KalenderRytmeKapitel"
        status="canonical"
        usedIn="Alle guides med calendarRules — efter prose"
        note="3 sæsonkapitler. Erstatter de gamle 7 CRM-bokse."
      >
        <KalenderRytmeKapitel
          chapters={[
            {
              title: 'Start sæsonen',
              monthRange: 'JAN-MAR',
              description:
                'Planlæg varme, lys og en rolig start, før planterne får fart på.',
              actions: ['Forspir tomater indendørs'],
            },
            {
              title: 'Ud i vækst',
              monthRange: 'APR-JUN',
              description:
                'Plant ud, når jorden er lun, og hold planterne i jævn vækst.',
              actions: [
                'Prikl tomatplanter om',
                'Plant tomater ud',
                'Knib sideskud på ranketomater',
              ],
            },
            {
              title: 'Høst og vedligehold',
              monthRange: 'JUL-OKT',
              description:
                'Hold rytmen jævn med vand og løbende høst gennem sæsonen.',
              actions: ['Høst tomater løbende'],
            },
          ]}
        />
      </ComponentSection>

      <ComponentSection
        index="13"
        name="GuideComparisonList"
        status="canonical"
        usedIn='Sortsguidens "Sammenlign med"-blok (standard)'
        note="Tabel med attribut-rækker. Beslutningsblok, ikke tilbageblik. CTA disables hvis target mangler."
      >
        <GuideComparisonList
          leftTitle="San Marzano"
          rightTitle="Roma"
          rows={[
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
          ]}
          ctaLabel="Se guide til Roma"
          ctaDisabled
        />
      </ComponentSection>

      <ComponentSection
        index="14"
        name="GuideComparisonBadge"
        status="specialvariant"
        usedIn="Redaktionelle anbefalinger (specialvariant)"
        note='Højst sparsom brug. Kun til ét klart udsagn: "God til sauce", "Bedst til drivhus" osv.'
      >
        <GuideComparisonBadge
          highlight="God til sauce"
          ctaLabel="Se guide til Roma"
          left={{
            title: 'San Marzano',
            subtitle: 'Ranketomat',
            imageSrc: '/images/plantekort/tomat-san-marzano.jpg',
            imageAlt: 'San Marzano tomater på planten',
            description:
              'Slanke, aflange frugter med få kerner og fast frugtkød. Perfekt til sauce.',
          }}
          right={{
            title: 'Roma',
            subtitle: 'Ranketomat',
            imageSrc: '/images/ui/placeholder-card.svg',
            imageAlt: 'Placeholder for Roma tomat',
            description:
              'Ovale frugter med mere kød end San Marzano. God til sauce og konservering.',
          }}
        />
      </ComponentSection>

      <ComponentSection
        index="15"
        name="GuideCardEditorial · art"
        status="canonical"
        usedIn="Guides landing — Begynd her-grid + bibliotek"
        note="Stort billede + arts-navn. Bruger speciesHero-rolle."
      >
        <div className="mx-6">
          <GuideCardEditorial
            kind="potalot"
            size="standard"
            guide={mockArtGuide}
          />
        </div>
      </ComponentSection>

      <ComponentSection
        index="16"
        name="GuideCardEditorial · variety"
        status="canonical"
        usedIn="Guides landing — sortsguider-listen"
        note="Indrykket, mere papiragtig overlapning. Bruger varietyHero-rolle."
      >
        <div className="mx-6">
          <GuideCardEditorial
            kind="potalot"
            size="standard"
            guide={mockVarietyGuide}
          />
        </div>
      </ComponentSection>
    </main>
  )
}

// ─── Layout-helpers ────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="mx-6 mb-10 max-w-[440px]">
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
        QA · komponentkatalog
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
        Guide-komponenter
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
        Hver komponent isoleret med status og brugs-kontekst. Brug denne
        side til kirurgisk vurdering — "den her boks er 12 px for høj",
        "den her typografi stikker ud".
      </p>
    </div>
  )
}

function ComponentSection({
  index,
  name,
  status,
  usedIn,
  note,
  children,
}: {
  index: string
  name: string
  status: Status
  usedIn: string
  note: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-16">
      <div className="mx-6 mb-4 max-w-[440px]">
        <div className="flex items-baseline gap-2 flex-wrap">
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
            {index} · {name}
          </p>
          <StatusPill status={status} />
        </div>
        <p
          className="mt-2"
          style={{
            color: 'rgba(36,48,31,0.78)',
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          Bruges: {usedIn}
        </p>
        <p
          className="mt-1 max-w-[42ch]"
          style={{
            color: 'rgba(36,48,31,0.62)',
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.45,
            margin: 0,
          }}
        >
          {note}
        </p>
      </div>
      {children}
    </section>
  )
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 uppercase"
      style={{
        background: `${statusColor[status]}1F`,
        color: statusColor[status],
        fontFamily: sans,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.12em',
        lineHeight: 1.4,
      }}
    >
      {status}
    </span>
  )
}

// ─── Mock-guides til GuideCardEditorial ─────────────────────────────

const mockArtGuide: Guide = {
  id: 'tomat',
  plantName: 'Tomat',
  variety: null,
  latinName: 'Solanum lycopersicum',
  summary:
    'Tomater elsker varme, lys og en lang sæson. Start dem tidligt og giv dem støtte.',
  guideLevel: 'species',
  parentGuideId: null,
  primaryCategoryId: 'fro',
  primaryImageId: '/images/arts/tomat.jpg',
  tags: [],
  difficulty: 'medium',
  quickFacts: {
    sowingMonths: [3, 4],
    directSowingMonths: [],
    plantingOutMonths: [5, 6],
    harvestMonths: [7, 8, 9],
    preCultivation: true,
    light: 'full_sun',
    water: 'regular',
  },
  sections: [],
  calendarRules: [],
  mediaIds: [],
  sourceLinks: [],
  status: 'published',
  visibility: 'public',
  reviewStatus: 'approved',
  createdAt: '',
  updatedAt: '',
}

const mockVarietyGuide: Guide = {
  ...mockArtGuide,
  id: 'tomat-san-marzano',
  plantName: 'Tomat',
  variety: 'San Marzano',
  latinName: "Solanum lycopersicum 'San Marzano'",
  summary:
    'Klassisk italiensk pastatomat med fast frugtkød og lavt vandindhold. Perfekt til sauce og konservering.',
  guideLevel: 'variety',
  parentGuideId: 'tomat',
  primaryImageId: '/images/plantekort/tomat-san-marzano.jpg',
}
