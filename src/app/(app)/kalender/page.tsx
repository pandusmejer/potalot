import { Suspense } from 'react'
import { KalenderClient } from '@/components/havekalender/kalender-client'
import { OpgaverMvp } from '@/components/havekalender/opgaver-mvp'
// MVP-toppen genbruger den LÅSTE Havebog-hero 1:1 (månedsfoto, sæsontæller,
// bølge, dato) — ingen kopi, ingen ændring af de låste komponenter.
import { HavebogHero } from '@/components/havebog/havebog-hero'
import { HavebogDateline } from '@/components/havebog/havebog-dateline'
import { getHavebogData } from '@/actions/havebog'
import { DEMO_HERO_NARRATIVE } from '@/data/havebog-demo'
import { MVP_OPGAVER } from '@/lib/mvp-config'
import { aktuelAar, aktuelMaaned, idag } from '@/lib/datetime'
import { PageIntroNote } from '@/components/ui/page-intro-note'
import { CalendarDays } from 'lucide-react'
import { getAllTasks } from '@/actions/havekalender'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'
import { getAllGuides } from '@/actions/guides'
import { getGeneralGardenTasks, getUserGardenTasks } from '@/actions/aarshjul'
import { getGardenAlerts, getVejrPools } from '@/actions/weather'
import { getTaskCompletionsForDate } from '@/actions/plant-tasks'
import { getCurrentUser } from '@/lib/auth'
import { byggDagensFokus } from '@/lib/kalender/dagens-fokus'
import { resolvePlantCard } from '@/lib/images/resolve-potalot-image'
import { byggFroebankForslagPrMaaned } from '@/lib/kalender/froebank-forslag'
import { byggGuideForslagPrMaaned } from '@/lib/kalender/guide-forslag'
import { DEMO_INVENTORY } from '@/lib/demo-inventory'
import { mockPlants } from '@/data/mock-plants'
import { IMPORTED_GUIDES } from '@/data/guides-imported'

export const dynamic = 'force-dynamic'

/**
 * Streaming-skal (koldstart-fix 5/8): siden flusher første byte med det
 * samme, så browseren henter CSS/JS/fonte/billeder PARALLELT med serverens
 * datahentning — i stedet for en hvid fane, til alt er færdigt. Indholdet
 * (uændret markup) streames ind, når dataene lander.
 */
export default function KalenderPage() {
  return (
    <Suspense fallback={null}>
      <KalenderIndhold />
    </Suspense>
  )
}

