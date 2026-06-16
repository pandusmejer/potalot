'use client'

import { Fragment, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { PlantArtRow, SingleSortRow } from '@/components/mine-planter/plant-art-row'
import { HaveStemning, pickGardenNote } from '@/components/havekalender/have-stemning'
import { ForsideHero } from '@/components/mine-planter/forside-hero'
import { ForsideLigeNu } from '@/components/mine-planter/forside-lige-nu'
import { AtSeTilIDag, type AtSeItem } from '@/components/mine-planter/at-se-til-i-dag'
import { SaesonensVaekst } from '@/components/mine-planter/saesonens-vaekst'
import { MineSteder } from '@/components/mine-planter/mine-steder'
import { PlantEmptyState } from '@/components/mine-planter/plant-empty-state'
import { mockPlants, type MockPlant } from '@/data/mock-plants'
import { overrideFor } from '@/data/plant-detail'
import { afledtStatuslinje } from '@/lib/afledninger'
import { PLANT_STATUS_META } from '@/lib/constants'
import type { Plant, PlantStatus } from '@/lib/types'
import { ArrowRight, BookOpen, Archive } from 'lucide-react'

const sans = 'var(--font-manrope)'

/**
 * Lifecycle-definition (låst af Anna, juni 2026):
 *   PLANLAGT   — besluttet, men intet i jord endnu (chip-række).
 *   AKTIVE     — fysisk i dyrkning: sået → … → høstklar (arts-rækker).
 *   AFSLUTTET  — sæsonen slut, ikke arkiveret ("Klar til arkiv").
 *   ARKIVERET  — tidligere sæsoner (bor i Havebogen).
 *
 * Planter = det levende, jeg skal holde øje med nu.
 */
const GROWING_STATUSES: ReadonlySet<PlantStatus> = new Set([
  'saaet',
  'spirer',
  'i_vaekst',
  'klar_til_udplantning',
  'udplantet',
  'hoestklar',
])

/** Opmærksomheds-rang til hovedperson-/At se til-valg. Lavest = vigtigst. */
function fokusRank(p: Plant): number {
  if (p.status === 'hoestklar') return 0
  if (p.status === 'klar_til_udplantning') return 1
  return 2
}

/** Kort, fremadskuende linje til hovedperson + blobs. */
function forventningFor(p: Plant): string {
  const n = overrideFor(p.guideId)?.naeste
  if (n?.overskrift && n?.timing) return `${n.overskrift} ${n.timing}.`
  // MockPlant har en konkret nextAction; brug den i demo.
  const na = (p as Partial<MockPlant>).nextAction?.action
  if (na) return na
  return afledtStatuslinje(p)?.text ?? PLANT_STATUS_META[p.status].label
}

/** Kort, opgave-orienteret handling til "At se til i dag"-blobs. */
function taskFor(p: Plant): string {
  const na = (p as Partial<MockPlant>).nextAction?.action
  if (na) return na
  return afledtStatuslinje(p)?.text ?? PLANT_STATUS_META[p.status].label
}

/** Tidsbaseret hilsen til forside-heroen. */
function timeGreeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Godmorgen'
  if (h < 18) return 'God eftermiddag'
  return 'God aften'
}

// Sæsonens fortælling (statisk i fase 1 — én rolig linje pr. måned).
// nuMaaned fremhæves. Udledes af sæsonens hændelser senere.
const SAESON_HISTORIK = [
  { maaned: 'Marts', historie: 'De første frø kom i jorden.' },
  { maaned: 'April', historie: 'Spirerne strakte sig mod lyset.' },
  { maaned: 'Maj', historie: 'Drivhuset fyldtes op.' },
  { maaned: 'Juni', historie: 'De første blomster åbnede sig.' },
]
const NU_MAANED = 'Juni'

interface Props {
  /** Brugerens ægte planter. Tomt → demo-mode (mock-data driver siden). */
  plants: Plant[]
}

