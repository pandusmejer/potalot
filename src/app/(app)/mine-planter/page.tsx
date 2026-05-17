import { PlantList } from '@/components/mine-planter/plant-list'
import { PageHero } from '@/components/ui/page-hero'
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
      <PageHero
        kicker="I jorden nu"
        title="Planter"
        subtitle="Aktive dyrkninger — det du har gang i lige nu."
        actions={<NewPlantDialog inventory={inventory} />}
      />

      <PlantList plants={plants} tasks={tasks} />
    </div>
  )
}
