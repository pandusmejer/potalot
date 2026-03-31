'use client'

import { deleteGuide } from '@/actions/guides'
import { Button } from '@/components/ui/button'
import type { PlantGuide } from '@/lib/types'
import { Pencil, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { GuideForm } from './guide-form'

interface Props {
  guide: PlantGuide
}

export function GuideActions({ guide }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('Slet denne guide? Frø og planter tilknyttet guiden frakobles automatisk.')) return
    startTransition(async () => {
      await deleteGuide(guide.id)
      router.push('/guides')
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Rediger
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending} className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Slet
        </Button>
      </div>
      <GuideForm open={showEdit} onClose={() => setShowEdit(false)} guide={guide} />
    </>
  )
}