export function MinePlanterClient({ plants: realPlants }: Props) {
  const isDemo = realPlants.length === 0
  const plants: Plant[] = isDemo ? mockPlants : realPlants

  const { aktive, planlagte, klarTilArkiv } = useMemo(() => {
    const nonArchived = plants.filter(p => !p.isArchived)
    return {
      aktive: nonArchived.filter(p => GROWING_STATUSES.has(p.status)),
      planlagte: nonArchived.filter(p => p.status === 'planlagt'),
      klarTilArkiv: nonArchived.filter(p => p.status === 'afsluttet'),
    }
  }, [plants])

  // Hero-tal: samlet antal levende planter + antal der kræver handling.
  const totalIndivid = useMemo(
    () => aktive.reduce((sum, p) => sum + (p.quantity ?? 0), 0),
    [aktive],
  )
  const attentionCount = useMemo(
    () =>
      aktive.filter(
        p => p.status === 'hoestklar' || p.status === 'klar_til_udplantning',
      ).length,
    [aktive],
  )

  // Hilsen sættes efter mount (klient-tid) for at undgå hydration-mismatch.
  const [greeting, setGreeting] = useState('')
  useEffect(() => setGreeting(timeGreeting()), [])

  // Sansenote mellem de to første arts-scroll (Anna 16/6): en fritsvævende
  // mikropause fra det eksisterende garden-notes-system. Vælges efter mount
  // (pickGardenNote bruger new Date()) for at undgå hydration-mismatch.
  const [sanseNote, setSanseNote] = useState('')
  useEffect(() => {
    setSanseNote(pickGardenNote(new Date().getMonth() + 1, { offset: 5 }))
  }, [])

  // Hero-historie: plantestandens TILSTAND som helhed — ikke én enkelt
  // opgave (Anna 16/6 aften: heroen må ikke blive et høstkort for ét
  // salathoved; den åbner HELE Planter). Rolig kollektiv linje + én
  // stille meta-linje med tal ("46 planter · 3 kræver opmærksomhed").
  const { heroStory, heroNote } = useMemo(() => {
    const heroStory =
      totalIndivid === 1 ? 'Din plante vokser videre.' : 'Dine planter vokser videre.'
    const planteOrd = `${totalIndivid} ${totalIndivid === 1 ? 'plante' : 'planter'}`
    const heroNote =
      attentionCount > 0
        ? `${planteOrd} · ${attentionCount} kræver opmærksomhed`
        : `${planteOrd} vokser lige nu`
    return { heroStory, heroNote }
  }, [attentionCount, totalIndivid])

  // Hovedperson: foretræk en sort med redaktionelt indhold (rig
  // forventning), ellers den mest opmærksomheds-krævende.
  const hovedperson = useMemo(() => {
    if (aktive.length === 0) return null
    return (
      aktive.find(p => overrideFor(p.guideId)) ??
      [...aktive].sort((a, b) => fokusRank(a) - fokusRank(b))[0]
    )
  }, [aktive])

  // At se til i dag: de mest opmærksomheds-krævende planter (op til 3),
  // én pr. art så blob-formerne føles forskellige.
  const atSeItems = useMemo<AtSeItem[]>(() => {
    const sorted = [...aktive].sort((a, b) => fokusRank(a) - fokusRank(b))
    const items: AtSeItem[] = []
    const seenArter = new Set<string>()
    for (const p of sorted) {
      if (fokusRank(p) === 2) break // kun opmærksomheds-værdige
      if (seenArter.has(p.name)) continue
      seenArter.add(p.name)
      items.push({ art: p.name, action: taskFor(p), href: `/mine-planter/${p.id}` })
      if (items.length === 3) break
    }
    return items
  }, [aktive])

  // Arts-rækker: gruppér aktive efter art. Opmærksomheds-arter først,
  // derefter flest planter, derefter alfabetisk.
  const artGroups = useMemo(() => {
    const byArt = new Map<string, Plant[]>()
    for (const plant of aktive) {
      if (!byArt.has(plant.name)) byArt.set(plant.name, [])
      byArt.get(plant.name)!.push(plant)
    }
    const needsAttention = (group: Plant[]) =>
      group.some(p => p.status === 'hoestklar' || p.status === 'klar_til_udplantning')
    return [...byArt.entries()].sort(([nameA, groupA], [nameB, groupB]) => {
      const attA = needsAttention(groupA) ? 0 : 1
      const attB = needsAttention(groupB) ? 0 : 1
      if (attA !== attB) return attA - attB
      if (groupA.length !== groupB.length) return groupB.length - groupA.length
      return nameA.localeCompare(nameB, 'da')
    })
  }, [aktive])

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <ForsideHero greeting={greeting} story={heroStory} storyNote={heroNote} />

      {/* LIGE NU — hovedpersonen (sidens centrum). */}
      {hovedperson && (
        <ForsideLigeNu plant={hovedperson} forventning={forventningFor(hovedperson)} />
      )}

      {/* AT SE TIL I DAG — organiske former. */}
      <AtSeTilIDag items={atSeItems} />

      {/* MINE ARTER — vertikalt arts-scroll, horisontalt sorts-scroll. */}
      <section className="space-y-7">
        {artGroups.length > 0 ? (
          <>
            <h2
              className="uppercase px-0.5"
              style={{
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: 'rgba(36,48,31,0.52)',
                margin: 0,
              }}
            >
              Mine arter
            </h2>
            {/* Arter med 2+ sorter: fuld sektion + horisontal sorts-scroll.
                Mellem de to første scroll-sektioner lægges én fritsvævende
                sansenote — en mikropause i systemet (Anna 16/6). */}
            {artGroups
              .filter(([, g]) => g.length >= 2)
              .map(([artName, group], i, arr) => (
                <Fragment key={artName}>
                  <PlantArtRow artName={artName} plants={group} />
                  {i === 0 && arr.length > 1 && sanseNote && (
                    <HaveStemning text={sanseNote} />
                  )}
                </Fragment>
              ))}
            {/* Arter med 1 sort: én tæt blok af kompakte kort (ingen ceremoni). */}
            {artGroups.some(([, g]) => g.length === 1) && (
              <div className="space-y-2.5">
                {artGroups.filter(([, g]) => g.length === 1).map(([artName, group]) => (
                  <SingleSortRow key={artName} artName={artName} plant={group[0]} />
                ))}
              </div>
            )}
          </>
        ) : (
          <PlantEmptyState />
        )}
      </section>

      {/* MINE STEDER — hvor planterne bor. (Før Sæsonens vækst: steder er
          et vigtigere planter-filter end den editorial sæson-fortælling.) */}
      <MineSteder plants={aktive} />

      {/* SÆSONENS VÆKST — sæsonen som fortælling. */}
      <SaesonensVaekst historik={SAESON_HISTORIK} nuMaaned={NU_MAANED} />

      {/* PLANLAGT — kompakt chip-række. */}
      {planlagte.length > 0 && (
        <section className="space-y-3">
          <header className="flex items-baseline justify-between gap-3 px-0.5">
            <h2
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: 'rgba(36,48,31,0.52)',
                margin: 0,
              }}
            >
              Planlagt
            </h2>
            <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: 'rgba(36,48,31,0.45)', margin: 0 }}>
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
                  <span style={{ fontWeight: 400, color: 'rgba(36,48,31,0.50)' }}>{plant.variety}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* KLAR TIL ARKIV — foreslå Havebogen. */}
      {klarTilArkiv.length > 0 && (
        <section className="space-y-3">
          {/* Diskret: kun eyebrow — sekundær sektion, råber ikke om oprydning. */}
          <header className="px-0.5">
            <h2
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: 'rgba(36,48,31,0.42)',
                margin: 0,
              }}
            >
              Klar til arkiv
            </h2>
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
                  <Archive className="h-4 w-4 shrink-0" style={{ color: 'rgba(36,48,31,0.45)' }} aria-hidden />
                  <span
                    className="truncate"
                    style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: 'rgba(36,48,31,0.72)' }}
                  >
                    {plant.name}
                    {plant.variety ? ` ${plant.variety}` : ''}
                    {plant.growingYear ? ` · ${plant.growingYear}` : ''}
                  </span>
                </span>
                <span className="shrink-0" style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: '#7B816F' }}>
                  Gem i Havebogen →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* TIDLIGERE SÆSONER — bro til Havebogen. */}
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
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full transition-transform active:scale-95"
            style={{ border: '1px solid rgba(36,48,31,0.18)', color: '#24301F', fontFamily: sans, fontSize: 13, fontWeight: 600, padding: '8px 14px' }}
          >
            Åbn havebog
            <ArrowRight className="h-4 w-4" strokeWidth={2} style={{ color: '#5A7038' }} aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  )
}
