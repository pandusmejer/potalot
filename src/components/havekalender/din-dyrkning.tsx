'use client'

import Link from 'next/link'
import type { Plant, PlantStatus } from '@/lib/types'
import { STAGE_SHORT_LABEL } from '@/lib/plant-stages'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'

const sans = 'var(--font-manrope)'

/**
 * Demo-planter der vises når brugeren ikke har egne planter.
 * MATCHER seed.sql (samme guideId, navne, sorter). Skifter
 * automatisk til brugerens egen data så snart de tilføjer noget
 * under Mine planter.
 *
 * V4.2: ingen hardcoded primaryImageId — billeder hentes via
 * resolvePotalotImage med guideId som varietySlug.
 */
const DEMO_PLANTS: Plant[] = [
  {
    id: 'demo-plant-tomat-san-marzano',
    userId: 'demo',
    name: 'Tomat',
    variety: 'San Marzano',
    status: 'klar_til_udplantning',
    location: 'Vindueskarm',
    sowDate: '2026-03-15',
    plantingOutDate: null,
    quantity: 6,
    imageIds: [],
    guideId: 'tomat-san-marzano',
    logIds: [],
    isArchived: false,
    createdAt: '2026-03-15T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'demo-plant-sukkeraert',
    userId: 'demo',
    name: 'Ært',
    variety: 'Sugar Snap',
    status: 'spirer',
    location: 'Have, sydbed',
    sowDate: '2026-04-10',
    plantingOutDate: null,
    quantity: 12,
    imageIds: [],
    guideId: 'aert-sugar-snap',
    logIds: [],
    isArchived: false,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
  },
  {
    id: 'demo-plant-chili',
    userId: 'demo',
    name: 'Chili',
    variety: 'Habanero Orange',
    status: 'i_vaekst',
    location: 'Drivhus',
    sowDate: '2026-02-20',
    plantingOutDate: null,
    quantity: 5,
    imageIds: [],
    guideId: 'chili-habanero-orange',
    logIds: [],
    isArchived: false,
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'demo-plant-agurk',
    userId: 'demo',
    name: 'Agurk',
    variety: 'Marketmore',
    status: 'i_vaekst',
    location: 'Drivhus',
    sowDate: '2026-04-10',
    plantingOutDate: null,
    quantity: 14,
    imageIds: [],
    guideId: 'agurk-marketmore',
    logIds: [],
    isArchived: false,
    createdAt: '2026-04-10T00:00:00Z',
    // Nyligt logget → kræver IKKE handling. Demonstrerer at sektionen
    // filtrerer planter der passer sig selv væk.
    updatedAt: '2026-05-26T00:00:00Z',
  },
  {
    id: 'demo-plant-stangboenne',
    userId: 'demo',
    name: 'Stangbønne',
    variety: 'Cobra',
    status: 'spirer',
    location: 'Have, sydbed',
    sowDate: '2026-05-05',
    plantingOutDate: null,
    quantity: 6,
    imageIds: [],
    guideId: 'stangboenne-cobra',
    logIds: [],
    isArchived: false,
    createdAt: '2026-05-05T00:00:00Z',
    updatedAt: '2026-05-12T00:00:00Z',
  },
  {
    id: 'demo-plant-dild',
    userId: 'demo',
    name: 'Dild',
    variety: 'Bouquet',
    // Klar til at klippe de første blade → "Klar til høst".
    status: 'hoestklar',
    location: 'Krydderurte-bed',
    sowDate: '2026-04-15',
    plantingOutDate: null,
    quantity: 8,
    imageIds: [],
    guideId: 'dild-bouquet',
    logIds: [],
    isArchived: false,
    createdAt: '2026-04-15T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'demo-plant-dahlia',
    userId: 'demo',
    name: 'Dahlia',
    variety: 'Café au Lait',
    status: 'planlagt',
    location: null,
    sowDate: null,
    plantingOutDate: null,
    quantity: 3,
    imageIds: [],
    guideId: 'dahlia-cafe-au-lait',
    logIds: [],
    isArchived: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

// ════════════════════════════════════════════════════════════════
// Handlings-logik — "Hvilke af mine planter kræver handling?"
// ════════════════════════════════════════════════════════════════

/** En konkret handling en plante kalder på lige nu. */
interface Aktion {
  label: string
  /** Læsbar mod det mørke bund-overlay. */
  color: string
}

const DAG = 86_400_000

function dageSiden(iso: string | null | undefined): number {
  if (!iso) return Infinity
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return Infinity
  return Math.floor((Date.now() - t) / DAG)
}

/**
 * Afgør om en plante KRÆVER handling lige nu — og hvilken. Returnerer
 * null hvis planten bare passer sig selv (den hører så hjemme på
 * Planter-siden, ikke i kalenderens handlings-strip).
 *
 * Princip: Planter-siden ejer overblikket. Kalenderen ejer handlingen.
 * Rækkefølgen er prioriteret — den mest konkrete handling vinder.
 */
function getPlantAction(plant: Plant): Aktion | null {
  if (plant.isArchived) return null

  // Status-baserede handlinger (uafhængige af dato)
  if (plant.status === 'hoestklar') {
    return { label: 'Klar til høst', color: '#E8C16A' }
  }
  if (plant.status === 'klar_til_udplantning') {
    return { label: 'Skal udplantes', color: '#AED084' }
  }

  // Spire der har stået længe i sin startbakke → trænger til mere plads
  if (plant.status === 'spirer' && dageSiden(plant.sowDate) >= 35) {
    return { label: 'Skal prikles om', color: '#A6C77F' }
  }

  // Aktiv plante uden logning i over 4 uger → blødt skub om at logge
  if (
    (plant.status === 'i_vaekst' || plant.status === 'udplantet') &&
    dageSiden(plant.updatedAt) >= 25
  ) {
    return { label: 'Mangler logning', color: '#DCC79C' }
  }

  return null
}

interface Props {
  plants: Plant[]
  /** Indlogget → aldrig demo-data. Kun anonyme ser DEMO_PLANTS. */
  isLoggedIn: boolean
}

/**
 * "Din dyrkning" — horisontal scroll med KUN de planter der kræver
 * handling i øjeblikket (skal udplantes, skal ompottes, klar til høst,
 * mangler logning). Hvert kort bærer sin handlings-årsag som label.
 *
 * Sektionen er IKKE et galleri over alle planter — Planter-siden ejer
 * det fulde overblik. Her står kun det der kalder på handling nu.
 *
 * Tom-tilstande:
 *   • Har planter, men ingen kræver handling → blød "alt er i ro"-note.
 *   • Ingen planter endnu → invitation til at komme i gang.
 */
export function DinDyrkning({ plants, isLoggedIn }: Props) {
  // Brug brugerens egne planter hvis de har nogen; demo-data er KUN for anonyme
  // (så designet kan vises uden konto). Indlogget + 0 planter → tom-tilstand.
  const userPlanter = plants.filter(p => !p.isArchived)
  const isDemo = !isLoggedIn && userPlanter.length === 0
  const kilde = isDemo ? DEMO_PLANTS : userPlanter

  const handlinger = kilde
    .map(plant => ({ plant, action: getPlantAction(plant) }))
    .filter((x): x is { plant: Plant; action: Aktion } => x.action !== null)
    .slice(0, 8)

  if (handlinger.length === 0) {
    // Har planter, men intet kræver handling → ro, ikke fejl.
    return kilde.length > 0 ? <AltIRoState /> : <EmptyState />
  }

  return (
    <div
      className="din-dyrkning-scroll relative -mx-4 overflow-x-auto scroll-smooth"
      style={{
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <style>{`
        .din-dyrkning-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
      `}</style>
      <div className="flex gap-3 px-4 pb-2">
        {handlinger.map(({ plant, action }) => (
          <div
            key={`plant-${plant.id}`}
            className="shrink-0"
            style={{ width: 168, scrollSnapAlign: 'start' }}
          >
            <MiniPlantCard plant={plant} action={action} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Mini-plantekort — kompakt 3:4 portrait til kalender-scrollen.
 * Foto + navn + sort + vækst-stribe, hvor bund-linjen nu viser
 * plantens HANDLINGS-ÅRSAG ("Skal udplantes" osv.) frem for blot
 * den rå status.
 */
function MiniPlantCard({ plant, action }: { plant: Plant; action: Aktion }) {
  // Canonical resolver med rolle plant-card. preferredSrc validates;
  // hvis null falder den til guide-images eller asset-convention.
  const { src: heroImage, source } = resolvePotalotImage({
    guideId: plant.guideId,
    varietySlug: plant.guideId,
    role: 'plant-card',
    preferredSrc: plant.primaryImageId,
  })
  const showImage = source !== 'fallback'
  return (
    <Link
      href={`/mine-planter/${plant.id}`}
      className="relative block overflow-hidden"
      style={{
        aspectRatio: '3 / 4',
        borderRadius: 20,
        boxShadow: '0 12px 28px rgba(26,34,22,0.14)',
        textDecoration: 'none',
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img loading="lazy" decoding="async"
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: '#A9C28A' }} />
      )}

      <CardTop eyebrow="Plante" title={plant.name} variety={plant.variety} />
      <CardBottom>
        <VaekstLinje
          status={plant.status}
          actionLabel={action.label}
          actionColor={action.color}
        />
      </CardBottom>
    </Link>
  )
}

/** Delt top-overlay: gradient + eyebrow + titel + sort. */
function CardTop({
  eyebrow,
  title,
  variety,
}: {
  eyebrow: string
  title: string
  variety?: string | null
}) {
  return (
    <div
      className="absolute inset-x-0 top-0"
      style={{
        padding: '12px 14px 24px',
        background: 'linear-gradient(180deg, rgba(20,14,8,0.55) 0%, rgba(20,14,8,0) 100%)',
      }}
    >
      <p
        style={{
          fontFamily: sans,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.78)',
          margin: 0,
          textShadow: '0 1px 4px rgba(20,14,8,0.5)',
        }}
      >
        {eyebrow}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: '#fff',
          lineHeight: 1.05,
          margin: 0,
          marginTop: 2,
          textShadow: '0 2px 8px rgba(20,14,8,0.55)',
        }}
      >
        {title}
      </p>
      {variety && (
        <p
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.82)',
            lineHeight: 1.15,
            margin: 0,
            marginTop: 2,
            textShadow: '0 2px 8px rgba(20,14,8,0.5)',
          }}
        >
          {variety}
        </p>
      )}
    </div>
  )
}

/** Delt bund-overlay: gradient + children (status-linje). */
function CardBottom({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0"
      style={{
        padding: '12px 14px 14px',
        background: 'linear-gradient(0deg, rgba(20,14,8,0.62) 0%, rgba(20,14,8,0) 100%)',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Vækst-linje — 5 segmenter der viser plantens stadie. Aktive
 * segmenter helt hvide; kommende dæmpede. Tekst-linjen under viser
 * plantens handlings-årsag ("SKAL UDPLANTES") i sin handlingsfarve.
 */
function VaekstLinje({
  status,
  actionLabel,
  actionColor,
}: {
  status: PlantStatus
  actionLabel?: string
  actionColor?: string
}) {
  // Samme rækkefølge som STAGE_ORDER, uden planlagt/afsluttet (de har ingen
  // vækstlinje). `i_vaekst` er et rigtigt trin — en plante i vækst må aldrig
  // fremstilles som "Spirer". Labels kommer fra den fælles korte tabel.
  const stages: PlantStatus[] = ['saaet', 'spirer', 'i_vaekst', 'klar_til_udplantning', 'udplantet', 'hoestklar']
  const effectiveIdx = stages.indexOf(status)

  const visLabel = actionLabel ?? (effectiveIdx >= 0 ? STAGE_SHORT_LABEL[stages[effectiveIdx]] : null)
  const visColor = actionColor ?? 'rgba(255,255,255,0.88)'

  return (
    <div>
      <div className="flex" style={{ gap: 4 }}>
        {stages.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 999,
              background: i <= effectiveIdx
                ? 'rgba(255,255,255,0.92)'
                : 'rgba(255,255,255,0.28)',
              transition: 'background 200ms ease-out',
            }}
          />
        ))}
      </div>
      {visLabel && (
        <p
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: visColor,
            margin: 0,
            marginTop: 8,
            textTransform: 'uppercase',
            textShadow: '0 1px 4px rgba(20,14,8,0.5)',
          }}
        >
          {visLabel}
        </p>
      )}
    </div>
  )
}

