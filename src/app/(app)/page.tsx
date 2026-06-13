import type { ReactNode } from 'react'
import { getHavebogData } from '@/actions/havebog'
import { HavebogHero } from '@/components/havebog/havebog-hero'
import { DagTaeller } from '@/components/havebog/dag-taeller'
import { HavensStemme } from '@/components/havebog/havens-stemme'
import { TalTilDinHave } from '@/components/havebog/tal-til-din-have'
import { InspirerMig } from '@/components/havebog/inspirer-mig'
import { Dyrkerstatus } from '@/components/havebog/dyrkerstatus'
import { Dyrkerkompetencer } from '@/components/havebog/dyrkerkompetencer'
import { PaaDenneDag } from '@/components/havebog/paa-denne-dag'
import { Vendepunkter } from '@/components/havebog/vendepunkter'
import { Minder } from '@/components/havebog/minder'
import { Spisekammer } from '@/components/havebog/spisekammer'
import { PopulaertLigeNu } from '@/components/havebog/populaert-lige-nu'
import { VejretIHaven } from '@/components/havebog/vejret-i-haven'
import { Projekter } from '@/components/havebog/projekter'
import { Bedrifter } from '@/components/havebog/bedrifter'
import { HistorienFortsaetter } from '@/components/havebog/historien-fortsaetter'
import { kurater, type RumId } from '@/lib/havebog-kurator'
import { aktuelMaaned } from '@/lib/datetime'
import {
  DEMO_HERO_STATS,
  DEMO_TIDSLINJE,
  DEMO_HERO_NARRATIVE,
  DEMO_DAGENS_OPSLAG,
  DEMO_VENDEPUNKTER,
  DEMO_MINDER,
  DEMO_ON_THIS_DAY,
  DEMO_ARCHIVED_PLANTS,
  DEMO_TAL_EKSEMPLER,
  DEMO_INSPIRER,
  DEMO_DYRKERSTATUS,
  DEMO_KOMPETENCER,
  DEMO_SPISEKAMMER,
  DEMO_POPULAERT,
  DEMO_VEJR,
  DEMO_PROJEKT,
  DEMO_BEDRIFTER,
} from '@/data/havebog-demo'

export const dynamic = 'force-dynamic'

const MAANED_DA = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

/**
 * 📖 HAVEBOG.
 *
 * V1.0 (13. juni 2026 — Annas "byg hele huset"): for at kunne afgøre
 * hierarkiet (hovedrum? for stort? overflødigt? flyt til Guides/
 * Planter/Kalender?) bygges ALLE 15 rum som første-versioner, uden at
 * optimere rækkefølgen endnu. Det fulde hus vises i DEMO — den flade
 * der evalueres. Rum der kræver eksterne/fællesskabs-kilder (Vejret,
 * Populært) er prototyper og vises KUN i demo, til en ægte kilde
 * lander (ærligheds-reglen: ingen opfundne tal til rigtige brugere).
 *
 * Logget-ind brugere ser fortsat det kuraterede to-lags-layout (V10):
 * forside → ildsted → sæsonens 1-2 moduler → arkiv. De nye prototype-
 * rum kobles til ægte data rum for rum, efterhånden som hierarkiet og
 * datakilderne afgøres.
 */
