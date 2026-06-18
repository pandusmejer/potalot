import { KalenderClient } from '@/components/havekalender/kalender-client'
import { getAllTasks } from '@/actions/havekalender'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'
import { getAllGuides } from '@/actions/guides'
import { getGeneralGardenTasks, getUserGardenTasks } from '@/actions/aarshjul'
import { getGardenAlerts } from '@/actions/weather'
import { getTaskCompletionsForDate } from '@/actions/plant-tasks'
import { getCurrentUser } from '@/lib/auth'
import { pickGardenNote } from '@/lib/garden-notes'
import { aktuelMaaned } from '@/lib/datetime'
import { byggDagensFokus } from '@/lib/kalender/dagens-fokus'
import { mockPlants } from '@/data/mock-plants'

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
  // Demo-præcedens (samme som /mine-planter: "tomt array → mock-plants
  // overtager"): anonyme brugere har ingen ægte planter, så vi fodrer
  // hjernen med demo-planterne, så Dagens fokus' rige tilstand er synlig.
  // canPersist=false sikrer at demo ALDRIG foregiver at gemme afkrydsninger.
  const brainPlants = me === null && plants.length === 0 ? mockPlants : plants
  const dagensFokus = byggDagensFokus({ plants: brainPlants, inventory, guides, alerts, completions, today: new Date() })

  // Daglig sensorisk note — beregnes på serveren (deterministisk pr.
  // dag via pickGardenNote) og sendes som prop, så samme dag = samme
  // note uden hydration-mismatch. Roterer automatisk når datoen skifter.
  const gardenNote = pickGardenNote(aktuelMaaned(), { alerts })

  return (
    <KalenderClient
      tasks={tasks}
      plants={plants}
      inventory={inventory}
      generalTasks={generalTasks}
      userTasks={userTasks}
      guides={guides}
      alerts={alerts}
      gardenNote={gardenNote}
      isLoggedIn={me !== null}
      dagensFokus={dagensFokus}
    />
  )
}
