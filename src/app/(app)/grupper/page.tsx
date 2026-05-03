import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function GrupperPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Mine grupper</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Let community om planter du selv dyrker.
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-secondary/40 flex items-center justify-center mx-auto">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <p className="font-serif text-xl text-foreground">Kommer snart</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Grupper er under udvikling. Du vil snart kunne dele tips og erfaringer med
            andre der dyrker samme planter.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
