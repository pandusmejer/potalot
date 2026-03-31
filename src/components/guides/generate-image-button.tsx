'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  guideId: string
  plantName: string
  botanicalName?: string | null
}

export function GenerateImageButton({ guideId, plantName, botanicalName }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-guide-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId, plantName, botanicalName }),
      })
      const data = await res.json()
      if (!data.error) {
        router.refresh()
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleGenerate}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          Genererer billede…
        </>
      ) : (
        <>
          <ImagePlus className="h-4 w-4 mr-1.5" />
          Generér Flora Danica-billede
        </>
      )}
    </Button>
  )
}
