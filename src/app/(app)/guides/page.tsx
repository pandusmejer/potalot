import { GuideList } from '@/components/guides/guide-list'
import { MOCK_GUIDES } from '@/lib/mock-data'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'

export const dynamic = 'force-dynamic'

export default async function GuidesPage() {
  const [dbGuides, inventory] = await Promise.all([
    getAllGuides(),
    getAllInventoryItems(),
  ])

  // Vis DB-guides (brugerens egne + AI-genererede) + system mock-guides indtil de
  // også migreres til DB. Dedup på id.
  const seen = new Set(dbGuides.map(g => g.id))
  const all = [...dbGuides, ...MOCK_GUIDES.filter(g => !seen.has(g.id))]

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

      <GuideList guides={all} inFroebank={inFroebank} />
    </div>
  )
}
