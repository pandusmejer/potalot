import { Button } from '@/components/ui/button'
import { PlantList } from '@/components/mine-planter/plant-list'
import { MOCK_PLANTS, MOCK_CALENDAR_TASKS } from '@/lib/mock-data'
import { Plus } from 'lucide-react'
import Link from 'next/link'

// TODO (database): Hent fra Supabase
export default function MinePlanterPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Mine planter</h1>
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

      <PlantList plants={MOCK_PLANTS} tasks={MOCK_CALENDAR_TASKS} />
    </div>
  )
}
