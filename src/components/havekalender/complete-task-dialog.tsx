'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Check, Sparkles } from 'lucide-react'
import { completeTaskWithLog, completeTask } from '@/actions/havekalender'
import type { PlantLogType } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  taskId: string
  plantId: string
  taskTitle: string
  suggestedLogType: PlantLogType
}

/**
 * Vises efter en opgave med linket plante er markeret udført.
 * Spørger: "Vil du tilføje dette til dyrkningsloggen?"
 */
export function CompleteTaskDialog({ open, onClose, taskId, plantId, taskTitle, suggestedLogType }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState('')

  function handleAddLog() {
    startTransition(async () => {
      const res = await completeTaskWithLog({
        taskId,
        plantId,
        logType: suggestedLogType,
        logTitle: taskTitle,
        logNote: note.trim() || undefined,
      })
      if (!('error' in res)) {
        onClose()
        router.refresh()
      }
    })
  }

  function handleSkip() {
    startTransition(async () => {
      // Opgaven er allerede markeret udført af completeTask
      // Brug completeTask igen for at sikre konsistens
      await completeTask(taskId)
      onClose()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleSkip()}>
      <DialogContent>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Føj til dyrkningslog?
        </DialogTitle>
        <DialogDescription>
          Du kan gemme &quot;{taskTitle}&quot; som en log-entry på planten — så kan du senere se hvornår du gjorde det.
        </DialogDescription>

        <div className="space-y-3">
          <div>
            <Label>Note (valgfri)</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Hvad observerede du? Hvordan gik det?"
              rows={3}
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleSkip} disabled={pending}>
            Spring over
          </Button>
          <Button onClick={handleAddLog} disabled={pending}>
            <Check className="h-4 w-4" />
            {pending ? 'Gemmer…' : 'Føj til log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
