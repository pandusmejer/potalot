import { KalenderClient } from '@/components/havekalender/kalender-client'
import { getAllTasks } from '@/actions/havekalender'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'
import { MOCK_GENERAL_TASKS, MOCK_GUIDES } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export default async function KalenderPage() {
  const [tasks, plants, inventory] = await Promise.all([
    getAllTasks(),
    getAllPlants(),
    getAllInventoryItems(),
  ])

  return (
    <KalenderClient
      tasks={tasks}
      plants={plants}
      inventory={inventory}
      generalTasks={MOCK_GENERAL_TASKS}
      guides={MOCK_GUIDES}
    />
  )
}
