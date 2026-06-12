import { KalenderClient } from '@/components/havekalender/kalender-client'
import { getAllTasks } from '@/actions/havekalender'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'
import { getAllGuides } from '@/actions/guides'
import { getGeneralGardenTasks, getUserGardenTasks } from '@/actions/aarshjul'
import { getGardenAlerts } from '@/actions/weather'
import { getCurrentUser } from '@/lib/auth'
import { pickGardenNote } from '@/lib/garden-notes'
import { aktuelMaaned } from '@/lib/datetime'

export const dynamic = 'force-dynamic'

export default async function KalenderPage() {
  const [tasks, plants, inventory, guides, generalTasks, userTasks, alerts, me] = await Promise.all([
    getAllTasks(),
    getAllPlants(),
    getAllInventoryItems(),
    getAllGuides(),
    getGeneralGardenTasks(),
    getUserGardenTasks(),
    getGardenAlerts(),
    getCurrentUser(),
  ])

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
    />
  )
}
