import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Lightbulb } from 'lucide-react'

// TODO: Idétavle-modulet
export default function IdetavlePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Min idétavle</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Langsigtede projekter og inspiration.
        </p>
      </div>
      <Card className="p-8">
        <EmptyState
          icon={<Lightbulb className="h-10 w-10" />}
          title="Idétavle kommer snart"
          description="Pinterest-lignende samling af projekter og inspiration — uden daglige tasks eller notifikationer."
        />
      </Card>
    </div>
  )
}
