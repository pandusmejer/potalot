import { KalenderClient } from '@/components/havekalender/kalender-client'
import { getAllTasks } from '@/actions/havekalender'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'
import { getAllGuides } from '@/actions/guides'
import { getGeneralGardenTasks, getUserGardenTasks } from '@/actions/aarshjul'
import { getGardenAlerts } from '@/actions/weather'
import { getTaskCompletionsForDate } from '@/actions/plant-tasks'
import { getCurrentUser } from '@/lib/auth'
import { byggDagensFokus } from '@/lib/kalender/dagens-fokus'
import { resolvePlantCard } from '@/lib/images/resolve-potalot-image'
import { mockPlants } from '@/data/mock-plants'
import { IMPORTED_GUIDES } from '@/data/guides-imported'

export const dynamic = 'force-dynamic'

export default async function KalenderPage() {
  const [tasks, plants, inventory, guides, generalTasks, userTasks, alerts, me, completions] = await Promise.all([
    getAllTasks(),
    getAllPlants(),
    getAllInventoryItems(),
    getAllGuides(),
    getGeneralGardenTasks(),
    getUserGardenTasks(),
    getGardenAlerts(),
    getCurrentUser(),
    getTaskCompletionsForDate(),
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

  // (Den sensoriske stemnings-note vises ikke længere på kalenderen —
  // garden-notes kører fortsat på /froebank og /mine-planter.)

  return (
    <KalenderClient
      tasks={tasks}
      plants={plants}
      inventory={inventory}
      generalTasks={generalTasks}
      userTasks={userTasks}
      guides={guides}
      alerts={alerts}
      isLoggedIn={me !== null}
      dagensFokus={dagensFokus}
      plantImages={plantImages}
    />
  )
}
