import { KalenderClient } from '@/components/havekalender/kalender-client'
import { getAllTasks } from '@/actions/havekalender'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'
import { getAllGuides } from '@/actions/guides'
import { GENERAL_GARDEN_TASKS } from '@/lib/curated-data'

export const dynamic = 'force-dynamic'

export default async function KalenderPage() {
  const [tasks, plants, inventory, guides] = await Promise.all([
    getAllTasks(),
    getAllPlants(),
    getAllInventoryItems(),
    getAllGuides(),
  ])

  return (
    <KalenderClient
      tasks={tasks}
      plants={plants}
      inventory={inventory}
      generalTasks={GENERAL_GARDEN_TASKS}
      guides={guides}
    />
  )
}
