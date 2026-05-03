import { GuideList } from '@/components/guides/guide-list'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'

export const dynamic = 'force-dynamic'

export default async function GuidesPage() {
  const [guides, inventory] = await Promise.all([
    getAllGuides(),
    getAllInventoryItems(),
  ])

  const inFroebank = new Set(
    inventory.filter(i => i.guideId).map(i => i.guideId as string)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Dyrkningsguides</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hvordan og hvorfor — videnslaget bag dine planter.
        </p>
      </div>

      <GuideList guides={guides} inFroebank={inFroebank} />
    </div>
  )
}
