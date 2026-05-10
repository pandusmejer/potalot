'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteGuide } from '@/actions/guides'
import { deleteMasterGuide } from '@/actions/guides-admin'

interface Props {
  guideId: string
  guideTitle: string
  /** True hvis det er en master-guide (slettes via admin-action) */
  isMaster: boolean
}

export function DeleteGuideButton({ guideId, guideTitle, isMaster }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    const msg = isMaster
      ? `Slet master-guiden "${guideTitle}"? Alle brugere mister adgang.`
      : `Slet din guide "${guideTitle}"? Dine private noter forsvinder også.`
    if (!confirm(msg)) return

    startTransition(async () => {
      const res = isMaster
        ? await deleteMasterGuide(guideId)
        : await deleteGuide(guideId)
      if ('error' in res) {
        alert(`Kunne ikke slette: ${res.error}`)
        return
      }
      router.push('/guides')
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Slet
    </Button>
  )
}