/**
 * "Alt er i ro" — brugeren HAR planter, men ingen kræver handling
 * lige nu. En rolig bekræftelse, ikke et tomt fejlsignal. Peger
 * blødt videre til det fulde overblik på Planter-siden.
 */
function AltIRoState() {
  return (
    <div
      className="rounded-tl-[1.5rem] rounded-br-[1.5rem] rounded-tr-md rounded-bl-md"
      style={{
        padding: '22px 22px 20px',
        background: 'rgba(246,243,235,0.94)',
        border: '1px solid rgba(36,48,31,0.08)',
        boxShadow: '0 8px 24px rgba(36,48,31,0.05)',
      }}
    >
      <p
        style={{
          fontFamily: sans,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: '#24301F',
          margin: 0,
        }}
      >
        Alt er i ro
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.45,
          color: 'rgba(36,48,31,0.62)',
          margin: 0,
          marginTop: 6,
        }}
      >
        Ingen af dine planter kræver handling lige nu. Kig forbi Planter
        for det fulde overblik.
      </p>
      <div className="flex flex-wrap" style={{ gap: 8, marginTop: 14 }}>
        <Link
          href="/mine-planter"
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            background: 'rgba(123,148,96,0.18)',
            color: '#3D5A26',
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Til mine planter
        </Link>
      </div>
    </div>
  )
}

