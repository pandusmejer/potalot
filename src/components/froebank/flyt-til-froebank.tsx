'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { updateInventoryItem } from '@/actions/froebank'

/**
 * FlytTilFroebank — ønskelistens eneste ekstra handling (Anna 3/8).
 * Flyt = KUN kategorien ændres; alle oplysninger (noter, billeder,
 * guide-reference mv.) bevares. Ønskelisten er en parkeringsplads for
 * idéer — dette er broen videre til Frøbanken.
 */
export function FlytTilFroebank({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function flyt() {
    setError(null)
    startTransition(async () => {
      const res = await updateInventoryItem(itemId, { primaryCategoryId: 'fro' })
      if ('error' in res) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="space-y-1.5">
      <Button onClick={flyt} disabled={pending} className="w-full">
        <ArrowRight className="h-4 w-4" />
        {pending ? 'Flytter…' : 'Flyt til Frøbanken'}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Alle oplysninger bevares — kun kategorien ændres. Sorter på ønskelisten
        tæller ikke som frø, du allerede ejer.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
