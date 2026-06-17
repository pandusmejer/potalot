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
import { SamlingPodium } from '@/components/mine-planter/samling-podium'
import { PlantEmptyState } from '@/components/mine-planter/plant-empty-state'
import { mockPlants, type MockPlant } from '@/data/mock-plants'
import { overrideFor } from '@/data/plant-detail'
import { afledtStatuslinje } from '@/lib/afledninger'
import { PLANT_STATUS_META } from '@/lib/constants'
import type { Plant, PlantStatus, GardenLocation } from '@/lib/types'
import { ArrowRight, BookOpen, Archive } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

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

/** Kort, opgave-orienteret handling til "At se til i dag"-kortene. */
function taskFor(p: Plant): string {
  const na = (p as Partial<MockPlant>).nextAction?.action
  if (na) return na
  return afledtStatuslinje(p)?.text ?? PLANT_STATUS_META[p.status].label
}

/**
 * Kort timing-label + prioritet til "At se til i dag". Sektionen skal
 * vise PRIORITEREDE handlinger — ikke tre dekorative noter med samme vægt.
 *   idag    → skal gøres i dag (høstklar)
 *   snart   → kan gøres nu/denne uge (klar, intet afventer)
 *   afventer→ blot relevant i denne fase (venter på vejr e.l.)
 */
const PRIO_RANK: Record<AtSeItem['priority'], number> = { idag: 0, snart: 1, afventer: 2 }
function naarFor(p: Plant): { timing: string; priority: AtSeItem['priority'] } {
  if (p.status === 'hoestklar') return { timing: 'Gør i dag', priority: 'idag' }
  const t = ((p as Partial<MockPlant>).nextAction?.timing ?? '').toLowerCase()
  if (/frost|milde|nætter|vejr|lun|kold/.test(t)) return { timing: 'Afventer vejr', priority: 'afventer' }
  if (/i dag|i morgen/.test(t)) return { timing: 'Gør i dag', priority: 'idag' }
  return { timing: 'Klar nu', priority: 'snart' }
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
  /** Dagens dato (server-tid, YYYY-MM-DD) — så task_keys matcher serveren. */
  today: string
  /** task_keys brugeren har markeret udført i dag (persisteret). */
  doneTaskKeys: string[]
  /** Brugerens oprettede dyrkningssteder (tomt i demo). */
  gardenLocations: GardenLocation[]
}

