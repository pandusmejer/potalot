import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Settings } from 'lucide-react'

// TODO: Indstillinger-modulet
export default function IndstillingerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Indstillinger</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Profil, notifikationer og brugertype.
        </p>
      </div>
      <Card className="p-8">
        <EmptyState
          icon={<Settings className="h-10 w-10" />}
          title="Indstillinger bygges snart"
        />
      </Card>
    </div>
  )
}
