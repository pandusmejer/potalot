import { PlantList } from '@/components/mine-planter/plant-list'
import { NewPlantDialog } from '@/components/mine-planter/new-plant-dialog'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllTasks } from '@/actions/havekalender'
import { getAllInventoryItems } from '@/actions/froebank'

export const dynamic = 'force-dynamic'

export default async function MinePlanterPage() {
  const [plants, tasks, inventory] = await Promise.all([
    getAllPlants(),
    getAllTasks(),
    getAllInventoryItems(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Planter</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aktive dyrkninger — det du har gang i lige nu.
          </p>
        </div>
        <NewPlantDialog inventory={inventory} />
      </div>

      <PlantList plants={plants} tasks={tasks} />
    </div>
  )
}
