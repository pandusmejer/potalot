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
import type { GeneralGardenTask, TaskPriority } from '@/lib/types'
import {
  adminCreateGeneralTask, adminUpdateGeneralTask, adminDeleteGeneralTask,
} from '@/actions/aarshjul'

interface Props {
  /** Hvis udfyldt → edit-mode. Ellers create. */
  task?: GeneralGardenTask
}

export function GeneralTaskForm({ task }: Props) {
  const router = useRouter()
  const isEdit = !!task
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [month, setMonth] = useState<number>(task?.month ?? 1)
  const [season, setSeason] = useState(task?.season ?? '')
  const [category, setCategory] = useState(task?.category ?? 'andet')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [timeWindow, setTimeWindow] = useState(task?.timeWindow ?? '')
  const [tip, setTip] = useState(task?.tip ?? '')
  const [risk, setRisk] = useState(task?.risk ?? '')
  const [isActive, setIsActive] = useState(task?.isActive ?? true)

  function reset() {
    if (!isEdit) {
      setTitle(''); setDescription(''); setMonth(1); setSeason('')
      setCategory('andet'); setPriority('medium')
      setTimeWindow(''); setTip(''); setRisk(''); setIsActive(true)
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
        season: season.trim() || undefined,
        category,
        priority,
        timeWindow: timeWindow.trim() || undefined,
        tip: tip.trim() || undefined,
        risk: risk.trim() || undefined,
        isActive,
      }
      const res = isEdit
        ? await adminUpdateGeneralTask(task!.id, input)
        : await adminCreateGeneralTask(input)
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
    if (!confirm(`Slet "${task!.title}"? Dette er en global ændring.`)) return
    setError(null)
    startTransition(async () => {
      const res = await adminDeleteGeneralTask(task!.id)
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
            Rediger
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            Nyt gøremål
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{isEdit ? 'Rediger gøremål' : 'Nyt gøremål'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Ændringer træder igennem globalt for alle brugere.' : 'Vises i kalenderen for alle brugere fra valgte måned.'}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Titel *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required className="mt-1.5" />
          </div>

          <div>
            <Label>Beskrivelse</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1.5" />
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
              <Label>Sæson</Label>
              <Input value={season} onChange={e => setSeason(e.target.value)} placeholder="forår, sommer..." className="mt-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kategori</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} className="mt-1.5" />
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
                <option value="critical">Kritisk</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Tidsrum</Label>
            <Input value={timeWindow} onChange={e => setTimeWindow(e.target.value)} placeholder="primo april til medio maj" className="mt-1.5" />
          </div>

          <div>
            <Label>Tip</Label>
            <Textarea value={tip} onChange={e => setTip(e.target.value)} rows={2} className="mt-1.5" />
          </div>

          <div>
            <Label>Risiko</Label>
            <Textarea value={risk} onChange={e => setRisk(e.target.value)} rows={2} className="mt-1.5" />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isActive" className="cursor-pointer">Aktiv (synlig for alle brugere)</Label>
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
              {pending ? 'Gemmer…' : isEdit ? 'Gem ændringer' : 'Opret'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
