'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Loader2, Star } from 'lucide-react'
import { uploadImage, deleteImage, type UploadFolder } from '@/actions/storage'
import { cn } from '@/lib/utils'

interface Props {
  /** Alle billed-URL'er, primary først */
  value: string[]
  primary: string | null
  onChange: (images: string[], primary: string | null) => void
  folder: UploadFolder
  /** Max billed-bredde/-højde efter resize (default 1600). */
  maxDimension?: number
  /** Max antal billeder (default 8). */
  maxImages?: number
  label?: string
}

/**
 * Upload flere billeder med valg af primært. Resizer client-side til
 * JPEG max-dimension før upload.
 */
export function MultiImageUpload({
  value,
  primary,
  onChange,
  folder,
  maxDimension = 1600,
  maxImages = 8,
  label = 'Tilføj billede',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handlePick() {
    inputRef.current?.click()
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const files = e.target.files
    if (!files || files.length === 0) return
    e.target.value = ''

    const remaining = maxImages - value.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) {
      setError(`Maksimalt ${maxImages} billeder.`)
      return
    }

    startTransition(async () => {
      const newUrls: string[] = []
      for (const file of toUpload) {
        let blob: Blob = file
        try {
          blob = await resizeImage(file, maxDimension)
        } catch {
          // brug original
        }
        const fd = new FormData()
        fd.append(
          'file',
          new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
        )
        fd.append('folder', folder)
        const res = await uploadImage(fd)
        if ('error' in res) {
          setError(res.error)
          continue
        }
        newUrls.push(res.url)
      }
      if (newUrls.length > 0) {
        const updated = [...value, ...newUrls]
        onChange(updated, primary ?? updated[0])
      }
    })
  }

  function handleRemove(url: string) {
    const updated = value.filter(u => u !== url)
    const newPrimary = primary === url ? updated[0] ?? null : primary
    onChange(updated, newPrimary)
    deleteImage(url).catch(() => {})
  }

  function handleSetPrimary(url: string) {
    onChange(value, url)
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map(url => {
            const isPrimary = url === primary
            return (
              <div
                key={url}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden border-2 group',
                  isPrimary ? 'border-primary' : 'border-border'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(url)}
                      className="h-7 w-7 rounded-full bg-background/90 flex items-center justify-center hover:bg-background"
                      aria-label="Sæt som primær"
                      title="Sæt som primær"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(url)}
                    className="h-7 w-7 rounded-full bg-background/90 flex items-center justify-center hover:bg-background"
                    aria-label="Fjern"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isPrimary && (
                  <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded">
                    Primær
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {value.length < maxImages && (
        <Button type="button" variant="outline" className="w-full" onClick={handlePick} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {pending ? 'Uploader…' : value.length === 0 ? label : `Tilføj flere (${value.length}/${maxImages})`}
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

async function resizeImage(file: File, maxDim: number): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const ratio = Math.min(1, maxDim / Math.max(img.width, img.height))
    const w = Math.round(img.width * ratio)
    const h = Math.round(img.height * ratio)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(img, 0, 0, w, h)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
