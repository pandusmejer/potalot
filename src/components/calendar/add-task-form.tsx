'use client'

import { createTask } from '@/actions/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { TASK_TYPES } from '@/lib/constants'
import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'

interface AddTaskFormProps {
  plants: { id: string; name: string; variety?: string | null }[]
}

export function AddTaskForm({ plants }: AddTaskFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createTask(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-1" />
        Ny opgave
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Opret opgave</DialogTitle>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titel</label>
            <Input name="title" required placeholder="Hvad skal gøres?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select name="task_type" required>
                {Object.entries(TASK_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dato</label>
              <Input name="due_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Plante (valgfri)</label>
              <Select name="plant_id">
                <option value="">Ingen</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.variety ? ` — ${p.variety}` : ''}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prioritet</label>
              <Select name="priority">
                <option value="low">Lav</option>
                <option value="medium" selected>Medium</option>
                <option value="high">Høj</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beskrivelse (valgfri)</label>
            <Input name="description" placeholder="Yderligere detaljer" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuller</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Opretter...' : 'Opret'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
