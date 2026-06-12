import { getHavebogData } from '@/actions/havebog'
import { HavebogHero } from '@/components/havebog/havebog-hero'
import { KapitelLigeNu } from '@/components/havebog/kapitel-lige-nu'
import { PaaDenneDag } from '@/components/havebog/paa-denne-dag'
import { SaesonensHistorie } from '@/components/havebog/saesonens-historie'
import { Minder } from '@/components/havebog/minder'
import { HistorienFortsaetter } from '@/components/havebog/historien-fortsaetter'
import {
  DEMO_HERO_STATS,
  DEMO_TIDSLINJE,
  DEMO_HERO_NARRATIVE,
  DEMO_KAPITEL_LIGE_NU,
  DEMO_SAESONENS_HISTORIE,
  DEMO_MINDER,
  DEMO_ON_THIS_DAY,
  DEMO_ARCHIVED_PLANTS,
} from '@/data/havebog-demo'

export const dynamic = 'force-dynamic'

/**
 * 📖 HAVEBOG — brugerens personlige dyrkningshistorie.
 *
 * V7 (havebog.md V3): STOP MED AT DESIGNE SEKTIONER. DESIGN EN BOG.
 *
 * Havebogen er den eneste side i Potalot der ikke forsøger at hjælpe
 * brugeren med at gøre noget. Planter hjælper. Kalender hjælper.
 * Frøbank organiserer. Havebogen FORTOLKER.
 *
 * Siden består af kapitler — ikke sektioner. Hvert kapitel har sit
 * eget tempo og sin egen komposition (kapitel-tempo-reglen):
 *
 *   Omslag — hero, fuldbredde foto
 *   Kapitel 1: Lige nu             — tekst venstre, STOR typografi, luft
 *   Kapitel 2: På denne dag        — foto dominerer; ét billede, én historie
 *   Kapitel 3: Sæsonens historie   — centreret tidslinje, stor afstand (vigtigst)
 *   Kapitel 4: Minder              — asymmetrisk højre, kuraterede førster
 *   Kapitel 5: Historien fortsætter— bred, rolig; arkiv + refleksion, ingen CTA
 *
 * Venstre → foto → centreret → højre → bred: brugeren skal føle
 * BEVÆGELSE gennem siden, som at bladre gennem sin sæson.
 *
 * V7 fjernede fra siden: DenneSaeson (kortene var "hvordan går
 * det"-data), SenesteNoter (kortliste = log, og polaroid-empty =
 * kitsch), Historik (måneds-mosaik = datagennemgang; arkivet bor nu
 * stille i Kapitel 5, detail-browsing er en senere arkiv-side).
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
  const kapitelLigeNu = isDemo ? DEMO_KAPITEL_LIGE_NU : data.kapitelLigeNu
  const onThisDay = isDemo ? DEMO_ON_THIS_DAY : data.onThisDay
  const saesonensHistorie = isDemo ? DEMO_SAESONENS_HISTORIE : data.saesonensHistorie
  const minder = isDemo ? DEMO_MINDER : data.minder
  const archivedPlants = isDemo ? DEMO_ARCHIVED_PLANTS : data.archivedPlants

  // Kapitel-luft: meget store luftområder er tilladt og ønskede (V7).
  // Bogens tempo skabes af afstanden mellem kapitlerne — ikke af
  // skillelinjer eller baggrundsskift.
  return (
    <div className="space-y-16 sm:space-y-24 pb-10">
      <HavebogHero stats={heroStats} tidslinje={tidslinje} narrative={heroNarrative} />

      <KapitelLigeNu saetninger={kapitelLigeNu} />

      <PaaDenneDag entries={onThisDay} />

      <SaesonensHistorie maaneder={saesonensHistorie} />

      <Minder minder={minder} />

      <HistorienFortsaetter plants={archivedPlants} />
    </div>
  )
}
