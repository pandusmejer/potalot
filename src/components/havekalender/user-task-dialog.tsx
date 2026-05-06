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
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { MONTHS_DA } from '@/lib/constants'
import type { UserGardenTask, TaskPriority } from '@/lib/types'
import {
  createUserGardenTask, updateUserGardenTask, deleteUserGardenTask,
} from '@/actions/aarshjul'

interface Props {
  /** Pre-vælg en måned ved oprettelse. Ignoreres ved edit. */
  defaultMonth?: number
  /** Hvis udfyldt → edit-mode. Ellers create. */
  task?: UserGardenTask
}

export function UserTaskDialog({ defaultMonth, task }: Props) {
  const router = useRouter()
  const isEdit = !!task
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [month, setMonth] = useState<number>(task?.month ?? defaultMonth ?? 1)
  const [category, setCategory] = useState(task?.category ?? 'andet')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [timeWindow, setTimeWindow] = useState(task?.timeWindow ?? '')
  const [notify, setNotify] = useState(task?.notifyEnabled ?? true)

  function reset() {
    if (!isEdit) {
      setTitle(''); setDescription(''); setMonth(defaultMonth ?? 1)
      setCategory('andet'); setPriority('medium')
      setTimeWindow(''); setNotify(true)
    }
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Titel er påkrævet')
      return
    }
    startTransition(async () => {
      const input = {
        title: title.trim(),
        description: description.trim() || undefined,
        month,
        category,
        priority,
        timeWindow: timeWindow.trim() || undefined,
        notifyEnabled: notify,
      }
      const res = isEdit
        ? await updateUserGardenTask(task!.id, input)
        : await createUserGardenTask(input)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  function handleDelete() {
    if (!isEdit) return
    if (!confirm(`Slet "${task!.title}"?`)) return
    startTransition(async () => {
      const res = await deleteUserGardenTask(task!.id)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Tilføj eget gøremål
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{isEdit ? 'Rediger gøremål' : 'Tilføj eget gøremål'}</DialogTitle>
        <DialogDescription>
          Kun synligt for dig. Bruges som påmindelse i din kalender.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Titel *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required className="mt-1.5" />
          </div>

          <div>
            <Label>Beskrivelse</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Måned</Label>
              <select
                value={month}
                onChange={e => setMonth(parseInt(e.target.value, 10))}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {MONTHS_DA.map(m => (
                  <option key={m.num} value={m.num}>{m.full}</option>
                ))}
              </select>
            </div>
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
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kategori</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Tidsrum</Label>
              <Input value={timeWindow} onChange={e => setTimeWindow(e.target.value)} placeholder="fx primo april" className="mt-1.5" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="notify"
              checked={notify}
              onChange={e => setNotify(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="notify" className="cursor-pointer">Send notifikation når måneden begynder</Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="flex-wrap gap-2">
            {isEdit && (
              <Button type="button" variant="ghost" onClick={handleDelete} disabled={pending} className="text-destructive">
                <Trash2 className="h-4 w-4" />
                Slet
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Gemmer…' : isEdit ? 'Gem' : 'Opret'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
