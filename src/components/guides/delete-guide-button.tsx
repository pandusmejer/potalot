'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { DeleteGuideDialog } from '@/components/guides/delete-guide-dialog'

interface Props {
  guideId: string
  guideTitle: string
  /** Beholdes for bagudkompatibilitet — dialogen viser samme adfærd uanset. */
  isMaster?: boolean
  /** Hvor brugeren sendes hen efter sletning (default /guides). */
  redirectTo?: string
}

export function DeleteGuideButton({ guideId, guideTitle, redirectTo }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Slet
      </Button>
      <DeleteGuideDialog
        open={open}
        onOpenChange={setOpen}
        guideId={guideId}
        guideTitle={guideTitle}
        redirectTo={redirectTo}
      />
    </>
  )
}
