'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Pencil } from 'lucide-react'
import { idag } from '@/lib/datetime'
import { TASK_TYPE_META } from '@/lib/constants'
import { createTask, updateTask } from '@/actions/havekalender'
import type { TaskType, TaskPriority, Plant, CalendarTask } from '@/lib/types'

interface Props {
  children?: React.ReactNode
  /** Hvis sat: pre-link opgaven til en plante (kun ved create) */
  defaultPlantId?: string
  /** Liste af aktive planter til at koble opgaven til */
  plants?: Pick<Plant, 'id' | 'name' | 'variety'>[]
  /** Hvis sat: edit-mode. Felter forudfyldes og 'Gem' opdaterer. */
  task?: CalendarTask
}

export function AddTaskDialog({ children, defaultPlantId, plants = [], task }: Props) {
  const router = useRouter()
  const isEdit = !!task
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [date, setDate] = useState(task?.date ?? idag())
  const [taskType, setTaskType] = useState<TaskType>(task?.taskType ?? 'custom')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [linkedPlantId, setLinkedPlantId] = useState(task?.linkedPlantId ?? defaultPlantId ?? '')

  function reset() {
    if (isEdit && task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setDate(task.date)
      setTaskType(task.taskType)
      setPriority(task.priority)
      setLinkedPlantId(task.linkedPlantId ?? '')
    } else {
      setTitle('')
      setDescription('')
      setDate(idag())
      setTaskType('custom')
      setPriority('medium')
      setLinkedPlantId(defaultPlantId ?? '')
    }
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = isEdit && task
        ? await updateTask({
            id: task.id,
            title: title.trim(),
            description: description.trim() || undefined,
            date,
            taskType,
            priority,
            linkedPlantId: linkedPlantId || null,
          })
        : await createTask({
            title: title.trim(),
            description: description.trim() || undefined,
            date,
            taskType,
            priority,
            linkedPlantId: linkedPlantId || undefined,
            source: linkedPlantId ? 'plant' : 'manual',
          })

      if ('error' in res) {
        setError(res.error)
        return
      }

      setOpen(false)
      if (!isEdit) reset()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          isEdit ? (
            <Button variant="ghost" size="sm" aria-label="Redigér opgave">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button>
              <Plus className="h-4 w-4" />
              Ny opgave
            </Button>
          )
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{isEdit ? 'Redigér opgave' : 'Ny opgave'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Ret detaljerne på opgaven.' : 'Tilføj en opgave til din kalender.'}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Titel *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="fx Køb planteskilte"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Beskrivelse</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mere kontekst (valgfrit)"
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dato</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={taskType}
                onChange={e => setTaskType(e.target.value as TaskType)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {Object.entries(TASK_TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioritet</Label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                <option value="low">Lav</option>
                <option value="medium">Medium</option>
                <option value="high">Høj</option>
                <option value="critical">Kritisk</option>
              </select>
            </div>
            {plants.length > 0 && (
              <div>
                <Label>Linket plante</Label>
                <select
                  value={linkedPlantId}
                  onChange={e => setLinkedPlantId(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                >
                  <option value="">Ingen</option>
                  {plants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.variety ? ` — ${p.variety}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annullér
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Gemmer…' : isEdit ? 'Gem ændringer' : 'Opret'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
