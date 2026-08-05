import { GuidesHero } from '@/components/guides/guides-hero'
import { GuidesBibliotek } from '@/components/guides/guides-bibliotek'
import { PageIntroNote } from '@/components/ui/page-intro-note'
import { BookOpen } from 'lucide-react'
import { ALL_GUIDES } from '@/data/guides-demo'
import { resolvePotalotMacro, resolvePotalotImage } from '@/lib/images/resolve-potalot-image'

// Statisk bibliotek: samme redaktionelle oplevelse for ALLE (Anna 5/8 —
// demo-fallback-semantikken er fjernet). Personlige sektioner (I DIN HAVE,
// Dine egne guides) hentes klient-side via getGuidesPersona.
export const dynamic = 'force-static'
export const revalidate = 86400

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
export default function GuidesPage() {
  // Det redaktionelle bibliotek — ALL_GUIDES = importerede guides + de få
  // demo-fallbacks for slugs importen ikke dækker endnu (deduperet).
  // Payload-slankning: biblioteket viser KORT; artikel-sektionerne (langt det
  // tungeste felt — før: ~300 kB gzip pr. sideåbning) sendes ikke med.
  const visibleGuides = ALL_GUIDES
  const guidesForClient = visibleGuides.map(g => ({ ...g, sections: [] }))

  // Lineage-map: for hver afledt guide, hvad hed planten i Potalot-
  // guiden den er baseret på? Bruges til "Baseret på Potalot-guiden om X".
  const parentPlantNameById = new Map<string, string>()
  for (const g of visibleGuides) {
    parentPlantNameById.set(g.id, g.plantName)
  }

  // Editorial bro mellem "Begynd her" og "Guides i felten" — én
  // EditorialBleedCard med atmospheric makrofoto (statisk manifest-opslag).
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
          guides={guidesForClient}
          aiGuideIds={null}
          parentPlantNameById={parentPlantNameById}
          mineHaveCards={[]}
          mineHaveTotal={0}
          mineGuides={[]}
          bridgeMacroSrc={bridgeMacro?.src}
          bridgeMacroAlt={bridgeMacro?.alt}
        />
      </div>
    </div>
  )
}
