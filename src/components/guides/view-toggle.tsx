'use client'

import { useState } from 'react'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GuideCardView } from './guide-card-view'
import { Rows } from 'lucide-react'
import type { PlantGuide } from '@/lib/types'

/**
 * "Bilkort"-knap der åbner en scanbar quick-view af guiden.
 * Tiltænkt brug i haven — én skærm med kun overskrifter.
 */
export function CardViewButton({ guide }: { guide: PlantGuide }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Rows className="h-3.5 w-3.5 mr-1.5" />
        Bilkort
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} className="max-w-sm">
        <DialogTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
          Bilkort
        </DialogTitle>
        <GuideCardView guide={guide} />
      </Dialog>
    </>
  )
}
