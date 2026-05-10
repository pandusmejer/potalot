'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { Send, Pencil } from 'lucide-react'
import { submitChallengeEntry, type ChallengeEntry } from '@/actions/challenges'

interface Props {
  challengeId: string
  prompt: string | null
  existingEntry: ChallengeEntry | null
}

export function SubmitChallengeEntryDialog({ challengeId, prompt, existingEntry }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [caption, setCaption] = useState(existingEntry?.caption ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(existingEntry?.imageUrl ?? null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await submitChallengeEntry({
        challengeId,
        caption: caption.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
      })
      if ('error' in res) { setError(res.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={existingEntry ? 'outline' : 'default'}>
          {existingEntry ? <Pencil className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          {existingEntry ? 'Redigér bidrag' : 'Indsend bidrag'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>{existingEntry ? 'Redigér dit bidrag' : 'Indsend bidrag'}</DialogTitle>
        <DialogDescription>
          {prompt || 'Skriv en note og/eller vedhæft et billede.'}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Note</Label>
            <Textarea
              value={caption} onChange={e => setCaption(e.target.value)} rows={3}
              placeholder="Beskriv dit bidrag…"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Billede</Label>
            <div className="mt-1.5">
              <ImageUpload value={imageUrl} onChange={setImageUrl} folder="chat" label="Tilføj billede" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending || (!caption.trim() && !imageUrl)}>
              {pending ? 'Sender…' : existingEntry ? 'Gem ændringer' : 'Indsend'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
