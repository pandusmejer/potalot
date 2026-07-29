import Link from 'next/link'
import type { MockPlantActivity } from '@/data/mock-plants'
import { Leaf } from 'lucide-react'

interface RecentPlantActivityProps {
  activities: MockPlantActivity[]
}

export function RecentPlantActivity({ activities }: RecentPlantActivityProps) {
  if (!activities.length) return null

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl leading-tight text-foreground">Senest i haven</h2>
      <div className="-mx-4 overflow-hidden sm:mx-0">
        <div className="scrollbar-hide flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:px-0 [-webkit-overflow-scrolling:touch]">
          {activities.map(activity => (
            <Link
              key={activity.id}
              href={`/mine-planter/${activity.plantId}`}
              className="min-w-[210px] max-w-[210px] snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            >
              <div className="relative h-36 overflow-hidden bg-secondary">
                {activity.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img loading="lazy" decoding="async" src={activity.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-pattern-botanical text-primary/45">
                    <Leaf className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,14,10,0.02)_30%,rgba(18,14,10,0.72))]" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <p className="line-clamp-1 text-sm font-semibold leading-5">{activity.plantName}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-white/74">{activity.when}</p>
                </div>
              </div>
              <div className="px-3 py-3">
                <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">
                  {activity.action}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
