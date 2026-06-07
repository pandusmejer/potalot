import { getHavebogData } from '@/actions/havebog'
import { HavebogHero } from '@/components/havebog/havebog-hero'
import { NaturenLigeNu } from '@/components/havebog/naturen-lige-nu'
import { PaaDenneDag } from '@/components/havebog/paa-denne-dag'
import { Historik } from '@/components/havebog/historik'
import { SenesteNoter } from '@/components/havebog/seneste-noter'
import { DenneSaeson } from '@/components/havebog/denne-saeson'
import { ArkiverdePlanter } from '@/components/havebog/arkiverede-planter'
import {
  DEMO_HERO_STATS,
  DEMO_TIDSLINJE,
  DEMO_HERO_NARRATIVE,
  DEMO_NATUREN_LIGE_NU,
  DEMO_ON_THIS_DAY,
  DEMO_RECENT_NOTES,
  DEMO_HISTORY,
  DEMO_DENNE_SAESON,
  DEMO_ARCHIVED_PLANTS,
} from '@/data/havebog-demo'

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
 * Sektion-rækkefølge (V3, juni 2026 — magasin-arkitektur):
 *   1. Hero (fuldbredde foto, ~75vh — åbningen i et magasin)
 *   2. Naturen lige nu (3 observationer, botanisk illustration)
 *   3. Denne sæson (forsidehistorie)
 *   4. På denne dag
 *   5. Historik
 *   6. Seneste noter
 *   7. Arkiverede planter
 *
 * V3 vendepunkt (Anna's arkitektur-ordre, juni 2026):
 * Havebog komponeres ikke som software. Den komponeres som
 * redaktionelt indhold. Hver sektion skal have sin egen visuelle
 * rytme — to sektioner i træk med samme creme-baggrund og samme
 * struktur er FORBUDT. Heroen er nu fuldbredde foto, naturen-
 * lige-nu er ikon-streger med botanisk illustration, etc.
 *
 * V2-tankegangen ("DenneSæson er forsidehistorien") gælder stadig —
 * men forsidehistorien er nu *efter* en visuel åbning, ikke selve
 * åbningen.
 *
 * Demo-fallback: hvis ingen logget-ind bruger, vises lokal demo-data
 * fra src/data/havebog-demo.ts (ikke en global mekanisme).
 */
export default async function HavebogPage() {
  const data = await getHavebogData()
  const isDemo = data === null

  const heroStats = isDemo ? DEMO_HERO_STATS : data.heroStats
  const tidslinje = isDemo ? DEMO_TIDSLINJE : data.tidslinje
  const heroNarrative = isDemo ? DEMO_HERO_NARRATIVE : data.heroNarrative
  const naturenLigeNu = isDemo ? DEMO_NATUREN_LIGE_NU : data.naturenLigeNu
  const onThisDay = isDemo ? DEMO_ON_THIS_DAY : data.onThisDay
  const history = isDemo ? DEMO_HISTORY : data.history
  const recentNotes = isDemo ? DEMO_RECENT_NOTES : data.recentNotes
  const denneSaeson = isDemo ? DEMO_DENNE_SAESON : data.denneSaeson
  const archivedPlants = isDemo ? DEMO_ARCHIVED_PLANTS : data.archivedPlants

  // V3.4 (Anna's hierarki-feedback): for erfaren bruger med noter
  // er SenesteNoter sidens egentlige fortælling. Den skal komme FØR
  // Historik når data findes — empty-state-rækkefølge bevares ellers.
  const hasNotes = recentNotes.length > 0

  return (
    <div className="space-y-10 sm:space-y-12 pb-6">
      <HavebogHero stats={heroStats} tidslinje={tidslinje} narrative={heroNarrative} />
      <NaturenLigeNu observations={naturenLigeNu} />
      {/* Forsidehistorie: "hvordan går det med min have?" */}
      <DenneSaeson facts={denneSaeson} varieties={heroStats.varieties} />
      <PaaDenneDag entries={onThisDay} />
      {hasNotes ? (
        <>
          <SenesteNoter notes={recentNotes} prominent />
          <Historik years={history} />
        </>
      ) : (
        <>
          <Historik years={history} />
          <SenesteNoter notes={recentNotes} />
        </>
      )}
      <ArkiverdePlanter plants={archivedPlants} />
    </div>
  )
}
