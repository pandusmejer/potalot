'use client'

import { Button } from '@/components/ui/button'
import type { ParsedSeed } from './seed-bulk-review'
import { Camera, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { useState, useRef } from 'react'

interface SeedImageUploadProps {
  onExtracted: (seed: ParsedSeed) => void
  onBack: () => void
}

async function compressImage(
  file: File,
  maxWidth = 1024
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxWidth / img.width, 1)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, mimeType: 'image/jpeg' })
    }
    img.onerror = () => reject(new Error('Kunne ikke læse billedet'))
    img.src = URL.createObjectURL(file)
  })
}

export function SeedImageUpload({ onExtracted, onBack }: SeedImageUploadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImage(file: File) {
    setError(null)
    setPreview(URL.createObjectURL(file))
    setLoading(true)

    try {
      const { base64, mimeType } = await compressImage(file)

      const response = await fetch('/api/ai/seed-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      const seed: ParsedSeed = {
        name: data.name || '',
        variety: data.variety || null,
        brand: data.brand || null,
        quantity: data.quantity ? Number(data.quantity) : null,
        year_purchased: new Date().getFullYear(),
        expiry_year: data.expiry_year ? Number(data.expiry_year) : null,
        notes: data.notes || null,
        guide_id: null,
      }

      onExtracted(seed)
    } catch (err) {
      console.error('Image scan error:', err)
      setError('Der opstod en fejl. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setPreview(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tag et billede af din frøpose, så analyserer vi den automatisk og udtrækker frødata.
      </p>

      {!preview && !loading && (
        <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
          <Camera className="h-10 w-10 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Tag billede eller vælg fra galleri
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImage(file)
            }}
          />
        </label>
      )}

      {preview && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Frøpose"
            className="w-full max-h-64 object-contain rounded-lg border border-border"
          />
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-lg">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              <span className="text-sm text-white mt-2">Analyserer frøpose...</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {error && (
        <Button type="button" variant="secondary" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Prøv igen
        </Button>
      )}

      <div className="flex justify-start pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Tilbage
        </Button>
      </div>
    </div>
  )
}
