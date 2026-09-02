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
import { Plus } from 'lucide-react'
import { createVariety } from '@/actions/group-varieties'

interface Props {
  groupId: string
}

export function AddVarietyDialog({ groupId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [plantName, setPlantName] = useState('')
  const [variety, setVariety] = useState('')
  const [latinName, setLatinName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createVariety({
        groupId,
        plantName: plantName.trim(),
        variety: variety.trim() || undefined,
        latinName: latinName.trim() || undefined,
        description: description.trim() || undefined,
        primaryImageUrl: imageUrl ?? undefined,
      })
      if ('error' in res) { setError(res.error); return }
      setOpen(false)
      setPlantName(''); setVariety(''); setLatinName(''); setDescription(''); setImageUrl(null)
      router.push(`/grupper/${groupId}/sorter/${res.id}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Tilføj sort
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Tilføj sort til gruppen</DialogTitle>
        <DialogDescription>
          Sorten bliver synlig for alle medlemmer. Du kan tilføje billeder og beskrivelse senere.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plantenavn *</Label>
              <Input value={plantName} onChange={e => setPlantName(e.target.value)} placeholder="Fx Chili" required className="mt-1.5" />
            </div>
            <div>
              <Label>Sort</Label>
              <Input value={variety} onChange={e => setVariety(e.target.value)} placeholder="Fx Jalapeño" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Latinsk navn</Label>
            <Input value={latinName} onChange={e => setLatinName(e.target.value)} placeholder="Fx Capsicum annuum" className="mt-1.5" />
          </div>
          <div>
            <Label>Beskrivelse</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Smag, varme, anvendelse, kendetegn…"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Billede</Label>
            <div className="mt-1.5">
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                folder="chat"
                label="Tilføj billede"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending || !plantName.trim()}>
              {pending ? 'Opretter…' : 'Tilføj sort'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
