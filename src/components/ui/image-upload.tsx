'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Loader2 } from 'lucide-react'
import { deleteImage, type UploadFolder } from '@/actions/storage'
import { compressImage } from '@/lib/compress-image'
import { billedeForStortBesked } from '@/lib/upload-graenser'

interface Props {
  value: string | null
  onChange: (url: string | null) => void
  folder: UploadFolder
  label?: string
  capture?: 'user' | 'environment'
}

/**
 * Upload ét billede: komprimér klient-side, send til /api/upload (den
 * eneste levende uploadvej), som konverterer HEIC og lægger filen i
 * Supabase Storage. Størrelsesgrænsen tjekkes her OG i routen med samme
 * tal og samme tekst (src/lib/upload-graenser.ts).
 */
export function ImageUpload({ value, onChange, folder, label = 'Tilføj billede', capture }: Props) {
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
    e.target.value = ''

    startTransition(async () => {
      try {
        // Komprimér klient-side først — sparer båndbredde + sikrer at
        // server ikke ser tunge filer der kan OOM Netlify Functions
        const compressed = await compressImage(file)
        const forStor = billedeForStortBesked(compressed)
        if (forStor) {
          setError(forStor)
          return
        }
        const fd = new FormData()
        fd.append('file', compressed)
        fd.append('folder', folder)
        const response = await fetch('/api/upload', { method: 'POST', body: fd })
        const text = await response.text()
        let parsed: { url?: string; error?: string } = {}
        try { parsed = JSON.parse(text) } catch { /* not JSON */ }
        if (!response.ok) {
          console.error('upload fejlede:', response.status, text.slice(0, 200))
          setError(parsed.error ?? 'Kunne ikke uploade billedet. Prøv igen.')
          return
        }
        if (!parsed.url) {
          setError('Kunne ikke gemme billedet. Prøv igen.')
          return
        }
        onChange(parsed.url)
      } catch (e: unknown) {
        console.error('upload fejlede:', e)
        setError('Kunne ikke uploade billedet. Tjek forbindelsen, og prøv igen.')
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
        <img loading="lazy" decoding="async" src={value} alt="" className="w-full h-full object-cover" />
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
        accept="image/*"
        capture={capture}
        onChange={handleFile}
        className="hidden"
      />
      <Button type="button" variant="outline" className="w-full" onClick={handlePick} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {pending ? 'Uploader…' : label}
      </Button>
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  )
}
