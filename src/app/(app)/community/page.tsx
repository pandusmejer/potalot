import { Users } from 'lucide-react'

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground">Del og lær fra andre gartnere</p>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-semibold text-foreground">Kommer snart</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Her vil du kunne dele opslag, kommentere og udveksle erfaringer med andre hobbygartnere.
        </p>
      </div>
    </div>
  )
}
