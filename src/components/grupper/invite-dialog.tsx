'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Copy, RefreshCw, Loader2, Check, Mail, MessageSquare } from 'lucide-react'
import { getOrCreateInvitationToken, rotateInvitationToken } from '@/actions/group-invitations'

interface Props {
  groupId: string
  groupName: string
}

export function InviteDialog({ groupId, groupName }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!open || token) return
    startTransition(async () => {
      const res = await getOrCreateInvitationToken(groupId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setToken(res.token)
    })
  }, [open, token, groupId])

  const link = token ? `${origin}/grupper/invitation/${token}` : ''

  function handleCopy() {
    if (!link) return
    navigator.clipboard.writeText(link).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1500) },
      () => setError('Kunne ikke kopiere — markér og kopiér linket manuelt.'),
    )
  }

  function handleRotate() {
    if (!confirm('Generér nyt link? Det gamle link holder op med at virke.')) return
    setError(null)
    startTransition(async () => {
      const res = await rotateInvitationToken(groupId)
      if ('error' in res) { setError(res.error); return }
      setToken(res.token)
    })
  }

  const subject = encodeURIComponent(`Invitation til ${groupName} på Potalot`)
  const bodyText = encodeURIComponent(`Hej!\n\nJeg vil gerne invitere dig til min gruppe "${groupName}" på Potalot. Klik linket for at anmode om adgang:\n\n${link}\n`)
  const smsBody = encodeURIComponent(`Tjek min gruppe "${groupName}" på Potalot: ${link}`)

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null) }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-3.5 w-3.5" />
          Invitér
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Invitér til {groupName}</DialogTitle>
        <DialogDescription>
          Alle med linket kan anmode om adgang. Du godkender nye medlemmer.
        </DialogDescription>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Invitations-link</Label>
            {!token ? (
              <p className="text-sm text-muted-foreground italic">
                {pending ? 'Genererer link…' : 'Klargør link…'}
              </p>
            ) : (
              <div className="flex gap-2">
                <Input value={link} readOnly className="font-mono text-xs" onFocus={e => e.currentTarget.select()} />
                <Button type="button" onClick={handleCopy} size="icon" variant="outline" aria-label="Kopiér link">
                  {copied ? <Check className="h-4 w-4 text-green-700" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>

          {token && (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`mailto:?subject=${subject}&body=${bodyText}`}>
                  <Mail className="h-3.5 w-3.5" />
                  Send via mail
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`sms:?&body=${smsBody}`}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  Send via SMS
                </a>
              </Button>
            </div>
          )}

          {token && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRotate} disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Generér nyt link
            </Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Luk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
