'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Flag, Loader2 } from 'lucide-react'
import { reportContent, REASON_LABEL, type ReportTarget, type ReportReason } from '@/actions/moderation'

interface Props {
  groupId: string
  targetType: ReportTarget
  targetId: string
  /** Vises som lille tekst-knap; default 'Rapportér' */
  label?: string
}

export function ReportButton({ groupId, targetType, targetId, label = 'Rapportér' }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [reason, setReason] = useState<ReportReason>('spam')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await reportContent({
        groupId, targetType, targetId, reason,
        message: message.trim() || undefined,
      })
      if ('error' in res) { setError(res.error); return }
      setDone(true)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) { setDone(false); setMessage(''); setReason('spam'); setError(null) }
      }}
    >
      <Button
        type="button" variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Flag className="h-3 w-3" />
        {label}
      </Button>
      <DialogContent className="max-w-md">
        <DialogTitle>Rapportér indhold</DialogTitle>
        <DialogDescription>
          Beskeden sendes til gruppens ejer, der vurderer om indholdet skal slettes.
        </DialogDescription>

        {done ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-1">
            <p className="text-sm font-medium text-foreground">Tak for rapporten</p>
            <p className="text-xs text-muted-foreground">Ejeren får besked og vurderer sagen.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Årsag</Label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as ReportReason)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {(Object.keys(REASON_LABEL) as ReportReason[]).map(r => (
                  <option key={r} value={r}>{REASON_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Yderligere info (valgfrit)</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="mt-1.5"
                placeholder="Hvorfor er det problematisk?"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Send rapport
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