/**
 * Tom-tilstand: nye brugere uden planter. Vises som ÉT blødt papir-kort
 * med invitation til at komme i gang. Skal ikke føles som en advarsel —
 * det er en åbning.
 */
function EmptyState() {
  return (
    <div
      className="rounded-tl-[1.5rem] rounded-br-[1.5rem] rounded-tr-md rounded-bl-md"
      style={{
        padding: '22px 22px 20px',
        background: 'rgba(246,243,235,0.94)',
        border: '1px solid rgba(36,48,31,0.08)',
        boxShadow: '0 8px 24px rgba(36,48,31,0.05)',
      }}
    >
      <p
        style={{
          fontFamily: sans,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: '#24301F',
          margin: 0,
        }}
      >
        Endnu intet i jorden
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.45,
          color: 'rgba(36,48,31,0.62)',
          margin: 0,
          marginTop: 6,
        }}
      >
        Tilføj dine første frø eller planter — så viser kalenderen,
        hvad der kalder på opmærksomhed i din have.
      </p>
      <div className="flex flex-wrap" style={{ gap: 8, marginTop: 14 }}>
        <Link
          href="/froebank"
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            background: 'rgba(123,148,96,0.18)',
            color: '#3D5A26',
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Til Frøbanken
        </Link>
        <Link
          href="/mine-planter"
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            background: 'transparent',
            color: 'rgba(36,48,31,0.55)',
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Til mine planter
        </Link>
      </div>
    </div>
  )
}
