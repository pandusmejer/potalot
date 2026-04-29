import { InventoryListView } from '@/components/froebank/inventory-list'
import { ImportDialog } from '@/components/froebank/import-dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { getAllInventoryItems, getCustomSubcategories } from '@/actions/froebank'

export const dynamic = 'force-dynamic'

export default async function FroebankPage() {
  const [inventory, customSubcategories] = await Promise.all([
    getAllInventoryItems(),
    getCustomSubcategories(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Frøbank</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Alt du har — frø, løg, knolde, buske, træer og stauder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportDialog />
          <Button asChild variant="outline">
            <a href="/api/inventory/export">
              <Download className="h-4 w-4" />
              Eksportér
            </a>
          </Button>
        </div>
      </div>

      <InventoryListView inventory={inventory} customSubcategories={customSubcategories} />
    </div>
  )
}
