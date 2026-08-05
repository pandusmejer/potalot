'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Copy, Loader2 } from 'lucide-react'
import { cloneGuideToOwn } from '@/actions/guides'
import { guideHref } from '@/lib/guides/guide-href'

interface Props {
  guideId: string
}

/**
 * "Lav min egen version" — kopierer en master til en bruger-ejet guide
 * og navigerer til den nye kopi, hvor brugeren kan redigere frit uden
 * at påvirke masteren.
 */
export function CloneMasterButton({ guideId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClone() {
    setError(null)
    startTransition(async () => {
      const res = await cloneGuideToOwn(guideId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push(guideHref(res.id))
    })
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="outline" size="sm" onClick={handleClone} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
        {pending ? 'Kopierer…' : 'Lav min egen version'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
