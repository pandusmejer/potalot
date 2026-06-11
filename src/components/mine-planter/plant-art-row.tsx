'use client'

import Link from 'next/link'
import type { Plant, PlantStatus } from '@/lib/types'
import { PLANT_STATUS_META } from '@/lib/constants'
import { statusColor } from '@/components/mine-planter/plant-card'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'

const sans = 'var(--font-manrope)'

/**
 * 🌱 PLANTER V2 — "Aktive → Art → Sorter"-arkitekturen.
 *
 * Sektion-spørgsmålet (sektion-roller.md): "Hvordan har mine
 * planter det?" — besvares PR. PLANTE, ikke pr. dato.
 *
 * Den gamle side var én uendelig lodret liste af store plantekort.
 * Problemet: alle planter var lige store og lige vigtige, så
 * brugeren kunne ikke finde "min Roma" uden at scrolle forbi alt
 * andet. Det brød sektionens må-aldrig-blive-regel: "en uendelig
 * liste af identiske plantekort".
 *
 * V2-arkitekturen grupperer efter ART:
 *
 *   TOMAT                       2 sorter · 9 planter
 *   [San Marzano] [Sweetie] →   (horisontal scroll)
 *
 *   PEBERFRUGT                  2 sorter · 7 planter
 *   [California Wonder] [Corno di Toro] →
 *
 * Brugeren scanner ned ad arts-listen (kort lodret rejse) og
 * scroller vandret inden for arten. Find-tiden falder fra
 * O(alle planter) til O(arter) + O(sorter i én art).
 *
 * Design-DNA (potalot.md): Planter = pleje/handling = system-følelse.
 * Manrope, tydelig struktur, ingen editorial-stemning. Det er
 * bevidst at denne side IKKE ligner Havebog — fem søskende, ikke
 * fem tvillinger.
 */

interface PlantArtRowProps {
  /** Artens navn — fx "Tomat" */
  artName: string
  /** Alle aktive planter af denne art (allerede filtreret) */
  plants: Plant[]
}

/**
 * Status-prioritet til sortering inden for en art-række.
 * Planter der KRÆVER opmærksomhed (høstklar, klar til udplantning)
 * sorteres først — det er svaret på "hvordan har mine planter det":
 * de her har brug for dig først.
 */
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

export function PlantArtRow({ artName, plants }: PlantArtRowProps) {
  const sorted = [...plants].sort(
    (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status],
  )
  const totalCount = plants.reduce((sum, p) => sum + p.quantity, 0)
  const varietyCount = plants.length
  const needsAttention = plants.some(
    p => p.status === 'hoestklar' || p.status === 'klar_til_udplantning',
  )

  return (
    <section className="space-y-3">
      {/* Art-header: navnet er sektionens anker. Stor, fed, Manrope —
          system-typografi, ikke editorial. Summary-linjen til højre
          giver bestandsoverblik uden at brugeren skal tælle kort. */}
      <header className="flex items-baseline justify-between gap-3 px-0.5">
        <h2
          className="uppercase"
          style={{
            fontFamily: sans,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#24301F',
            margin: 0,
          }}
        >
          {artName}
        </h2>
        <p
          className="flex shrink-0 items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.55)',
            margin: 0,
          }}
        >
          {needsAttention && (
            <span
              aria-label="Kræver opmærksomhed"
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#C89A35',
                flexShrink: 0,
              }}
            />
          )}
          {varietyCount === 1
            ? `${totalCount} ${totalCount === 1 ? 'plante' : 'planter'}`
            : `${varietyCount} sorter · ${totalCount} planter`}
        </p>
      </header>

      {/* Horisontal scroll-række. -mx-4/px-4 lader kortene løbe helt
          til skærmkanten (peek-effekt: næste kort anes), samme mønster
          som din-dyrkning i Kalender. scrollbar-hide + snap. */}
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide">
        <div className="flex snap-x snap-mandatory gap-3" style={{ width: 'max-content' }}>
          {sorted.map(plant => (
            <VarietyCard key={plant.id} plant={plant} />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Kompakt sort-kort til horisontal scroll.
 *
 * Bevidst MINDRE end det store PlantCard (som lever videre på
 * detail-siden). Det her kort skal besvare tre ting på ét blik:
 *   1. Hvilken sort? (navn)
 *   2. Hvordan har den det? (status-dot + label)
 *   3. Hvor mange? (antal-pille)
 * Alt andet hører til på detail-siden.
 *
 * Foto-fallback: hvis ingen foto findes, vises en flad status-farvet
 * blok med sortens forbogstav. "Forkert billede er værre end intet
 * billede" — vi gætter aldrig på et foto fra en anden sort.
 */
function VarietyCard({ plant }: { plant: Plant }) {
  const varietySlug =
    plant.guideId ??
    (plant.variety ? slugify(`${plant.name}-${plant.variety}`) : null)
  const { src: photo } = resolvePotalotImage({
    guideId: plant.guideId,
    varietySlug,
    role: 'plant-card',
    preferredSrc: plant.primaryImageId,
  })
  const isPlaceholder = !photo || photo.includes('placeholder')
  const color = statusColor(plant.status)
  const statusLabel = PLANT_STATUS_META[plant.status].label
  const displayName = plant.variety ?? plant.name

  return (
    <Link
      href={`/mine-planter/${plant.id}`}
      className="group relative block shrink-0 snap-start overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-0.5"
      style={{
        width: 148,
        height: 198,
        borderRadius: 18,
        boxShadow: '0 1px 2px rgba(36,48,31,0.05), 0 8px 22px rgba(36,48,31,0.06)',
        background: '#F5F2EA',
      }}
    >
      {/* Foto-zone — øverste ~64% af kortet */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ height: 126 }}
      >
        {!isPlaceholder ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photo}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          // Foto-løs tilstand: flad status-farvet blok med sortens
          // forbogstav. Ærlig om manglende foto — aldrig et forkert.
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: color }}
          >
            <span
              style={{
                fontFamily: sans,
                fontSize: 44,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Antal-pille top-højre */}
      <span
        className="absolute right-2 top-2 z-10"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          color: '#FFFFFF',
          background: 'rgba(24,30,20,0.55)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          paddingInline: 7,
          paddingBlock: 2,
          borderRadius: 999,
        }}
      >
        ×{plant.quantity}
      </span>

      {/* Bund-panel: sortnavn + status. Varmt papir, samme
          materialsprog som det store PlantCard. */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col justify-center"
        style={{
          height: 72,
          background: 'rgba(245,242,234,0.97)',
          borderTop: '1px solid rgba(36,48,31,0.05)',
          paddingInline: 12,
        }}
      >
        <p
          className="truncate"
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#24301F',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {displayName}
        </p>
        <p
          className="mt-1 flex items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.55)',
            margin: 0,
            marginTop: 4,
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: color,
              flexShrink: 0,
            }}
          />
          <span className="truncate">{statusLabel}</span>
        </p>
      </div>
    </Link>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
