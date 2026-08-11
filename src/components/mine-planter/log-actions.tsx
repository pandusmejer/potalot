'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { LogForm } from '@/components/mine-planter/log-form'
import { deletePlantLog } from '@/actions/mine-planter'
import { PLANT_LOG_LABEL } from '@/lib/plant-log-meta'
import type { PlantLog } from '@/lib/types'

interface Props {
  plantId: string
  log: PlantLog
}

/**
 * Pencil + skraldespand pr. log-event i tidslinjen. Vises kun på
 * brugerens egne logs (ikke auto-genererede milepæle).
 */
export function LogActions({ plantId, log }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const res = await deletePlantLog(log.id)
      if ('error' in res) { setError(res.error); return }
      setConfirmOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center gap-0 shrink-0 -mt-1 -mr-1 opacity-70 group-hover:opacity-100 transition-opacity">
        <LogForm plantId={plantId} log={log} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
          aria-label="Slet log"
          title="Slet log"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>Slet log?</DialogTitle>
          <DialogDescription>
            &ldquo;{log.title ?? log.note ?? PLANT_LOG_LABEL[log.type]}&rdquo; slettes
            permanent sammen med eventuelle fotos. Det kan ikke fortrydes.
          </DialogDescription>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
              Annullér
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Slet permanent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
