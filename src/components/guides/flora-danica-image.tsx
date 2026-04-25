'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react'

interface Props {
  plantName: string
  variety?: string | null
  latinName?: string | null
  /** Eksisterende billede-URL hvis allerede genereret */
  imageUrl?: string | null
}

/**
 * Flora Danica-billed visning + generate-knap.
 *
 * Viser eksisterende billede hvis sat. Ellers tilbyder at generere
 * via /api/flora-danica/generate.
 *
 * TODO (storage): Når /api endpoint persisterer til Supabase, gem URL
 * tilbage på guide-record så billedet ikke skal genereres igen.
 * TODO (kurator): AI-genererede illustrationer skal sendes til kurator-godkendelse.
 */
export function FloraDanicaImage({ plantName, variety, latinName, imageUrl: initialUrl }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl ?? null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/flora-danica/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantName, variety, latinName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Kunne ikke generere')
        return
      }
      setImageUrl(data.url)
    } catch {
      setError('Netværksfejl')
    } finally {
      setGenerating(false)
    }
  }

  if (imageUrl) {
    return (
      <div className="aspect-[2/1] rounded-2xl border border-border bg-secondary/30 overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Flora Danica-illustration af ${plantName}`}
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  return (
    <div className="aspect-[2/1] rounded-2xl border border-border bg-secondary/30 bg-pattern-botanical flex flex-col items-center justify-center gap-3">
      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
      <div className="text-center space-y-2 px-4">
        <p className="text-xs text-muted-foreground italic">
          Flora Danica-illustration
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Genererer…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Generér med AI
            </>
          )}
        </Button>
        {error && (
          <p className="text-xs text-destructive max-w-sm">{error}</p>
        )}
      </div>
    </div>
  )
}
