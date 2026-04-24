import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LayoutDashboard } from 'lucide-react'

// TODO: Bygges i næste commit (Overblik-modulet)
export default function OverblikPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Overblik</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dagens vigtigste handlinger — det du skal fokusere på lige nu.
        </p>
      </div>
      <Card className="p-8">
        <EmptyState
          icon={<LayoutDashboard className="h-10 w-10" />}
          title="Overblik bygges næste gang"
          description="Dashboardet kommer til at samle dagens kritiske opgaver, aktive planter, kommende opgaver og sæsonbaseret inspiration."
        />
      </Card>
    </div>
  )
}
