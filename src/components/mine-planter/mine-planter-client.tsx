'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlantArtRow } from '@/components/mine-planter/plant-art-row'
import { PlantHero } from '@/components/mine-planter/plant-hero'
import { GreenhouseNow } from '@/components/mine-planter/greenhouse-now'
import { PlantStatusFilter } from '@/components/mine-planter/plant-status-filter'
import { NextPlantActions } from '@/components/mine-planter/next-plant-actions'
import { RecentPlantActivity } from '@/components/mine-planter/recent-plant-activity'
import { PlantEmptyState } from '@/components/mine-planter/plant-empty-state'
import {
  mockPlantActions,
  mockPlantActivities,
  mockPlants,
  plantStatusFilters,
  statusToFilter,
  type PlantFilterStatus,
} from '@/data/mock-plants'
import type { Plant, PlantStatus } from '@/lib/types'
import { ArrowRight, BookOpen, Archive } from 'lucide-react'

const sans = 'var(--font-manrope)'

/**
 * Lifecycle-definition (låst af Anna, juni 2026):
 *
 *   PLANLAGT   — besluttet, men intet er i jord endnu.
 *                Hører tættere på Frøbank/Kalender; vises her som
 *                kompakt chip-række, IKKE som art-rækker.
 *   AKTIVE     — fysisk i dyrkning lige nu:
 *                sået → spirer → i vækst → klar til udplantning
 *                → udplantet → høstklar.
 *                KUN disse får "Art → Sorter"-rækkerne.
 *   AFSLUTTET  — sæsonen er slut, men endnu ikke arkiveret.
 *                Vises som "Klar til arkiv" med forslag om at
 *                gemme i Havebogen. Bliver IKKE stående i Aktive.
 *   ARKIVERET  — tidligere sæsoner. Bor i Havebogen.
 *
 * Reglen: "Aktive" må kun indeholde planter der fysisk er i gang.
 * Ellers bliver det en rodekasse med planer, levende planter og
 * døde planter.
 *
 * Planter = det levende, jeg skal holde øje med nu.
 * Frøbank ejer beholdningen. Kalender ejer timing. Havebog ejer
 * historikken. Planter ejer det, der gror.
 */
const GROWING_STATUSES: ReadonlySet<PlantStatus> = new Set([
  'saaet',
  'spirer',
  'i_vaekst',
  'klar_til_udplantning',
  'udplantet',
  'hoestklar',
])

interface Props {
  /**
   * Brugerens ægte planter. Hvis tomt array → demo-mode (mock-data
   * driver hele siden). Hvis non-empty → real-data path: ægte planter
   * vises, og de mock-baserede "Næste handlinger" + "Senest i haven"
   * skjules (de hører til demo-oplevelsen og har endnu ingen ægte
   * data-kilde for almindelige brugere).
   */
  plants: Plant[]
}

