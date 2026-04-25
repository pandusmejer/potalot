import { InventoryListView } from '@/components/froebank/inventory-list'
import { MOCK_INVENTORY } from '@/lib/mock-data'

// TODO (database): Hent fra Supabase
export default function FroebankPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Frøbank</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alt du har — frø, løg, knolde, buske, træer og stauder.
        </p>
      </div>

      <InventoryListView inventory={MOCK_INVENTORY} />
    </div>
  )
}
