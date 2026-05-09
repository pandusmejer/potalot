'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Share2, X, Loader2 } from 'lucide-react'
import {
  shareIdeaByUsername, unshareIdea, getShareRecipients, type ShareRecipient,
} from '@/actions/idea-shares'

interface Props {
  ideaId: string
  ideaTitle: string
  /** Antal nuværende delinger — vises på trigger-knappen. */
  initialCount: number
}

export function ShareIdeaDialog({ ideaId, ideaTitle, initialCount }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [recipients, setRecipients] = useState<ShareRecipient[]>([])
  const [loadingList, setLoadingList] = useState(false)

  // Hent eksisterende modtagere når dialogen åbnes
  useEffect(() => {
    if (!open) return
    let active = true
    setLoadingList(true)
    getShareRecipients(ideaId)
      .then(rs => { if (active) setRecipients(rs) })
      .finally(() => { if (active) setLoadingList(false) })
    return () => { active = false }
  }, [open, ideaId])

  function handleShare(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const res = await shareIdeaByUsername(ideaId, username)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setRecipients(prev => [...prev, res.recipient])
      setUsername('')
      setInfo(`Delt med ${res.recipient.label}.`)
      router.refresh()
    })
  }

  function handleUnshare(recipientUserId: string, label: string) {
    if (!confirm(`Fjern deling med ${label}?`)) return
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const res = await unshareIdea(ideaId, recipientUserId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setRecipients(prev => prev.filter(r => r.userId !== recipientUserId))
      setInfo(`Deling med ${label} fjernet.`)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          {initialCount > 0 ? `Delt med ${initialCount}` : 'Del'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Del &ldquo;{ideaTitle}&rdquo;</DialogTitle>
        <DialogDescription>
          Skriv brugernavnet på den person du vil dele idéen med. Modtagere kan se idéen, men ikke ændre den.
        </DialogDescription>

        <form onSubmit={handleShare} className="space-y-3">
          <div>
            <Label>Brugernavn</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="fx. anna_g"
                autoComplete="off"
                spellCheck={false}
              />
              <Button type="submit" disabled={pending || username.trim().length < 3}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Del
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && !error && <p className="text-sm text-muted-foreground">{info}</p>}
        </form>

        <div className="border-t border-border pt-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Delt med
          </p>
          {loadingList ? (
            <p className="text-sm text-muted-foreground italic">Henter…</p>
          ) : recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Endnu ikke delt med nogen.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {recipients.map(r => (
                <li key={r.userId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-foreground">{r.label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnshare(r.userId, r.label)}
                    disabled={pending}
                    aria-label={`Fjern deling med ${r.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Luk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