export function MinePlanterClient({ plants: realPlants }: Props) {
  const [activeFilter, setActiveFilter] = useState<PlantFilterStatus>('lige_nu')

  const isDemo = realPlants.length === 0
  // Bemærk: mockPlants extends Plant, så typen er Plant-kompatibel
  // begge veje. Vi kalder den bare "plants" i komponentkroppen.
  const plants: Plant[] = isDemo ? mockPlants : realPlants

  // ── Lifecycle-buckets ─────────────────────────────────────
  const { aktive, planlagte, klarTilArkiv } = useMemo(() => {
    const nonArchived = plants.filter(p => !p.isArchived)
    return {
      aktive: nonArchived.filter(p => GROWING_STATUSES.has(p.status)),
      planlagte: nonArchived.filter(p => p.status === 'planlagt'),
      klarTilArkiv: nonArchived.filter(p => p.status === 'afsluttet'),
    }
  }, [plants])

  // Handlings-chips filtrerer KUN inden for Aktive-bucket'en.
  // "Lige nu" (default) = alle aktive.
  const filteredAktive = useMemo(() => {
    if (activeFilter === 'lige_nu') return aktive
    return aktive.filter(p => statusToFilter(p.status) === activeFilter)
  }, [aktive, activeFilter])

  const varietyCount = useMemo(() => {
    const varieties = new Set(
      aktive.map(plant => `${plant.name}-${plant.variety ?? ''}`),
    )
    return varieties.size
  }, [aktive])

  // V2-arkitektur: "Aktive → Art → Sorter".
  // Gruppér de filtrerede aktive planter efter art (plant.name).
  // Hver art bliver en sektion med horisontal scroll af sort-kort.
  //
  // Art-grupper sorteres: grupper med opmærksomheds-status
  // (høstklar / klar til udplantning) først, derefter flest planter,
  // derefter alfabetisk. Det besvarer "hvordan har mine planter det"
  // i prioriteret rækkefølge: dem der har brug for dig står øverst.
  const artGroups = useMemo(() => {
    const byArt = new Map<string, Plant[]>()
    for (const plant of filteredAktive) {
      const key = plant.name
      if (!byArt.has(key)) byArt.set(key, [])
      byArt.get(key)!.push(plant)
    }
    const needsAttention = (group: Plant[]) =>
      group.some(
        p => p.status === 'hoestklar' || p.status === 'klar_til_udplantning',
      )
    return [...byArt.entries()].sort(([nameA, groupA], [nameB, groupB]) => {
      const attA = needsAttention(groupA) ? 0 : 1
      const attB = needsAttention(groupB) ? 0 : 1
      if (attA !== attB) return attA - attB
      if (groupA.length !== groupB.length) return groupB.length - groupA.length
      return nameA.localeCompare(nameB, 'da')
    })
  }, [filteredAktive])

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <PlantHero activeCount={aktive.length} varietyCount={varietyCount} />

      <GreenhouseNow plants={aktive} />

      <PlantStatusFilter
        filters={plantStatusFilters}
        active={activeFilter}
        onChange={setActiveFilter}
      />

      {/* ── AKTIVE: Art → Sorter ─────────────────────────────── */}
      <section className="space-y-7">
        {artGroups.length > 0 ? (
          artGroups.map(([artName, group]) => (
            <PlantArtRow key={artName} artName={artName} plants={group} />
          ))
        ) : (
          <PlantEmptyState />
        )}
      </section>

      {/* ── PLANLAGT: kompakt chip-række ─────────────────────── */}
      {planlagte.length > 0 && (
        <section className="space-y-3">
          <header className="flex items-baseline justify-between gap-3 px-0.5">
            <h2
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'rgba(36,48,31,0.55)',
                margin: 0,
              }}
            >
              Planlagt
            </h2>
            <p
              style={{
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(36,48,31,0.45)',
                margin: 0,
              }}
            >
              Endnu ikke sået
            </p>
          </header>
          <div className="flex flex-wrap gap-2">
            {planlagte.map(plant => (
              <Link
                key={plant.id}
                href={`/mine-planter/${plant.id}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:bg-[rgba(36,48,31,0.06)]"
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(36,48,31,0.72)',
                  background: 'rgba(36,48,31,0.04)',
                  border: '1px solid rgba(36,48,31,0.10)',
                  borderRadius: 999,
                  paddingInline: 14,
                  paddingBlock: 7,
                }}
              >
                {plant.name}
                {plant.variety && (
                  <span style={{ fontWeight: 400, color: 'rgba(36,48,31,0.50)' }}>
                    {plant.variety}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── KLAR TIL ARKIV: foreslå Havebogen ────────────────── */}
      {klarTilArkiv.length > 0 && (
        <section className="space-y-3">
          <header className="px-0.5">
            <h2
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'rgba(36,48,31,0.55)',
                margin: 0,
              }}
            >
              Klar til arkiv
            </h2>
            <p
              style={{
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: 500,
                color: 'rgba(36,48,31,0.50)',
                margin: 0,
                marginTop: 4,
              }}
            >
              Sæsonen er slut for de her — gem dem i Havebogen.
            </p>
          </header>
          <div className="space-y-2">
            {klarTilArkiv.map(plant => (
              <Link
                key={plant.id}
                href={`/mine-planter/${plant.id}`}
                className="flex items-center justify-between gap-3 transition-colors hover:bg-[rgba(36,48,31,0.04)]"
                style={{
                  background: 'rgba(36,48,31,0.03)',
                  border: '1px dashed rgba(36,48,31,0.14)',
                  borderRadius: 14,
                  paddingInline: 16,
                  paddingBlock: 12,
                }}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Archive
                    className="h-4 w-4 shrink-0"
                    style={{ color: 'rgba(36,48,31,0.45)' }}
                    aria-hidden
                  />
                  <span
                    className="truncate"
                    style={{
                      fontFamily: sans,
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'rgba(36,48,31,0.72)',
                    }}
                  >
                    {plant.name}
                    {plant.variety ? ` ${plant.variety}` : ''}
                    {plant.growingYear ? ` · ${plant.growingYear}` : ''}
                  </span>
                </span>
                <span
                  className="shrink-0"
                  style={{
                    fontFamily: sans,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#7B816F',
                  }}
                >
                  Gem i Havebogen →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mock-drevne demo-sektioner — vises kun i demo-mode, fordi de
          har ingen real-data ækvivalent endnu. Når real users har data
          her, kommer en separat real-data variant. */}
      {isDemo && (
        <>
          <NextPlantActions actions={mockPlantActions} />
          <RecentPlantActivity activities={mockPlantActivities} />
        </>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,var(--surface-2),var(--card))] p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl leading-tight text-foreground">Tidligere sæsoner</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Se arkiverede planter, noter og høsterfaringer.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/">
              Åbn havebog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
