import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

/**
 * Vises øverst når brugeren ikke er logget ind. Inviterer til at oprette
 * bruger eller logge ind for at gemme egne planter, frø og opgaver.
 */
export function DemoBanner() {
  return (
    <div className="bg-secondary/50 border-b border-secondary text-foreground">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-2 flex items-center gap-3 flex-wrap">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs sm:text-sm flex-1 min-w-0">
          Du ser PotAlot i demo-tilstand. Opret bruger for at gemme dine egne frø, planter og opgaver.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log ind</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/opret">Opret bruger</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
