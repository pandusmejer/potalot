import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { User } from 'lucide-react'

// TODO: Min profil-modulet
export default function ProfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Min profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Brugertype, profilbillede og personlige præferencer.
        </p>
      </div>
      <Card className="p-8">
        <EmptyState
          icon={<User className="h-10 w-10" />}
          title="Profil-side bygges snart"
        />
      </Card>
    </div>
  )
}
