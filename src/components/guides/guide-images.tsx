'use client'

import { addGuideImage, removeGuideImage } from '@/actions/guides'
import { Button } from '@/components/ui/button'
import { Camera, Trash2 } from 'lucide-react'
import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  guideId: string
  images: string[]
}

export function GuideImages({ guideId, images }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      startTransition(async () => {
        await addGuideImage(guideId, dataUrl)
        router.refresh()
      })
    }
    reader.readAsDataURL(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleRemove(index: number) {
    startTransition(async () => {
      await removeGuideImage(guideId, index)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div key={i} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={`Billede ${i + 1}`} className="h-24 w-24 object-cover rounded-lg border border-border" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              disabled={isPending}
              className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center h-24 w-24 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground mt-1">Tilføj</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      </div>
    </div>
  )
}
