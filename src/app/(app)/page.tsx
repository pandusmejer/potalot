import { getHavebogData } from '@/actions/havebog'
import { HavebogHero } from '@/components/havebog/havebog-hero'
import { PaaDenneDag } from '@/components/havebog/paa-denne-dag'
import { Historik } from '@/components/havebog/historik'
import { SenesteNoter } from '@/components/havebog/seneste-noter'
import { DenneSaeson } from '@/components/havebog/denne-saeson'
import { ArkiverdePlanter } from '@/components/havebog/arkiverede-planter'
import { HaveStemning } from '@/components/havekalender/have-stemning'
import {
  DEMO_HERO_STATS,
  DEMO_TIDSLINJE,
  DEMO_ON_THIS_DAY,
  DEMO_RECENT_NOTES,
  DEMO_HISTORY,
  DEMO_DENNE_SAESON,
  DEMO_ARCHIVED_PLANTS,
} from '@/data/havebog-demo'
import { pickGardenNote } from '@/lib/garden-notes'
import { aktuelMaaned } from '@/lib/datetime'

export const dynamic = 'force-dynamic'

/**
 * 📖 HAVEBOG — brugerens personlige dyrkningshistorie.
 *
 * Formål: huske øjeblikke · dokumentere erfaringer · følge sin udvikling
 * gennem sæsoner · genbesøge tidligere dyrkning · lære af egne erfaringer.
 *
 * IKKE dashboard. IKKE kalender. IKKE planteoversigt. IKKE kontrolcenter.
 *
 * Rolle-fordeling i Potalot:
 *   Frøbank  = ejerskab
 *   Planter  = handling
 *   Kalender = timing
 *   Havebog  = hukommelse   ← her
 *
 * Sektion-rækkefølge (Historik er produktets hjerte og visuelt størst):
 *   1. Hero
 *   2. På denne dag
 *   3. Historik    ← primær
 *   4. Seneste noter
 *   5. Denne sæson
 *   6. Arkiverede planter
 *
 * Demo-fallback: hvis ingen logget-ind bruger, vises lokal demo-data
 * fra src/data/havebog-demo.ts (ikke en global mekanisme).
 */
export default async function HavebogPage() {
  const data = await getHavebogData()
  const isDemo = data === null

  const heroStats = isDemo ? DEMO_HERO_STATS : data.heroStats
  const tidslinje = isDemo ? DEMO_TIDSLINJE : data.tidslinje
  const onThisDay = isDemo ? DEMO_ON_THIS_DAY : data.onThisDay
  const history = isDemo ? DEMO_HISTORY : data.history
  const recentNotes = isDemo ? DEMO_RECENT_NOTES : data.recentNotes
  const denneSaeson = isDemo ? DEMO_DENNE_SAESON : data.denneSaeson
  const archivedPlants = isDemo ? DEMO_ARCHIVED_PLANTS : data.archivedPlants

  // Daglig sensorisk note — beregnes server-side, roterer pr. dag.
  // Offset 14 gør Havebog's note forskellig fra Kalender (offset 0) og
  // Frøbank (offset 7), så de tre sider typisk viser distinkte noter
  // samme dag.
  const gardenNote = pickGardenNote(aktuelMaaned(), { offset: 14 })

  return (
    <div className="space-y-12 sm:space-y-14 pb-6">
      <HavebogHero stats={heroStats} tidslinje={tidslinje} />
      <PaaDenneDag entries={onThisDay} />
      <Historik years={history} />
      {/* Stille åndepause efter den store historik-sektion. */}
      <HaveStemning text={gardenNote} />
      <SenesteNoter notes={recentNotes} />
      <DenneSaeson facts={denneSaeson} />
      <ArkiverdePlanter plants={archivedPlants} />
    </div>
  )
}
