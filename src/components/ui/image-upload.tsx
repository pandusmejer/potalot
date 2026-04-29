'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Loader2 } from 'lucide-react'
import { uploadImage, deleteImage, type UploadFolder } from '@/actions/storage'

interface Props {
  value: string | null
  onChange: (url: string | null) => void
  folder: UploadFolder
  label?: string
  /** Max billed-bredde/-højde efter resize (default 1600). */
  maxDimension?: number
}

/**
 * Upload ét billede. Resizer client-side til JPEG max-dimension før upload
 * for at spare båndbredde og storage.
 */
export function ImageUpload({ value, onChange, folder, label = 'Tilføj billede', maxDimension = 1600 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handlePick() {
    inputRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // tillad samme fil igen

    let blob: Blob = file
    try {
      blob = await resizeImage(file, maxDimension)
    } catch {
      // brug original fil hvis resize fejler
    }

    const fd = new FormData()
    fd.append('file', new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
    fd.append('folder', folder)

    startTransition(async () => {
      const res = await uploadImage(fd)
      if ('error' in res) {
        setError(res.error)
        return
      }
      onChange(res.url)
    })
  }

  function handleRemove() {
    if (!value) return
    const oldUrl = value
    onChange(null)
    // best-effort sletning
    deleteImage(oldUrl).catch(() => {})
  }

  if (value) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition"
          aria-label="Fjern billede"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      <Button type="button" variant="outline" className="w-full" onClick={handlePick} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {pending ? 'Uploader…' : label}
      </Button>
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
