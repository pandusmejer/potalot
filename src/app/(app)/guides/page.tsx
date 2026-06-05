import { GuidesHero } from '@/components/guides/guides-hero'
import { GuidesBibliotek } from '@/components/guides/guides-bibliotek'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'
import {
  ALL_GUIDES,
  DEMO_AI_GUIDE_IDS,
} from '@/data/guides-demo'

export const dynamic = 'force-dynamic'

/**
 * 📖 DYRKNINGSGUIDES — Potalots videnslag.
 *
 * Rolle-fordeling:
 *   Frøbank  = ejerskab
 *   Planter  = handling
 *   Kalender = timing
 *   Havebog  = hukommelse
 *   Guides   = viden                ← her
 *
 * Designprincip: hvis Havebog er et fotoalbum, er Guides en
 * naturhåndbog. Ikke blog, ikke CMS, ikke wiki, ikke artikelarkiv.
 *
 * Layout-rækkefølge (master-spec):
 *   1. Hero
 *   2. Populære emner    ← redaktionelle indgange
 *   3. Potalot-guides    ← standarden, mest visuel vægt
 *   4. Søg + filtrer
 *   5. Egne guides
 *   6. AI-udkast (V1: kun synlig i demo)
 *
 * Trust-systemet er læser-design, ikke admin-funktion. Ordene
 * Master/Mine/Promote/Flag/Clone eksisterer ikke i denne flow.
 *
 * Demo-fallback: hvis brugeren er anonym/ikke har data, vises lokal
 * demo-data fra src/data/guides-demo.ts. Ingen global mekanisme.
 */
export default async function GuidesPage() {
  const [guides, inventory] = await Promise.all([
    getAllGuides(),
    getAllInventoryItems(),
  ])

  // Demo-fallback: ingen guides i DB → vis demo-bibliotek så
  // designvisionen er synlig for nye/anonyme brugere.
  const isDemo = guides.length === 0
  const visibleGuides = isDemo ? ALL_GUIDES : guides
  const aiGuideIds = isDemo ? DEMO_AI_GUIDE_IDS : null

  // "I din frøbank"-markør: hvilke guides matcher en sort i frøbanken
  // (eller — i demo — i den lokale demo-frøbank).
  const inFroebankIds = new Set(
    inventory.filter(i => i.guideId).map(i => i.guideId as string),
  )

  // Lineage-map: for hver afledt guide, hvad hed planten i Potalot-
  // guiden den er baseret på? Bruges til "Baseret på Potalot-guiden om X".
  const parentPlantNameById = new Map<string, string>()
  for (const g of visibleGuides) {
    parentPlantNameById.set(g.id, g.plantName)
  }

  return (
    <div className="space-y-12 sm:space-y-14 pb-6">
      <GuidesHero />
      <GuidesBibliotek
        guides={visibleGuides}
        aiGuideIds={aiGuideIds}
        parentPlantNameById={parentPlantNameById}
        iFroebankIds={inFroebankIds}
      />
    </div>
  )
}
