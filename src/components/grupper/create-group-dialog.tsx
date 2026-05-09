'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { createGroup } from '@/actions/groups'

export function CreateGroupDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      setName('')
      setDescription('')
      router.push(`/grupper/${res.id}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Ny gruppe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Opret gruppe</DialogTitle>
        <DialogDescription>
          Privat gruppe til at dele idéer med familie eller venner. Du kan invitere medlemmer bagefter.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Navn *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Fx. Familien Mejer"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Beskrivelse</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Hvem er gruppen for og hvad bruger I den til?"
              rows={2}
              className="mt-1.5"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annullér
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? 'Opretter…' : 'Opret gruppe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
