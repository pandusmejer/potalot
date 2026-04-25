import { InventoryListView } from '@/components/froebank/inventory-list'
import { getAllInventoryItems, getCustomSubcategories } from '@/actions/froebank'

export const dynamic = 'force-dynamic'

export default async function FroebankPage() {
  const [inventory, customSubcategories] = await Promise.all([
    getAllInventoryItems(),
    getCustomSubcategories(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Frøbank</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alt du har — frø, løg, knolde, buske, træer og stauder.
        </p>
      </div>

      <InventoryListView inventory={inventory} customSubcategories={customSubcategories} />
    </div>
  )
}
