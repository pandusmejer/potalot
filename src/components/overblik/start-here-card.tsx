import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sprout, ArrowRight } from 'lucide-react'

/**
 * Start her-card. Vises på Havebog for helt nye brugere
 * (0 planter + 0 frøbank-items). Ét klart første skridt frem for en
 * flad QuickActions-grid.
 */
export function StartHereCard() {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-secondary/30 to-card border-primary/20 overflow-hidden relative">
      <div className="absolute inset-0 bg-pattern-botanical opacity-30 pointer-events-none" />
      <CardContent className="relative py-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sprout className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Start her
            </p>
            <h2 className="font-serif text-xl sm:text-2xl text-foreground mt-1">
              Din havebog er klar — den venter på dig
            </h2>
            <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed max-w-md">
              Det første skridt er at lægge noget i din frøbank — et frø,
              en knold, en stikling, eller bare en sort du vil prøve i år.
              Så bygger resten sig op af sig selv: planter, opgaver, badges.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/froebank/tilfoej">
                  <Sprout className="h-4 w-4" />
                  Tilføj dit første frø
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/guides">
                  Bladr dyrkningsguides først
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
