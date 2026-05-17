'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { PLANT_STATUS_META } from '@/lib/constants'
import { plantColor } from '@/lib/plant-color'
import { useImageColor } from '@/lib/use-image-color'
import { dageSiden } from '@/lib/datetime'
import type { Plant, CalendarTask } from '@/lib/types'
import { Sprout, ChevronDown, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  plant: Plant
  /** Næste opgave for planten — vises i det udfoldede */
  nextTask?: CalendarTask | null
}

function saaetLabel(alder: number): string {
  if (alder === 0) return 'Sået i dag'
  if (alder === 1) return 'Sået i går'
  return `${alder} dage gammel`
}

/**
 * Plantekort som "chartek": flad plante-farveblok med fritlagt
 * motiv, fed sans-navn og ÉN nøglelinje (Sået / X dage gammel).
 * Organisk blad-underkant. Resten foldes ud på stedet.
 */
export function PlantCard({ plant, nextTask }: Props) {
  const [open, setOpen] = useState(false)
  const statusMeta = PLANT_STATUS_META[plant.status]
  const alder = plant.sowDate ? dageSiden(plant.sowDate) : null
  const photoColor = useImageColor(plant.primaryImageId)
  const { field: nameField } = plantColor(plant.name, plant.variety)
  const field = photoColor ?? nameField

  const keyLine = alder !== null ? saaetLabel(alder) : statusMeta.label

  return (
    <Card className="relative overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) }
        }}
        className="leaf-edge relative h-44 cursor-pointer px-5 pt-5 pb-9 select-none"
        style={{ backgroundColor: field }}
      >
        {/* Kicker + navn + nøglelinje */}
        <div className="relative max-w-[62%]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
            Mine planter
          </p>
          <h3 className="mt-1 truncate font-sans text-2xl font-bold leading-tight text-white">
            {plant.name}
          </h3>
          {plant.variety && (
            <p className="truncate text-sm text-white/80">{plant.variety}</p>
          )}
          <p className="mt-3 truncate text-sm font-semibold text-white">
            {keyLine}
          </p>
          {plant.quantity > 1 && (
            <p className="truncate text-xs text-white/70">{plant.quantity} stk</p>
          )}
        </div>

        {/* Fritlagt motiv — højre side */}
        <div className="pointer-events-none absolute bottom-7 right-4 top-5 flex w-[40%] items-center justify-center">
          <div className="absolute bottom-2 h-4 w-24 rounded-[50%] bg-black/15 blur-md" />
          {plant.primaryImageId ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={plant.primaryImageId}
              alt={plant.name}
              className="relative max-h-full w-auto object-contain drop-shadow-xl"
            />
          ) : (
            <Sprout className="relative h-16 w-16 text-white/55" strokeWidth={1.25} />
          )}
        </div>

        <ChevronDown
          className={cn(
            'absolute bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 text-white/70 transition-transform',
            open && 'rotate-180'
          )}
        />
      </div>

      {/* Udfoldet: resten af informationen */}
      {open && (
        <div className="bg-card px-5 pb-5 pt-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Row label="Status" value={statusMeta.label} />
            {plant.location && <Row label="Placering" value={plant.location} />}
            {alder !== null && <Row label="Alder" value={saaetLabel(alder)} />}
            {plant.quantity > 1 && <Row label="Antal" value={`${plant.quantity} stk`} />}
            {nextTask && <Row label="Næste opgave" value={nextTask.title} />}
          </dl>
          <Link
            href={`/mine-planter/${plant.id}`}
            onClick={e => e.stopPropagation()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Åbn plantekort <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground">{value}</dd>
    </div>
  )
}
