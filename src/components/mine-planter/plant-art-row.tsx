'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Plant, PlantStatus } from '@/lib/types'
import { PLANT_STATUS_META } from '@/lib/constants'
import { statusColor } from '@/components/mine-planter/plant-card'
import { GlyphSpire } from '@/components/icons/potalot-glyphs'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { afledtStatuslinje } from '@/lib/afledninger'

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
    <section className="space-y-3.5">
      {/* Art-header som ÉN enhed (Anna 16/6 aften): artsnavnet er ankeret,
          og meta-linjen sidder direkte under det — ikke svævende i højre
          side. Stor, fed, Manrope — system-typografi, ikke editorial. */}
      <header className="px-0.5">
        <h2
          style={{
            fontFamily: sans,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#24301F',
            margin: 0,
          }}
        >
          {artName}
        </h2>
        <p
          className="flex items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.5)',
            margin: '4px 0 0',
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
  // varietySlug bygges ALTID af navn+sort (ikke guideId). guideId
  // sendes separat og prøves først; men kurateret plantekort/asset-
  // convention er nøglet på sorts-sluggen, så den skal også med.
  const varietySlug = plant.variety
    ? slugify(`${plant.name}-${plant.variety}`)
    : null
  const { src: photo } = resolvePotalotImage({
    guideId: plant.guideId,
    varietySlug,
    role: 'plant-card',
    preferredSrc: plant.primaryImageId,
  })
  const isPlaceholder = !photo || photo.includes('placeholder')
  const color = statusColor(plant.status)
  const displayName = plant.variety ?? plant.name

  // Sprint 1 (afledningsmotoren): vis en FREMADSKUENDE linje når
  // den kan afledes — "Spiring om ~3 dage", "Høst fra ~august",
  // "Sået for 17 dage siden — spiret?" — i stedet for den rå
  // status-label. Falder tilbage til status-label hvis intet kan
  // afledes (stilhed ved datahuller, aldrig advarsler).
  const afledt = afledtStatuslinje(plant)
  const statusLabel = afledt?.text ?? PLANT_STATUS_META[plant.status].label
  const dotColor = afledt?.kind === 'attention' ? '#C89A35' : color

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
        style={{ height: 120 }}
      >
        {!isPlaceholder ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photo}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          // Foto-løs tilstand: rolig botanisk flade + spire-glyph (ikke et
          // stort bogstav — det ligner debug). Samme sprog som no-foto-heroen.
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: 'linear-gradient(158deg, #EBEDE2 0%, #CAD4B6 100%)' }}
          >
            <GlyphSpire size={34} />
          </div>
        )}
      </div>

      {/* Antal-pille top-højre */}
      <span
        className="absolute right-2 top-2 z-10"
        style={{
          fontFamily: sans,
          fontSize: 10,
          fontWeight: 700,
          color: '#FFFFFF',
          background: 'rgba(24,30,20,0.46)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          paddingInline: 6,
          paddingBlock: 1.5,
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
          height: 78,
          background: 'rgba(245,242,234,0.97)',
          borderTop: '1px solid rgba(36,48,31,0.05)',
          paddingInline: 12,
        }}
      >
        <p
          className="line-clamp-2"
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#24301F',
            margin: 0,
            lineHeight: 1.18,
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
            color: 'rgba(36,48,31,0.72)',
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
              background: dotColor,
              flexShrink: 0,
            }}
          />
          <span className="truncate">{statusLabel}</span>
        </p>
      </div>
    </Link>
  )
}

/**
 * SINGLE-SORT-KORT — kompakt række for en art med KUN én sort.
 *
 * Anna (16. juni 2026): single-sort arter må ikke få samme ceremoni + luft
 * som en fuld sektion ("museum for én salat"). I stedet ét tæt vandret kort:
 * foto/placeholder til venstre, sort (helt) + art·antal + status til højre.
 * Grupperes i én tæt blok i Mine arter, så siden ikke fragmenterer.
 */
export function SingleSortRow({ artName, plant }: { artName: string; plant: Plant }) {
  const varietySlug = plant.variety ? slugify(`${plant.name}-${plant.variety}`) : null
  const { src: photo, source } = resolvePotalotImage({
    guideId: plant.guideId,
    varietySlug,
    role: 'plant-card',
    preferredSrc: plant.primaryImageId,
  })
  const hasPhoto = source !== 'fallback'
  const color = statusColor(plant.status)
  const afledt = afledtStatuslinje(plant)
  const statusLabel = afledt?.text ?? PLANT_STATUS_META[plant.status].label
  const dotColor = afledt?.kind === 'attention' ? '#C89A35' : color
  const displayName = plant.variety ?? plant.name
  const count = plant.quantity

  return (
    <Link
      href={`/mine-planter/${plant.id}`}
      className="group flex items-center gap-3.5 transition-transform duration-200 ease-out active:scale-[0.99]"
      style={{ background: '#F5F2EA', border: '1px solid rgba(36,48,31,0.06)', borderRadius: 18, padding: 10, boxShadow: '0 1px 2px rgba(36,48,31,0.05), 0 6px 16px rgba(36,48,31,0.05)' }}
    >
      <span className="relative shrink-0 overflow-hidden" style={{ width: 76, height: 76, borderRadius: 14 }}>
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(158deg, #EBEDE2 0%, #CAD4B6 100%)' }}>
            <GlyphSpire size={30} />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate" style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: '#24301F', lineHeight: 1.15 }}>
          {displayName}
        </span>
        <span className="block" style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: 'rgba(36,48,31,0.5)', margin: '2px 0 0' }}>
          {artName} · {count} {count === 1 ? 'plante' : 'planter'}
        </span>
        <span className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
          <span aria-hidden className="inline-block shrink-0 rounded-full" style={{ width: 7, height: 7, background: dotColor }} />
          <span className="truncate" style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: 'rgba(36,48,31,0.6)' }}>{statusLabel}</span>
        </span>
      </span>

      <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} style={{ color: 'rgba(36,48,31,0.3)' }} aria-hidden />
    </Link>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    // Accent-normalisering (é→e, ñ→n): 'Café au Lait' og 'Jalapeño'
    // skal matche filnavne uden accenter. æøå håndteres FØR NFD,
    // da å ellers dekomponeres til 'a' i stedet for 'aa'.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
