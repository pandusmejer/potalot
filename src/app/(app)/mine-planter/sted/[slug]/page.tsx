import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SingleSortRow } from '@/components/mine-planter/plant-art-row'
import { getAllPlants } from '@/actions/mine-planter'
import { mockPlants } from '@/data/mock-plants'
import { slugifySted, inferStedType } from '@/lib/steder'
import type { Plant, PlantStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

// Samme aktive-definition som forsiden (Planter = det levende, jeg holder
// øje med nu). Stedkortene bygges af aktive planter, så detaljen matcher.
const GROWING: ReadonlySet<PlantStatus> = new Set([
  'saaet',
  'spirer',
  'i_vaekst',
  'klar_til_udplantning',
  'udplantet',
  'hoestklar',
])

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * 📍 STED-DETAIL — "Planter her".
 *
 * Stedkortene på Planter-forsiden (Dyrkningssteder) linker hertil. Et sted
 * er (endnu) UDLEDT af plant.location, så vi henter alle aktive planter og
 * filtrerer på den slugificerede lokation. Ingen sted-entity, ingen
 * opfundet data — bare et ægte filtreret view af planterne på stedet.
 */
export default async function StedDetailPage({ params }: Props) {
  const { slug } = await params

  // Real-data først; tomt → demo (mock overtager, som på forsiden).
  const real = await getAllPlants()
  const all: Plant[] = real.length ? real : mockPlants
  const plants = all.filter(
    p => !p.isArchived && GROWING.has(p.status) && p.location && slugifySted(p.location) === slug,
  )

  if (plants.length === 0) notFound()

  // Vis det faktiske stednavn fra dataene + status-prioriteret rækkefølge.
  const stedNavn = plants[0].location as string
  const type = inferStedType(stedNavn)
  const antal = plants.reduce((sum, p) => sum + (p.quantity ?? 0), 0)
  const STATUS_PRIORITY: Record<PlantStatus, number> = {
    hoestklar: 0,
    klar_til_udplantning: 1,
    spirer: 2,
    saaet: 3,
    i_vaekst: 4,
    udplantet: 5,
    planlagt: 6,
    afsluttet: 7,
  }
  const sorted = [...plants].sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status])

  return (
    <article className="space-y-6 pb-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/mine-planter">
          <ArrowLeft className="h-4 w-4" />
          Tilbage
        </Link>
      </Button>

      {/* Sted-header: type-kicker + stednavn (serif) + antal. */}
      <header className="px-0.5">
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(36,48,31,0.45)', margin: 0 }}
        >
          {type}
        </p>
        <h1
          style={{ fontFamily: serif, fontSize: 'clamp(30px, 8.5vw, 40px)', fontWeight: 600, lineHeight: 1.02, letterSpacing: '-0.01em', color: '#24301F', margin: '6px 0 0' }}
        >
          {stedNavn}
        </h1>
        <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: 'rgba(36,48,31,0.55)', margin: '8px 0 0' }}>
          {antal} {antal === 1 ? 'plante' : 'planter'}
        </p>
      </header>

      {/* Planter her — samme kompakte rækker som "Flere planter" på forsiden. */}
      <section className="space-y-3">
        <h2
          className="uppercase px-0.5"
          style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.52)', margin: 0 }}
        >
          Planter her
        </h2>
        <div className="space-y-2.5">
          {sorted.map(plant => (
            <SingleSortRow key={plant.id} artName={plant.name} plant={plant} />
          ))}
        </div>
      </section>
    </article>
  )
}
