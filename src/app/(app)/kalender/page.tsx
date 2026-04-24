import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarDays } from 'lucide-react'

// TODO: Havekalender-modulet
export default function HavekalenderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Havekalender</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Havens gøremål, det kan du så/plante nu og dine opgaver.
        </p>
      </div>
      <Card className="p-8">
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title="Havekalender kommer snart"
          description="Årshjul, månedsvisning, 3-niveau to-do (i dag / uge / måned), 'det kan du så/plante nu' og automatisk log-forslag ved udført opgave."
        />
      </Card>
    </div>
  )
}
