'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { deleteImage, type UploadFolder } from '@/actions/storage'
import { cn } from '@/lib/utils'

interface Props {
  value: string | null
  onChange: (url: string | null) => void
  folder: UploadFolder
  label?: string
}

/**
 * Upload ét billede. Sender rå fil til /api/images/upload som
 * håndterer HEIC→JPEG, EXIF-rotation, resize og thumbnail.
 */
export function ImageUpload({ value, onChange, folder, label = 'Tilføj billede' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', folder)
        const response = await fetch('/api/images/upload', { method: 'POST', body: fd })
        const json = await response.json().catch(() => ({ error: 'Ugyldigt svar fra server' }))
        if (!response.ok) {
          setError(json.error ?? 'Upload fejlede')
          return
        }
        onChange(json.url as string)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'netværksfejl'
        setError(`Upload fejlede: ${msg}`)
      }
    })
  }

  function handleRemove() {
    if (!value) return
    const oldUrl = value
    onChange(null)
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
      <div
        className={cn(
          'relative inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg border border-input bg-card text-sm font-medium hover:bg-accent transition-colors',
          pending && 'opacity-60'
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        <span>{pending ? 'Uploader…' : label}</span>
        {!pending && (
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={label}
          />
        )}
      </div>
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  )
}
