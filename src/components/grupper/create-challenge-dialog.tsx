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
import { ImageUpload } from '@/components/ui/image-upload'
import { Plus, Trophy } from 'lucide-react'
import { createChallenge } from '@/actions/challenges'

interface Props {
  groupId: string
}

export function CreateChallengeDialog({ groupId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createChallenge({
        groupId,
        title: title.trim(),
        description: description.trim() || undefined,
        prompt: prompt.trim() || undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        coverImageUrl: coverImageUrl ?? undefined,
      })
      if ('error' in res) { setError(res.error); return }
      setOpen(false)
      setTitle(''); setDescription(''); setPrompt(''); setEndsAt(''); setCoverImageUrl(null)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Ny udfordring
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-600" />
          Opret udfordring
        </DialogTitle>
        <DialogDescription>
          En tidsbegrænset udfordring som medlemmer kan deltage i ved at indsende et bidrag.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Titel *</Label>
            <Input
              value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="Fx Bedste høst-foto i juli"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Beskrivelse</Label>
            <Textarea
              value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Hvad handler udfordringen om?"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Opgave — hvad skal man indsende?</Label>
            <Textarea
              value={prompt} onChange={e => setPrompt(e.target.value)} rows={2}
              placeholder="Fx 'Et foto af din høst med kort beskrivelse'"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Slutdato (valgfri)</Label>
            <Input
              type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Ingen slutdato = udfordringen kører, til den slettes manuelt.
            </p>
          </div>
          <div>
            <Label>Cover-billede (valgfri)</Label>
            <div className="mt-1.5">
              <ImageUpload value={coverImageUrl} onChange={setCoverImageUrl} folder="chat" label="Tilføj billede" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? 'Opretter…' : 'Opret udfordring'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
