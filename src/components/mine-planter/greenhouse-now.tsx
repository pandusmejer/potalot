import Link from 'next/link'
import { PLANT_STATUS_META } from '@/lib/constants'
import type { Plant } from '@/lib/types'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'

interface GreenhouseNowProps {
  plants: Plant[]
}

export function GreenhouseNow({ plants }: GreenhouseNowProps) {
  const visiblePlants = plants.filter(plant => !plant.isArchived).slice(0, 6)
  if (!visiblePlants.length) return null

  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl leading-tight text-foreground">Dit drivhus lige nu</h2>
        <p className="text-xs font-medium text-muted-foreground">{visiblePlants.length} i gang</p>
      </div>
      <div className="-mx-4 overflow-hidden sm:mx-0">
        <div className="scrollbar-hide flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:px-0 [-webkit-overflow-scrolling:touch]">
          {visiblePlants.map(plant => {
            // Canonical resolver — aldrig hardcoded paths. Hvis ingen
            // gyldig kilde findes returnerer resolveren placeholder, og
            // vi viser i stedet en neutral pattern-baggrund. Forkert
            // billede er værre end intet billede.
            const { src, source } = resolvePotalotImage({
              guideId: plant.guideId,
              varietySlug: plant.guideId,
              role: 'plant-card',
              preferredSrc: plant.primaryImageId,
            })
            const showImage = source !== 'fallback'
            return (
            <Link
              key={plant.id}
              href={`/mine-planter/${plant.id}`}
              className="group relative h-28 min-w-[31%] max-w-[31%] snap-start overflow-hidden rounded-2xl bg-secondary shadow-soft min-[390px]:min-w-[29%] min-[390px]:max-w-[29%]"
            >
              {showImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 bg-pattern-botanical bg-secondary" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,14,10,0.08),rgba(18,14,10,0.72))]" />
              <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                <p className="line-clamp-1 text-[11px] font-semibold leading-4">
                  {plant.name}
                </p>
                {plant.variety && (
                  <p className="line-clamp-1 text-[10px] leading-3 text-white/78">{plant.variety}</p>
                )}
                <p className="mt-1 line-clamp-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white/64">
                  {PLANT_STATUS_META[plant.status].label} · {plant.quantity} stk
                </p>
              </div>
            </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
