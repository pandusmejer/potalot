import { GuidesHero } from '@/components/guides/guides-hero'
import { GuidesBibliotek } from '@/components/guides/guides-bibliotek'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'
import {
  ALL_GUIDES,
  DEMO_AI_GUIDE_IDS,
} from '@/data/guides-demo'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { resolvePotalotMacro } from '@/lib/images/resolve-potalot-image'

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
 *   4. Søg
 *
 * Biblioteket viser KUN redaktionelle guides. Egne guider og AI-udkast
 * vises ikke her — de åbnes fra det konkrete frø/plante/notifikation.
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

  // Oprydning (vidensmodel — rollefordeling): /guides ER biblioteket og
  // viser KUN redaktionelle MD-guides (IMPORTED_GUIDES fra content/guides/
  // *.md). AI-udkast og bruger-guider hører til arbejdsrummet — de åbnes
  // fra det konkrete frø/plante/notifikation, IKKE her. Derfor flettes
  // database-guides ikke ind i biblioteket. I demo vises demo-bibliotekets
  // redaktionelle lag (bibliotek-komponenten render kun 'potalot'-kind).
  const isDemo = guides.length === 0
  const visibleGuides = isDemo ? ALL_GUIDES : IMPORTED_GUIDES
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

  // Editorial bro mellem "Begynd her" og "Guides i felten" — én
  // EditorialBleedCard med atmospheric makrofoto. Resolved server-side
  // så client-component kan vise billed-stien uden at kalde resolveren
  // selv. Tomat valgt fordi sættet har den mest udbyggede atmosphere-
  // pool (2 makros: blad-lys, kondens). Returnerer null hvis ingen
  // makro kunne findes → broen skjules helt i client-laget.
  const bridgeMacro = resolvePotalotMacro({
    guideId: 'tomat',
    slot: 'landing-bridge',
    preferredRoles: ['atmosphere'],
  })

  return (
    <div className="relative -mx-4 overflow-hidden bg-[#EAE6D8] px-4 pb-6">
      <style>{`.app-canvas{background-color:#EAE6D8;}`}</style>
      {/* Layered hero field: one macro photo crosses from title area into "Begynd her". */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-42%] right-[-42%] top-[150px] h-[360px]"
        style={{
          backgroundImage: 'url(/images/makro/chili-habanero-orange/frugter.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
          mixBlendMode: 'multiply',
          transform: 'rotate(-2deg)',
          maskImage:
            'radial-gradient(ellipse 70% 54% at 50% 42%, black 16%, rgba(0,0,0,0.72) 45%, transparent 86%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 54% at 50% 42%, black 16%, rgba(0,0,0,0.72) 45%, transparent 86%)',
        }}
      />
      <div className="relative z-10 space-y-10 sm:space-y-12">
        <GuidesHero />
        <GuidesBibliotek
          guides={visibleGuides}
          aiGuideIds={aiGuideIds}
          parentPlantNameById={parentPlantNameById}
          iFroebankIds={inFroebankIds}
          bridgeMacroSrc={bridgeMacro?.src}
          bridgeMacroAlt={bridgeMacro?.alt}
        />
      </div>
    </div>
  )
}
