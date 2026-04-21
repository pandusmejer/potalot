import { Card } from '@/components/ui/card'
import { Sprout, Wheat } from 'lucide-react'

/**
 * Blid gamification — ikke streaks eller badges, bare visuel fremgang.
 * Viser aktive planter + sæsonens høst.
 */
export function Fremgang({
  aktivePlanter,
  hoestetIkor,
}: {
  aktivePlanter: number
  hoestetIkor: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-gradient-to-br from-green-50 to-card border-green-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Sprout className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <p className="text-xl font-serif text-foreground">{aktivePlanter}</p>
            <p className="text-xs text-muted-foreground">planter i vækst</p>
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-card border-amber-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Wheat className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-xl font-serif text-foreground">{hoestetIkor}</p>
            <p className="text-xs text-muted-foreground">høstet i år</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
