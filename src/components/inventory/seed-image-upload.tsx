'use client'

import { Button } from '@/components/ui/button'
import type { ParsedSeed } from './seed-bulk-review'
import { Camera, Loader2, AlertCircle, RotateCcw, Trash2, ScanLine } from 'lucide-react'
import { useState, useRef } from 'react'

interface SeedImageUploadProps {
  onExtracted: (seed: ParsedSeed) => void
  onBack: () => void
}

interface UploadedImage {
  file: File
  preview: string
  base64: string
  mimeType: string
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
  const [images, setImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleAddImage(file: File) {
    setError(null)
    try {
      const { base64, mimeType } = await compressImage(file)
      const preview = URL.createObjectURL(file)
      setImages(prev => [...prev, { file, preview, base64, mimeType }])
    } catch {
      setError('Kunne ikke læse billedet. Prøv et andet.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleScan() {
    if (images.length === 0) return
    setError(null)
    setLoading(true)

    try {
      const payload = images.map(img => ({
        image: img.base64,
        mimeType: img.mimeType,
      }))

      const response = await fetch('/api/ai/seed-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: payload }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      // Map the new extended response format
      const seed: ParsedSeed = {
        name: data.dansk_navn || data.name || '',
        variety: data.sort || data.variety || null,
        brand: data.mærke_eller_leverandør || data.brand || null,
        quantity: data.antal_total ? Number(data.antal_total) : (data.quantity ? Number(data.quantity) : null),
        year_purchased: data.købsår ? Number(data.købsår) : new Date().getFullYear(),
        expiry_year: data.udløbsdato ? null : (data.expiry_year ? Number(data.expiry_year) : null),
        notes: data.noter || data.notes || null,
        guide_id: null,
        // Extended fields available for further processing
        ...(data.botanisk_navn && { botanical_name: data.botanisk_navn }),
        ...(data.underkategori && { subcategory: data.underkategori }),
        ...(data.type && { plant_type: data.type }),
        ...(data.spireprocent && { germination_rate: Number(data.spireprocent) }),
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
    setImages([])
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Upload photos */}
      <div>
        <p className="text-sm font-medium text-foreground mb-1">
          Step 1: Upload fotos af frøposen
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Tag billeder af forside, bagside og evt. ekstra detaljer. Alle billeder analyseres samlet.
        </p>

        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt={`Billede ${i + 1}`}
                className="h-24 w-24 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded">
                {i === 0 ? 'Forside' : i === 1 ? 'Bagside' : `#${i + 1}`}
              </span>
            </div>
          ))}

          {!loading && (
            <label className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <Camera className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground mt-1">
                {images.length === 0 ? 'Tilføj' : '+ Mere'}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAddImage(file)
                }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Step 2: Scan */}
      {images.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Step 2: Scan og udfyld automatisk
          </p>
          <Button
            type="button"
            onClick={handleScan}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyserer {images.length} billede{images.length > 1 ? 'r' : ''}...</>
            ) : (
              <><ScanLine className="h-4 w-4 mr-2" /> Scan frøpose ({images.length} billede{images.length > 1 ? 'r' : ''})</>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Start forfra
          </Button>
        </div>
      )}

      <div className="flex justify-start pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Tilbage
        </Button>
      </div>
    </div>
  )
}
