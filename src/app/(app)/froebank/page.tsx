import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Package } from 'lucide-react'

// TODO: Frøbank-modulet
export default function FroebankPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Frøbank</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alt du har — frø, løg, knolde, buske, træer, stauder.
        </p>
      </div>
      <Card className="p-8">
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="Frøbank kommer i næste iteration"
          description="Inventar på tværs af 3 niveauer (kategori → underkategori → elementer). Upload af frøposebilleder, manuel oprettelse, filtrering og tilføj til mine planter."
        />
      </Card>
    </div>
  )
}
