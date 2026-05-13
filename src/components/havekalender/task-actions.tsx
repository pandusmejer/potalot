'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { AddTaskDialog } from '@/components/havekalender/add-task-dialog'
import { deleteTask } from '@/actions/havekalender'
import { getAllPlants } from '@/actions/mine-planter'
import type { CalendarTask, Plant } from '@/lib/types'

interface Props {
  task: CalendarTask
}

/**
 * Pencil + skraldespand til en CalendarTask. Genbruger AddTaskDialog i edit-mode.
 * Henter planter lazily første gang dialogen er klar til at åbnes.
 */
export function TaskActions({ task }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [plants, setPlants] = useState<Pick<Plant, 'id' | 'name' | 'variety'>[]>([])

  // Hent planter på client første gang component mountes — bruges i edit-form
  useEffect(() => {
    getAllPlants().then(all => {
      setPlants(all.filter(p => !p.isArchived).map(p => ({
        id: p.id, name: p.name, variety: p.variety,
      })))
    })
  }, [])

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const res = await deleteTask(task.id)
      if ('error' in res) { setError(res.error); return }
      setConfirmOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center gap-0 shrink-0">
        <AddTaskDialog task={task} plants={plants} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
          aria-label="Slet opgave"
          title="Slet opgave"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>Slet opgave?</DialogTitle>
          <DialogDescription>
            &ldquo;{task.title}&rdquo; bliver slettet permanent. Kan ikke fortrydes.
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
