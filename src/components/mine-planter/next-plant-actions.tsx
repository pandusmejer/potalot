import { Button } from '@/components/ui/button'
import type { MockPlantNextAction } from '@/data/mock-plants'
import { Check, Leaf } from 'lucide-react'

interface NextPlantActionsProps {
  actions: MockPlantNextAction[]
}

export function NextPlantActions({ actions }: NextPlantActionsProps) {
  if (!actions.length) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-serif text-2xl leading-tight text-foreground">Næste i dine planter</h2>
      </div>
      <div className="-mx-4 overflow-hidden sm:mx-0">
        <div className="scrollbar-hide flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:px-0 [-webkit-overflow-scrolling:touch]">
        {actions.map(action => (
          <article
            key={action.id}
            className="min-w-[148px] max-w-[148px] snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
          >
            <div className="relative h-24 overflow-hidden bg-secondary">
              {action.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={action.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-pattern-botanical text-primary/45">
                  <Leaf className="h-6 w-6" />
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(18,14,10,0.34))]" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 bg-card/80 text-primary shadow-soft backdrop-blur-sm hover:bg-card"
                aria-label={`Marker ${action.action} udført`}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="px-3 py-3">
              <p className="line-clamp-1 text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                {action.timing}
              </p>
              <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">
                  {action.action}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{action.plantName}</p>
            </div>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}
