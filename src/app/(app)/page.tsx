import { getHavebogData } from '@/actions/havebog'
import { HavebogHero } from '@/components/havebog/havebog-hero'
import { KapitelLigeNu } from '@/components/havebog/kapitel-lige-nu'
import { PaaDenneDag } from '@/components/havebog/paa-denne-dag'
import { Vendepunkter } from '@/components/havebog/vendepunkter'
import { Minder } from '@/components/havebog/minder'
import { HistorienFortsaetter } from '@/components/havebog/historien-fortsaetter'
import {
  DEMO_HERO_STATS,
  DEMO_TIDSLINJE,
  DEMO_HERO_NARRATIVE,
  DEMO_KAPITEL_LIGE_NU,
  DEMO_VENDEPUNKTER,
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
 *   Kapitel 1: Lige nu             — ÉN opdagelse (V8: forfatter, ikke sekretær)
 *   Kapitel 2: På denne dag        — foto dominerer; ét billede, én historie
 *   Kapitel 3: Sæsonens vendepunkter — begivenheder, ikke måneder (vigtigst)
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
  const vendepunkter = isDemo ? DEMO_VENDEPUNKTER : data.vendepunkter
  const minder = isDemo ? DEMO_MINDER : data.minder
  const archivedPlants = isDemo ? DEMO_ARCHIVED_PLANTS : data.archivedPlants

  // Kapitel-luft V8 (luft-balancen): mindre luft MELLEM kapitlerne,
  // mere luft INDE i dem. V7's space-y-16/24 fik siden til at føles
  // både tung og tom på dag 98 — magasin-luft kræver magasin-indhold.
  return (
    <div className="space-y-12 sm:space-y-16 pb-10">
      <HavebogHero
        stats={heroStats}
        tidslinje={tidslinje}
        narrative={heroNarrative}
        fornavn={isDemo ? null : data.fornavn}
      />

      <KapitelLigeNu saetninger={kapitelLigeNu} />

      <PaaDenneDag entries={onThisDay} />

      <Vendepunkter vendepunkter={vendepunkter} />

      <Minder minder={minder} />

      <HistorienFortsaetter plants={archivedPlants} />
    </div>
  )
}