async function KalenderIndhold() {
  const [tasks, plants, inventory, guides, generalTasks, userTasks, alerts, vejr, me, completions, havebogData] = await Promise.all([
    getAllTasks(),
    getAllPlants(),
    getAllInventoryItems(),
    getAllGuides(),
    getGeneralGardenTasks(),
    getUserGardenTasks(),
    getGardenAlerts(),
    getVejrPools(),
    getCurrentUser(),
    getTaskCompletionsForDate(),
    // Kun MVP-visningen bruger Havebog-heroens sæsontæller (heroNarrative).
    // Den oprindelige kalender henter intet ekstra.
    MVP_OPGAVER.enkelVisning ? getHavebogData() : Promise.resolve(null),
  ])

  // Kalenderens hjerne — dagens 1-3 vigtigste handlinger (lib/kalender/
  // dagens-fokus.ts). Beregnes server-side (ren funktion) og sendes som prop,
  // så guide-data ikke skal i client-bundlen.
  //
  // ┌─ DEMO-AFGRÆNSNING (læs før du ændrer denne linje) ──────────────────┐
  // │ Dette er IKKE normal logik. KUN en anonym/ikke-logget bruger UDEN    │
  // │ egne planter fodres med mockPlants — udelukkende så design-visionen  │
  // │ er synlig for nye/demo-brugere (samme præcedens som /mine-planter:   │
  // │ "tomt array → mock-plants overtager UI'et"). En rigtig, logget-ind   │
  // │ bruger bruger ALTID sine egne data — også når de er tomme (så ser    │
  // │ vedkommende korrekt den ægte stilhed/almanak-tilstand).              │
  // │ Demo må ALDRIG persistere: isLoggedIn=false → canPersist=false i     │
  // │ sektionen, så afkrydsninger aldrig foregiver at være gemt.           │
  // └──────────────────────────────────────────────────────────────────────┘
  const erDemoUdenData = me === null && plants.length === 0
  const brainPlants = erDemoUdenData ? mockPlants : plants
  // Samme demo-afgrænsning for guides: anonyme får getAllGuides()=[], så
  // guide-prioritet og lag 5 ville være inerte. I demo fodres hjernen derfor
  // med IMPORTED_GUIDES (markdown-guides), så prioriteringen er synlig/vurderbar
  // i browseren. KUN demo, ingen persistens — præcis som mockPlants ovenfor.
  const brainGuides = me === null && guides.length === 0 ? IMPORTED_GUIDES : guides
  const dagensFokus = byggDagensFokus({ plants: brainPlants, inventory, guides: brainGuides, alerts, completions, today: new Date() })

  // plantId → ægte foto (server-side via den kanoniske billed-resolver). Bygges
  // fra brainPlants, så nøglerne matcher FokusHandling.plantId (også i demo, hvor
  // hjernen kører på mockPlants). Kun rigtige billeder — fallback/placeholder
  // udelades, så task-cards falder tilbage til ikon-badge når intet foto findes.
  const plantImages: Record<string, string> = {}
  for (const p of brainPlants) {
    const { src, source } = resolvePlantCard({
      guideId: p.guideId, name: p.name, variety: p.variety, preferredSrc: p.primaryImageId,
    })
    if (source !== 'fallback') plantImages[p.id] = src
  }

  // MVP 1.0, fase 3 (mvp-config.ts): Nu / Kommende / Udført i stedet for hele
  // kalenderen. Samme data og samme dagens-fokus som kalenderen — kun
  // visningen er en anden. Kalenderen nedenfor er urørt og bruges, når MVP
  // slås fra. (Inspiration-forslagene herunder bruges ikke af MVP-visningen.)
  if (MVP_OPGAVER.enkelVisning) {
    // ⚠️ ANNA-LÅST (13/7, tag havebog-hero-laast-13-07): toppen af Opgaver er
    // Havebog-heroen genbrugt uændret — månedens foto, sæsontæller (samme
    // narrative som Havebog; ingen tæller før noget er sået), den låste bølge
    // og datolinjen med PRÆCIS samme placering (marginTop -141) som på
    // Havebog. Anonyme ser demo-narrativen, ligesom på Havebog.
    const heroNarrative = havebogData ? havebogData.heroNarrative : DEMO_HERO_NARRATIVE
    return (
      <div className="pb-16">
        <HavebogHero narrative={heroNarrative} />
        <div
          style={{
            marginTop: -141,
            position: 'relative',
            zIndex: 20,
            paddingLeft: 'clamp(12px, 3.5cqw, 16px)',
          }}
        >
          <HavebogDateline />
        </div>
        {/* Selve opgavevisningen starter UNDER bølgen. Datolinjen er løftet
            141px op i heroen (låst), så flowet efter den ligger bag bølgens
            fyld — paddingTop skubber overskriften fri af bølgen. */}
        <div style={{ paddingTop: 108 }}>
          <OpgaverMvp
            tasks={tasks}
            dagensFokus={dagensFokus}
            generalTasks={generalTasks}
            userTasks={userTasks}
            alerts={alerts}
            aktivePlanter={plants
              .filter(p => !p.isArchived)
              .map(p => ({ id: p.id, name: p.name, variety: p.variety }))}
            today={idag()}
            month={aktuelMaaned()}
            year={aktuelAar()}
            canPersist={me !== null}
          />
        </div>
      </div>
    )
  }

  // ── KAL-0110 (Anna 25/8, P1): Inspiration-mappens Frøbank-fane ──────────
  // Fanen viste før TRE HARDKODEDE forårs-kort året rundt ("Giv basilikum
  // varme" i august). Nu bygges den af brugerens EGNE frø, filtreret på
  // måneden FØRST — og viser ét kort, hvis kun ét frø er aktuelt. Aldrig
  // filler. Motoren: src/lib/kalender/froebank-forslag.ts.
  //
  // Samme demo-afgrænsning som /froebank: en anonym bruger uden egne frø
  // ser DEMO_INVENTORY, så designet er synligt — men forslagene er stadig
  // ægte månedsfiltrerede, så demoen aldrig rådgiver på det forkerte tidspunkt.
  const froebankInventory = (me === null && inventory.length === 0) ? DEMO_INVENTORY : inventory
  const froebankForslag = byggFroebankForslagPrMaaned({
    inventory: froebankInventory,
    plants: brainPlants,
  })

  // KAL-0113: Guides-fanen. Fanen lover SÆSON ("Guides til sæsonen lige nu"),
  // så kortene vælges blandt ÆGTE guides med et vindue åbent i måneden —
  // aldrig hardkodede kort. brainGuides bruges, så demo-brugeren ser
  // biblioteket; forslagene er stadig ægte månedsfiltrerede.
  const guideForslag = byggGuideForslagPrMaaned({ guides: brainGuides })

  // (Den sensoriske stemnings-note vises ikke længere på kalenderen —
  // garden-notes kører fortsat på /froebank og /mine-planter.)

  return (
    <>
      <div className="mb-5">
        <PageIntroNote
          id="kalender"
          icon={<CalendarDays className="h-4 w-4" />}
          title="Se hvad der giver mening nu"
          body="Potalot bruger sæson, vejr og dine planter til at foreslå opgaver, når de er relevante."
          hideWhen={userTasks.length > 0}
        />
      </div>
      <KalenderClient
        tasks={tasks}
        plants={plants}
        inventory={inventory}
        generalTasks={generalTasks}
        userTasks={userTasks}
        guides={guides}
        alerts={alerts}
        vejr={vejr}
        isLoggedIn={me !== null}
        dagensFokus={dagensFokus}
        plantImages={plantImages}
        froebankForslag={froebankForslag}
        harFroebank={froebankInventory.length > 0}
        guideForslag={guideForslag}
      />
    </>
  )
}
