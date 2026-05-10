'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Flag, Loader2 } from 'lucide-react'
import { flagUserGuide } from '@/actions/guides-admin'

interface Props {
  guideId: string
  guideTitle: string
}

export function FlagGuideDialog({ guideId, guideTitle }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!reason.trim()) {
      setError('Skriv en kort begrundelse — den vises til brugeren.')
      return
    }
    startTransition(async () => {
      const res = await flagUserGuide(guideId, reason)
      if ('error' in res) { setError(res.error); return }
      setOpen(false)
      setReason('')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-amber-700 hover:bg-amber-50">
          <Flag className="h-3.5 w-3.5" />
          Flag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Flag &ldquo;{guideTitle}&rdquo;</DialogTitle>
        <DialogDescription>
          Brugeren får 5 dage til at revidere. Begrundelsen vises til ejeren som banner på guiden.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Begrundelse *</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Fx. 'Indeholder potentielt vildledende dosering — verificér eller ret op.'"
              className="mt-1.5"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending} className="bg-amber-700 hover:bg-amber-800">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
              Flag og skjul
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