export function MinePlanterClient({ plants: realPlants, today, doneTaskKeys, gardenLocations }: Props) {
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
  // én pr. art. Hvert kort bærer timing + prioritet, og listen sorteres
  // efter prioritet (gør-i-dag → klar-nu → afventer), så sektionen
  // faktisk viser PRIORITEREDE handlinger.
  const atSeItems = useMemo<AtSeItem[]>(() => {
    const sorted = [...aktive].sort((a, b) => fokusRank(a) - fokusRank(b))
    const items: AtSeItem[] = []
    const seenArter = new Set<string>()
    for (const p of sorted) {
      if (fokusRank(p) === 2) break // kun opmærksomheds-værdige
      if (seenArter.has(p.name)) continue
      seenArter.add(p.name)
      const { timing, priority } = naarFor(p)
      // task_type følger statussen, som er det eneste der gør en plante
      // opmærksomheds-værdig her: høstklar → 'hoest', ellers → 'udplant'.
      const taskType = p.status === 'hoestklar' ? 'hoest' : 'udplant'
      const action = taskFor(p)
      items.push({
        art: p.name,
        action,
        href: `/mine-planter/${p.id}`,
        timing,
        priority,
        plantId: p.id,
        taskType,
        // Deterministisk + datostemplet, så afkrydsningen nulstilles til ny dag.
        taskKey: `${p.id}:${taskType}:${today}`,
        taskTitle: action,
      })
      if (items.length === 3) break
    }
    return items.sort((a, b) => PRIO_RANK[a.priority] - PRIO_RANK[b.priority])
  }, [aktive, today])

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

      {/* AT SE TIL I DAG — organiske former. Persisteres for rigtige brugere;
          i demo er afkrydsning lokal/ikke-gemt (ingen falsk persistens). */}
      <AtSeTilIDag items={atSeItems} initialDone={doneTaskKeys} canPersist={!isDemo} />

      {/* MIN PLANTESAMLING — brugerens levende samling (Anna 16/6 aften:
          "Mine arter" var en datamodel forklædt som overskrift). Tre lag:
          samling → grupper/art → sorter. Artsnavne er KATEGORIER (ikke
          all-caps hovedoverskrifter), så ingen enkelt art tager tronen. */}
      <section>
        {artGroups.length > 0 ? (
          <>
            {/* Niveau 1: SAMLING-PODIUM — editorial herbarium-intro (Anna
                16/6 aften, retningsskift): en samlende ramme, ikke en
                tekstlabel og ikke endnu et kort. */}
            <SamlingPodium planter={totalIndivid} sorter={aktive.length} />

            {/* Niveau 2+3: artsgrupper (2+ sorter) med rigelig luft imellem.
                Mellem de to første scroll-sektioner ligger én fritsvævende
                sansenote — en mikropause i systemet (Anna 16/6). */}
            <div className="space-y-9">
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
              {/* "Flere planter": sorter uden egen artsgruppe — én tæt blok,
                  så ingen enkelt sort sættes på piedestal. */}
              {artGroups.some(([, g]) => g.length === 1) && (
                <div>
                  <h3
                    className="px-0.5"
                    style={{
                      fontFamily: serif,
                      fontSize: 27,
                      fontWeight: 600,
                      letterSpacing: '-0.005em',
                      color: '#24301F',
                      margin: '0 0 14px',
                    }}
                  >
                    Flere planter
                  </h3>
                  <div className="space-y-2.5">
                    {artGroups.filter(([, g]) => g.length === 1).map(([artName, group]) => (
                      <SingleSortRow key={artName} artName={artName} plant={group[0]} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <PlantEmptyState />
        )}
      </section>

      {/* MINE STEDER — hvor planterne bor. (Før Sæsonens vækst: steder er
          et vigtigere planter-filter end den editorial sæson-fortælling.) */}
      <MineSteder plants={aktive} gardenLocations={gardenLocations} canPersist={!isDemo} />

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
            {planlagte.map(plant => {
              // Timing pr. item, så sektionen forklarer HVORNÅR (ægte
              // nextAction.timing — ingen opfundet dato).
              const timing = (plant as Partial<MockPlant>).nextAction?.timing
              return (
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
                  {timing && (
                    <span style={{ fontWeight: 500, color: 'rgba(36,48,31,0.4)' }}>· {timing}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* SÆSONARKIV — én rolig arkivsektion (Anna 17/6): afslut-handlingen
          og indgangen til Havebogen som ENSARTEDE søskende-rækker i én blød
          container m. divider — ikke ét adminfelt + ét feature-banner.
          "Afslut sæson"-navnet droppet (lød som regnskabsår). */}
      <section>
        <h2
          className="uppercase px-0.5"
          style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.5)', margin: '0 0 12px' }}
        >
          Sæsonarkiv
        </h2>
        <div
          style={{ background: '#F5F2EA', border: '1px solid rgba(36,48,31,0.07)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(36,48,31,0.04)' }}
        >
          {/* Afsluttede sæsoner — klar til at gemme i Havebogen. */}
          {klarTilArkiv.map((plant, i) => (
            <Link
              key={plant.id}
              href={`/mine-planter/${plant.id}`}
              className="group flex items-center gap-3 transition-colors active:bg-[rgba(36,48,31,0.04)]"
              style={{ padding: '14px 16px', borderTop: i > 0 ? '1px solid rgba(36,48,31,0.07)' : 'none' }}
            >
              <Archive className="h-[18px] w-[18px] shrink-0" strokeWidth={2} style={{ color: 'rgba(36,48,31,0.45)' }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate" style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: '#24301F' }}>
                  {plant.name}
                  {plant.variety ? ` ${plant.variety}` : ''}
                  {plant.growingYear ? ` · ${plant.growingYear}` : ''}
                </span>
                <span className="block" style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: 'rgba(36,48,31,0.55)', margin: '2px 0 0' }}>
                  Gem i Havebogen
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} style={{ color: '#5A7038' }} aria-hidden />
            </Link>
          ))}

          {/* Indgang til tidligere sæsoner i Havebogen. */}
          <Link
            href="/"
            className="group flex items-center gap-3 transition-colors active:bg-[rgba(36,48,31,0.04)]"
            style={{ padding: '14px 16px', borderTop: klarTilArkiv.length > 0 ? '1px solid rgba(36,48,31,0.07)' : 'none' }}
          >
            <BookOpen className="h-[18px] w-[18px] shrink-0" strokeWidth={2} style={{ color: 'rgba(36,48,31,0.45)' }} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block" style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: '#24301F' }}>
                Tidligere sæsoner
              </span>
              <span className="block" style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, lineHeight: 1.35, color: 'rgba(36,48,31,0.55)', margin: '2px 0 0' }}>
                Arkiverede planter, noter og høsterfaringer
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} style={{ color: '#5A7038' }} aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  )
}
