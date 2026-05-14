import { Button } from '@/components/ui/button'
import { PlantList } from '@/components/mine-planter/plant-list'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllTasks } from '@/actions/havekalender'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MinePlanterPage() {
  const [plants, tasks] = await Promise.all([
    getAllPlants(),
    getAllTasks(),
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
        <Button asChild>
          <Link href="/froebank">
            <Plus className="h-4 w-4" />
            Tilføj plante
          </Link>
        </Button>
      </div>

      <PlantList plants={plants} tasks={tasks} />
    </div>
  )
}