export default async function HavebogPage() {
  const data = await getHavebogData()
  const isDemo = data === null

  const heroStats = isDemo ? DEMO_HERO_STATS : data.heroStats
  const tidslinje = isDemo ? DEMO_TIDSLINJE : data.tidslinje
  const heroNarrative = isDemo ? DEMO_HERO_NARRATIVE : data.heroNarrative
  const dagensOpslag = isDemo ? DEMO_DAGENS_OPSLAG : data.dagensOpslag
  const onThisDay = isDemo ? DEMO_ON_THIS_DAY : data.onThisDay
  const vendepunkter = isDemo ? DEMO_VENDEPUNKTER : data.vendepunkter
  const minder = isDemo ? DEMO_MINDER : data.minder
  const archivedPlants = isDemo ? DEMO_ARCHIVED_PLANTS : data.archivedPlants

  const nu = new Date()
  const idag = `${nu.getDate()}. ${MAANED_DA[nu.getMonth()]}`

  // Det faste lag — forsiden + ildstedet (vises i begge tilstande).
  const forside = (
    <>
      <HavebogHero
        stats={heroStats}
        tidslinje={tidslinje}
        narrative={heroNarrative}
        fornavn={isDemo ? null : data.fornavn}
      />
      {heroNarrative.saesonDag !== null && heroNarrative.saesonEtiket && (
        <DagTaeller dag={heroNarrative.saesonDag} etiket={heroNarrative.saesonEtiket} />
      )}
      <HavensStemme dato={idag} opslag={dagensOpslag} />
    </>
  )

  // ── DEMO: HELE HUSET (V1.0) — alle 15 rum i Annas rækkefølge ──
  // Uden hierarki-optimering. Formålet er at kunne stå i huset og se
  // det hele, før det afgøres hvad der er centrum og hvad der flyttes.
  if (isDemo) {
    return (
      <div className="space-y-20 sm:space-y-28 pb-16">
        {forside /* 1 + 2 */}
        <TalTilDinHave eksempler={DEMO_TAL_EKSEMPLER} /> {/* 3 */}
        <InspirerMig forslag={DEMO_INSPIRER} /> {/* 4 */}
        <Dyrkerstatus status={DEMO_DYRKERSTATUS} /> {/* 5 */}
        <Dyrkerkompetencer omraader={DEMO_KOMPETENCER} /> {/* 6 */}
        <PaaDenneDag entries={onThisDay} /> {/* 7 */}
        <Minder minder={minder} /> {/* 8 */}
        <Vendepunkter vendepunkter={vendepunkter} /> {/* 9 */}
        <Spisekammer data={DEMO_SPISEKAMMER} /> {/* 10 */}
        <PopulaertLigeNu emner={DEMO_POPULAERT} /> {/* 11 — prototype */}
        <VejretIHaven vejr={DEMO_VEJR} /> {/* 12 — prototype */}
        <Projekter projekt={DEMO_PROJEKT} /> {/* 13 */}
        <Bedrifter bedrifter={DEMO_BEDRIFTER} /> {/* 14 */}
        <HistorienFortsaetter plants={archivedPlants} /> {/* 15 */}
      </div>
    )
  }

  // ── LOGGET IND: kuratoren (V17) — højst 7 rum ──
  // De 3 faste (forside) + højst 4 kuraterede. Kun rum med ÆGTE data
  // kommer i betragtning; prototype-rum uden kilde (Tal, Inspirér,
  // Status, Kompetencer, Spisekammer, Projekter, Bedrifter, Vejret,
  // Populært) er gated false og vises derfor ikke endnu — de tændes
  // ét ad gangen, efterhånden som deres deriver/kilde lander.
  const harData: Partial<Record<RumId, boolean>> = {
    paaDenneDag: onThisDay.length > 0,
    minder: minder.length > 0,
    vendepunkter: vendepunkter.length > 0,
    historienFortsaetter: archivedPlants.length > 0,
  }
  const valgteRum = kurater({ maaned: aktuelMaaned(), harData })

  const RUM_RENDER: Partial<Record<RumId, ReactNode>> = {
    paaDenneDag: <PaaDenneDag entries={onThisDay} />,
    minder: <Minder minder={minder} />,
    vendepunkter: <Vendepunkter vendepunkter={vendepunkter} />,
    historienFortsaetter: <HistorienFortsaetter plants={archivedPlants} />,
  }

  return (
    <div className="space-y-20 sm:space-y-28 pb-16">
      {forside}
      {valgteRum.map(id => <div key={id}>{RUM_RENDER[id]}</div>)}
    </div>
  )
}
