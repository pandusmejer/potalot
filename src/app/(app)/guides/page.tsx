import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { BookOpen } from 'lucide-react'

// TODO: Dyrkningsguides-modulet
export default function GuidesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Dyrkningsguides</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hvordan og hvorfor — videnslaget.
        </p>
      </div>
      <Card className="p-8">
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title="Guides kommer snart"
          description="Art- og sortsguides med hurtigt overblik + detaljerede sektioner. Flora Danica-illustrationer, AI-rådgiver og egne erfaringer."
        />
      </Card>
    </div>
  )
}
