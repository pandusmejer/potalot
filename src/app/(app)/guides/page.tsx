import { GuidesHero } from '@/components/guides/guides-hero'
import { GuidesBibliotek } from '@/components/guides/guides-bibliotek'
import { PageIntroNote } from '@/components/ui/page-intro-note'
import { BookOpen } from 'lucide-react'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'
import {
  ALL_GUIDES,
  DEMO_AI_GUIDE_IDS,
} from '@/data/guides-demo'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { resolvePotalotMacro, resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { buildMineHaveGuides, pickForForside } from '@/lib/guides/min-have'

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

  // Brugerens EGNE (private) guides — dem de selv har lavet, klonet eller fået
  // autogenereret. Vises foldet øverst i biblioteket (Anna 16/7), klart adskilt
  // fra det redaktionelle Potalot-lag nedenunder.
  const mineGuides = guides.filter(g => g.visibility === 'private')

  // "I DIN HAVE" — prioriteret udvalg af GUIDE-OBJEKTER (arts- OG sortsguides)
  // beregnet ud fra frøbanken + sæson (lib/guides/min-have). Ikke et artsindeks:
  // findes en kurateret sortsguide til brugerens konkrete sort, vises DEN;
  // ellers artsguiden. Billedet resolves her (server), så carousel-klienten kun
  // får en færdig kort-liste. Maks ét kort pr. art på forsiden; det fulde antal
  // (mineHaveTotal) linker til /guides/min-have.
  const mineHaveAll = buildMineHaveGuides(visibleGuides, inventory, new Date().getMonth() + 1)
  const mineHaveCards = pickForForside(mineHaveAll, 4).map(it => {
    const g = it.guide
    const isVar = it.kind === 'variety'
    const { src } = resolvePotalotImage({
      guideId: g.id,
      speciesSlug: isVar ? g.parentGuideId ?? g.id : g.id,
      varietySlug: isVar ? g.id : null,
      role: isVar ? 'variety-hero' : 'species-hero',
      preferredSrc: g.primaryImageId,
    })
    return {
      guideId: g.id,
      title: isVar ? g.variety ?? g.plantName : g.plantName,
      subtitle: isVar ? `${it.plantName} · Sortsguide` : 'Artsguide',
      imageSrc: src ?? null,
      kind: it.kind,
    }
  })
  const mineHaveTotal = mineHaveAll.length

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
    <div className="relative -mx-4 -mt-6 overflow-hidden bg-[#EAE6D8] px-4 pb-6">
      <style>{`.app-canvas{background-color:#EAE6D8;}`}</style>
      {/* Layered hero field: one macro photo crosses from title area into "Begynd her". */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-42%] right-[-42%] top-0 h-[820px]"
        style={{
          backgroundImage: 'url(/images/makro/guides-hero-baggrund.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.13,
          mixBlendMode: 'multiply',
          // Ingen rotation → ingen skæv diagonal-kant i toppen. Masken er
          // trukket højt op (center 30%) så den grønne tint når helt op til
          // banneren og ikke efterlader en lys creme-stribe.
          maskImage:
            'radial-gradient(ellipse 94% 64% at 50% 34%, black 24%, rgba(0,0,0,0.6) 58%, transparent 90%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 94% 64% at 50% 34%, black 24%, rgba(0,0,0,0.6) 58%, transparent 90%)',
        }}
      />
      <div className="relative z-10 space-y-10 pt-6 sm:space-y-12">
        <GuidesHero />
        <PageIntroNote
          id="guides"
          icon={<BookOpen className="h-4 w-4" />}
          title="Forstå det, du dyrker"
          body="Start med arten, dyk ned i sorter, og gem erfaringer undervejs."
        />
        <GuidesBibliotek
          guides={visibleGuides}
          aiGuideIds={aiGuideIds}
          parentPlantNameById={parentPlantNameById}
          mineHaveCards={mineHaveCards}
          mineHaveTotal={mineHaveTotal}
          mineGuides={mineGuides}
          bridgeMacroSrc={bridgeMacro?.src}
          bridgeMacroAlt={bridgeMacro?.alt}
        />
      </div>
    </div>
  )
}
