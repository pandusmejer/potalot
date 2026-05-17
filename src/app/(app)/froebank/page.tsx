import { InventoryListView } from '@/components/froebank/inventory-list'
import { PageHero } from '@/components/ui/page-hero'
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
      <PageHero
        tone="fresh"
        kicker="Din samling"
        title="Frøbank"
        subtitle="Alt du har — frø, løg, knolde, buske, træer og stauder."
        actions={
          <Button asChild variant="outline">
            <a href="/api/inventory/export">
              <Download className="h-4 w-4" />
              Eksportér
            </a>
          </Button>
        }
      />

      <InventoryListView inventory={inventory} customSubcategories={customSubcategories} />
    </div>
  )
}
