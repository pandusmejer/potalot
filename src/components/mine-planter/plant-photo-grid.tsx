import type { MockPlantImage } from '@/data/mock-plants'
import { Image as ImageIcon } from 'lucide-react'

interface PlantPhotoGridProps {
  images: MockPlantImage[]
}

export function PlantPhotoGrid({ images }: PlantPhotoGridProps) {
  if (!images.length) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(index => (
          <div
            key={index}
            className="aspect-square rounded-2xl bg-pattern-botanical bg-secondary/40 p-4 text-primary/35"
          >
            <ImageIcon className="h-5 w-5" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {images.map(image => (
        <figure key={image.id} className="aspect-square overflow-hidden rounded-2xl bg-pattern-botanical bg-secondary/40 shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src={image.src} alt={image.alt} className="h-full w-full object-cover" />
        </figure>
      ))}
    </div>
  )
}
