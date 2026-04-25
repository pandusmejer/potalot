import { GuideList } from '@/components/guides/guide-list'
import { MOCK_GUIDES, MOCK_INVENTORY } from '@/lib/mock-data'

// TODO (database): Hent fra Supabase
export default function GuidesPage() {
  // Find guide-IDs der er linket til brugerens frøbank
  const inFroebank = new Set(
    MOCK_INVENTORY
      .filter(i => i.guideId)
      .map(i => i.guideId as string)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Dyrkningsguides</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hvordan og hvorfor — videnslaget bag dine planter.
        </p>
      </div>

      <GuideList guides={MOCK_GUIDES} inFroebank={inFroebank} />
    </div>
  )
}
