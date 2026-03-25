'use client'

import { Button } from '@/components/ui/button'
import { createGuideFromAI } from '@/actions/guides'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { useState } from 'react'

interface GenerateGuideButtonProps {
  name: string
  variety?: string
  category?: string
  onGuideCreated: (guideId: string) => void
}

export function GenerateGuideButton({ name, variety, category, onGuideCreated }: GenerateGuideButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, variety, category: category || 'vegetable' }),
      })

      const aiData = await response.json()
      if (aiData.error) {
        setError(aiData.error)
        setLoading(false)
        return
      }

      // Determine guide category from subcategory context
      const guideCategory = mapToGuideCategory(category)

      const result = await createGuideFromAI(name, guideCategory, aiData)
      if (result.error) {
        setError(result.error)
      } else if (result.guideId) {
        setDone(true)
        onGuideCreated(result.guideId)
        if (result.alreadyExists) {
          setDone(true)
        }
      }
    } catch {
      setError('Kunne ikke generere guide. Prøv igen.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <Check className="h-3.5 w-3.5" />
        Guide oprettet
      </span>
    )
  }

  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={handleGenerate}
        disabled={loading || !name.trim()}
      >
        {loading ? (
          <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Genererer...</>
        ) : (
          <><Sparkles className="h-3.5 w-3.5 mr-1" /> AI Guide</>
        )}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

function mapToGuideCategory(category?: string): string {
  switch (category) {
    case 'Grøntsager': return 'vegetable'
    case 'Krydderurter': return 'herb'
    case 'Blomster (1-årige)':
    case 'Blomster (flerårige)': return 'flower'
    case 'Frugt':
    case 'Bær': return 'fruit'
    default: return 'vegetable'
  }
}
