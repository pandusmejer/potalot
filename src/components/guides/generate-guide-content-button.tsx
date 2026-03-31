'use client'

import { Button } from '@/components/ui/button'
import { updateGuideFromAI } from '@/actions/guides'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  guideId: string
  guideName: string
  guideCategory: string
}

export function GenerateGuideContentButton({ guideId, guideName, guideCategory }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guideName, category: guideCategory }),
      })

      const aiData = await response.json()
      if (aiData.error) {
        setError(aiData.error)
        setLoading(false)
        return
      }

      const result = await updateGuideFromAI(guideId, aiData)
      if (result.error) {
        setError(result.error)
      } else {
        setDone(true)
        router.refresh()
      }
    } catch {
      setError('Kunne ikke generere indhold. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" />
        Indhold genereret — siden opdateres
      </div>
    )
  }

  return (
    <div>
      <Button
        onClick={handleGenerate}
        disabled={loading}
        variant="secondary"
        size="sm"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Genererer indhold...</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-1.5" /> Generér indhold med AI</>
        )}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
