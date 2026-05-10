'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { unflagGuide } from '@/actions/guides-admin'

export function UnflagGuideButton({ guideId, guideTitle }: { guideId: string; guideTitle: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`Fjern flag fra "${guideTitle}"? Guiden bliver synlig igen for ejer og fjerner nedtællingen.`)) return
    startTransition(async () => {
      const res = await unflagGuide(guideId)
      if ('error' in res) { alert(res.error); return }
      router.refresh()
    })
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      Fjern flag
    </Button>
  )
}
