import { GuideList } from '@/components/guides/guide-list'
import { PageHero } from '@/components/ui/page-hero'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'
import { getCurrentUser, isCurrentUserAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function GuidesPage() {
  const [guides, inventory, currentUser] = await Promise.all([
    getAllGuides(),
    getAllInventoryItems(),
    getCurrentUser(),
  ])

  const isAdmin = currentUser ? await isCurrentUserAdmin() : false

  const inFroebank = new Set(
    inventory.filter(i => i.guideId).map(i => i.guideId as string)
  )

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Videnslaget"
        title="Dyrkningsguides"
        subtitle="Hvordan og hvorfor — videnslaget bag dine planter."
      />

      <GuideList
        guides={guides}
        inFroebank={inFroebank}
        isAdmin={isAdmin}
        canDeleteOwnGuides={!!currentUser}
      />
    </div>
  )
}
