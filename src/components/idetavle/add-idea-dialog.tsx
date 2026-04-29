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
import { ImageUpload } from '@/components/ui/image-upload'
import { Plus } from 'lucide-react'
import type { Idea } from '@/lib/types'
import { createIdea } from '@/actions/idetavle'

const STATUS_OPTIONS: { value: Idea['status']; label: string }[] = [
  { value: 'idea', label: 'Idé' },
  { value: 'planning', label: 'Planlagt' },
  { value: 'in_progress', label: 'I gang' },
  { value: 'done', label: 'Udført' },
]

export function AddIdeaDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Idea['status']>('idea')
  const [targetYear, setTargetYear] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  function reset() {
    setTitle(''); setDescription(''); setStatus('idea')
    setTargetYear(''); setTagsInput(''); setImageUrl(null); setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Titel er påkrævet')
      return
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    startTransition(async () => {
      const res = await createIdea({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        targetYear: targetYear ? parseInt(targetYear, 10) : undefined,
        tags: tags.length ? tags : undefined,
        primaryImageUrl: imageUrl ?? undefined,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Ny idé
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Ny idé</DialogTitle>
        <DialogDescription>
          Et langsigtet projekt — fx ny urtehave, plant frugttræ, byg drivhus.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Titel *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Fx. Byg drivhus"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Beskrivelse</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Hvad er idéen, og hvorfor?"
              rows={3}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Idea['status'])}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Målår</Label>
              <Input
                type="number"
                value={targetYear}
                onChange={e => setTargetYear(e.target.value)}
                placeholder="Fx. 2027"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <Input
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="urtehave, drivhus (komma-separeret)"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Billede</Label>
            <div className="mt-1.5">
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                folder="idetavle"
                label="Tilføj billede"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annullér
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Opretter…' : 'Opret idé'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
