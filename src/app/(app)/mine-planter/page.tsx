import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Sprout } from 'lucide-react'

// TODO: Mine planter-modulet
export default function MinePlanterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Mine planter</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aktive dyrkninger — det du har gang i lige nu.
        </p>
      </div>
      <Card className="p-8">
        <EmptyState
          icon={<Sprout className="h-10 w-10" />}
          title="Mine planter bygges snart"
          description="Plantekort med status, næste opgave, placering og alder. Detaljeside med tidslinje og dyrkningslog."
        />
      </Card>
    </div>
  )
}
