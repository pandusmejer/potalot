import { cn } from '@/lib/utils'
import type { PlantFilterStatus } from '@/data/mock-plants'

interface PlantStatusFilterProps {
  filters: Array<{ id: PlantFilterStatus; label: string }>
  active: PlantFilterStatus
  onChange: (status: PlantFilterStatus) => void
}

export function PlantStatusFilter({ filters, active, onChange }: PlantStatusFilterProps) {
  return (
    <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
      <div className="scrollbar-hide flex snap-x gap-1.5 overflow-x-auto overscroll-x-contain py-0.5 [-webkit-overflow-scrolling:touch]">
        {filters.map(filter => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={cn(
              'snap-start whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              active === filter.id
                ? 'border-primary/20 bg-primary text-primary-foreground shadow-soft'
                : 'border-border bg-card/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  )
}
