import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { PLANT_STATUS_META } from '@/lib/constants'
import { plantColor } from '@/lib/plant-color'
import { dageSiden } from '@/lib/datetime'
import type { Plant, CalendarTask } from '@/lib/types'
import { Sprout, MapPin, Calendar, ArrowRight } from 'lucide-react'

interface Props {
  plant: Plant
  /** Næste opgave for planten — vises som CTA */
  nextTask?: CalendarTask | null
}

/**
 * Plantekort som immersivt samlekort: stor plante-komplementær
 * farveflade med fritlagt motiv + serif-navn, og et hvidt ark
 * der glider op over bunden. Funktion/data uændret.
 */
export function PlantCard({ plant, nextTask }: Props) {
  const statusMeta = PLANT_STATUS_META[plant.status]
  const alder = plant.sowDate ? dageSiden(plant.sowDate) : null
  const { fieldSoft, fieldDeep } = plantColor(plant.name, plant.variety)

  return (
    <Card className="relative overflow-hidden">
      <Link href={`/mine-planter/${plant.id}`} className="block">
        {/* Plante-farveflade */}
        <div
          className="relative h-72 overflow-hidden px-5 pt-5"
          style={{ backgroundImage: `linear-gradient(165deg, ${fieldSoft}, ${fieldDeep})` }}
        >
          {/* Sæson-modulation */}
          <div className="absolute inset-0 bg-[var(--hero-to)] opacity-[0.16] mix-blend-soft-light" />
          {/* Tekst-scrim for læsbar hvid titel */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/20 to-transparent" />

          {/* Kicker + navn */}
          <div className="relative max-w-[78%]">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
              Mine planter
            </p>
            <h3 className="mt-0.5 truncate font-serif text-2xl leading-tight text-white">
              {plant.name}
            </h3>
            {plant.variety && (
              <p className="truncate text-sm italic text-white/75">{plant.variety}</p>
            )}
          </div>

          {/* Fritlagt motiv */}
          <div className="absolute inset-x-0 bottom-0 top-24 flex items-end justify-center pb-3">
            <div className="absolute bottom-5 h-5 w-32 rounded-[50%] bg-black/20 blur-md" />
            {plant.primaryImageId ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={plant.primaryImageId}
                alt={plant.name}
                className="relative max-h-full w-auto object-contain drop-shadow-xl"
              />
            ) : (
              <Sprout className="relative h-20 w-20 text-white/55" strokeWidth={1.25} />
            )}
          </div>
        </div>

        {/* Hvidt ark der glider op over fladen */}
        <div className="relative -mt-6 rounded-t-3xl bg-card px-4 pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {statusMeta.label}
            </span>
            {plant.location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {plant.location}
              </span>
            )}
            {alder !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {alder === 0 ? 'Sået i dag' : `${alder} dage gammel`}
              </span>
            )}
            {plant.quantity > 1 && (
              <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
                {plant.quantity} stk
              </span>
            )}
          </div>

          {nextTask && (
            <div className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
              <ArrowRight className="h-3 w-3" />
              {nextTask.title}
            </div>
          )}
        </div>
      </Link>
    </Card>
  )
}
