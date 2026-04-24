import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'

// TODO: Mine grupper-modulet
export default function GrupperPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Mine grupper</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fællesskab omkring planter og dyrkning.
        </p>
      </div>
      <Card className="p-8">
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Community bygges senere"
          description="Let og uforpligtende community med gruppeforslag baseret på din frøbank og aktive planter."
        />
      </Card>
    </div>
  )
}
