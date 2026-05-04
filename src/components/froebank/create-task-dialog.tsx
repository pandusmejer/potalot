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
import { Calendar } from 'lucide-react'
import { idag } from '@/lib/datetime'
import { createTask } from '@/actions/havekalender'

interface Props {
  /** Frøbank-entry som opgaven knyttes til. */
  inventoryItemId: string
  /** Vises som standardtitel-forslag. */
  itemName: string
}

export function CreateTaskDialog({ inventoryItemId, itemName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(`Opgave for ${itemName}`)
  const [date, setDate] = useState(idag())
  const [description, setDescription] = useState('')

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (o) {
      setTitle(`Opgave for ${itemName}`)
      setDate(idag())
      setDescription('')
      setError(null)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Titel er påkrævet')
      return
    }
    startTransition(async () => {
      const res = await createTask({
        title: title.trim(),
        date,
        description: description.trim() || undefined,
        linkedInventoryItemId: inventoryItemId,
        source: 'manual',
        priority: 'medium',
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="h-4 w-4" />
          Opret opgave
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Opret opgave</DialogTitle>
        <DialogDescription>
          Knyttes automatisk til {itemName}.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Titel *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label>Dato *</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label>Noter</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1.5" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Gemmer…' : 'Gem opgave'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
