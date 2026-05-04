'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Loader2, Star } from 'lucide-react'
import { deleteImage, type UploadFolder } from '@/actions/storage'
import { cn } from '@/lib/utils'

interface Props {
  /** Alle billed-URL'er, primary først */
  value: string[]
  primary: string | null
  onChange: (images: string[], primary: string | null) => void
  folder: UploadFolder
  /** Max antal billeder (default 8). */
  maxImages?: number
  label?: string
  /** "environment" tvinger bagkamera, undlad for OS-picker (kamera + bibliotek). */
  capture?: 'user' | 'environment'
}

/**
 * Upload flere billeder. Sender rå fil til /api/images/upload som
 * håndterer HEIC→JPEG-konvertering, EXIF-rotation, resize og thumbnail.
 */
export function MultiImageUpload({
  value,
  primary,
  onChange,
  folder,
  maxImages = 8,
  label = 'Tilføj billede',
  capture,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    setDebug(null)
    const files = e.target.files
    if (!files || files.length === 0) {
      return
    }
    e.target.value = ''

    const remaining = Math.max(0, maxImages - value.length)
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) {
      setError(`Du har allerede ${value.length} af max ${maxImages} billeder. Fjern et eksisterende først.`)
      return
    }
    setDebug(`Uploader ${toUpload.length} billede(r)…`)

    startTransition(async () => {
      const newUrls: string[] = []
      const errors: string[] = []
      for (const file of toUpload) {
        try {
          setDebug(`Uploader "${file.name}" (${Math.round(file.size / 1024)} KB)…`)
          const fd = new FormData()
          fd.append('file', file)
          fd.append('folder', folder)
          const response = await fetch('/api/upload', { method: 'POST', body: fd })
          const json = await response.json().catch(() => ({ error: 'Ugyldigt svar fra server' }))
          if (!response.ok) {
            errors.push(`${file.name}: ${json.error ?? `HTTP ${response.status}`}`)
            continue
          }
          newUrls.push(json.url as string)
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'ukendt fejl'
          errors.push(`${file.name}: ${msg}`)
        }
      }
      if (newUrls.length > 0) {
        const updated = [...value, ...newUrls]
        onChange(updated, primary ?? updated[0])
        setDebug(null)
      }
      if (errors.length > 0) {
        setError(errors.join(' · '))
        setDebug(null)
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
      {/* Skjult input refereres af label nedenfor — mere pålideligt på iOS Safari end programmatisk .click() */}

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
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture={capture}
            multiple={!capture}
            onChange={handleFiles}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {pending
              ? 'Uploader…'
              : value.length === 0
                ? label
                : capture
                  ? `Tag endnu et billede (${value.length}/${maxImages})`
                  : `Tilføj flere (${value.length}/${maxImages})`}
          </Button>
        </>
      )}

      {debug && !error && (
        <p className="text-xs text-muted-foreground">{debug}</p>
      )}
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
          {error}
        </div>
      )}

    </div>
  )
}

