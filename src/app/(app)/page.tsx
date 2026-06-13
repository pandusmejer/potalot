import { getHavebogData } from '@/actions/havebog'
import { HavebogHero } from '@/components/havebog/havebog-hero'
import { DagTaeller } from '@/components/havebog/dag-taeller'
import { KapitelLigeNu } from '@/components/havebog/kapitel-lige-nu'
import { PaaDenneDag } from '@/components/havebog/paa-denne-dag'
import { Vendepunkter } from '@/components/havebog/vendepunkter'
import { Minder } from '@/components/havebog/minder'
import { HistorienFortsaetter } from '@/components/havebog/historien-fortsaetter'
import { vaelgLevendeLag } from '@/lib/levende-lag'
import { aktuelMaaned } from '@/lib/datetime'
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
 * 📖 HAVEBOG — havens stue (V9) i to lag (V10).
 *
 * Havebogen er den eneste side i Potalot der ikke forsøger at hjælpe
 * brugeren med at gøre noget. Planter hjælper. Kalender hjælper.
 * Frøbank organiserer. Havebogen FORTOLKER.
 *
 * Strukturen (V10 — magasin, ikke dashboard):
 *
 *   DET FASTE LAG (vises hver gang — Havebogens forside):
 *     Omslag — hero: personlig hilsen + dagtæller + sæsonfoto
 *     I dag i haven — ÉN indsigt, roterer dagligt (V8-opdagelser)
 *
 *   DET LEVENDE LAG (1-2 moduler, kurateret pr. sæson — levende-lag.ts):
 *     På denne dag · Sæsonens vendepunkter · Minder
 *     (+ kommende: Tal til din have, Inspirér mig, Bedrifter,
 *      Fra have til køkken, Dyrkerniveau)
 *
 *   BAGSIDEN (altid):
 *     Historien fortsætter — arkiv + refleksion, ingen CTA
 *
 * Kapitel-tempoet (V7) gælder fortsat for de enkelte moduler;
 * lagene afgør kun HVILKE kapitler dagens side viser. Magasiner
 * viser ikke alle rubrikker på alle sider — de kuraterer.
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

  // Det levende lag — sæsonens 1-2 moduler. Tomme moduler tier
  // selv stille, så kuratering og stilhed komponerer.
  const levendeLag = vaelgLevendeLag(aktuelMaaned())
  const MODULER = {
    paaDenneDag: <PaaDenneDag key="paaDenneDag" entries={onThisDay} />,
    vendepunkter: <Vendepunkter key="vendepunkter" vendepunkter={vendepunkter} />,
    minder: <Minder key="minder" minder={minder} />,
  } as const

  // V13 (premium magasin): dobbelt så meget luft. Hver sektion er
  // sit eget opslag — én ting ad gangen, plads til at trække vejret.
  return (
    <div className="space-y-20 sm:space-y-28 pb-16">
      {/* ── Det faste lag — forsiden ── */}
      {/* Hero: KUN hilsnen */}
      <HavebogHero
        stats={heroStats}
        tidslinje={tidslinje}
        narrative={heroNarrative}
        fornavn={isDemo ? null : data.fornavn}
      />

      {/* Dagtælleren: sin egen sektion, ikke oven på heroen */}
      {heroNarrative.saesonDag !== null && heroNarrative.saesonEtiket && (
        <DagTaeller dag={heroNarrative.saesonDag} etiket={heroNarrative.saesonEtiket} />
      )}

      {/* Dagens indsigt */}
      <KapitelLigeNu saetninger={kapitelLigeNu} />

      {/* ── Det levende lag — sæsonens kuraterede moduler ── */}
      {levendeLag.map(modul => MODULER[modul])}

      {/* ── Bagsiden ── */}
      <HistorienFortsaetter plants={archivedPlants} />
    </div>
  )
}
