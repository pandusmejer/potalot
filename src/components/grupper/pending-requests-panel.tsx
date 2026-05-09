'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { approveJoinRequest, declineJoinRequest, type JoinRequest } from '@/actions/group-invitations'

interface Props {
  groupId: string
  initial: JoinRequest[]
}

function venligTid(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function PendingRequestsPanel({ groupId, initial }: Props) {
  const router = useRouter()
  const [requests, setRequests] = useState<JoinRequest[]>(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleApprove(r: JoinRequest) {
    setError(null)
    startTransition(async () => {
      const res = await approveJoinRequest(groupId, r.userId)
      if ('error' in res) { setError(res.error); return }
      setRequests(prev => prev.filter(x => x.userId !== r.userId))
      router.refresh()
    })
  }

  function handleDecline(r: JoinRequest) {
    if (!confirm(`Afvis ${r.label}s anmodning?`)) return
    setError(null)
    startTransition(async () => {
      const res = await declineJoinRequest(groupId, r.userId)
      if ('error' in res) { setError(res.error); return }
      setRequests(prev => prev.filter(x => x.userId !== r.userId))
      router.refresh()
    })
  }

  if (requests.length === 0) return null

  return (
    <div className="space-y-2 border border-amber-200 bg-amber-50/40 rounded-lg p-3">
      <p className="text-xs uppercase tracking-wider text-amber-800">
        Ventende anmodninger ({requests.length})
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <ul className="space-y-2">
        {requests.map(r => (
          <li key={r.userId} className="flex items-start justify-between gap-2 text-sm">
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium">{r.label}</p>
              <p className="text-[10px] text-muted-foreground">{venligTid(r.requestedAt)}</p>
              {r.message && <p className="text-xs text-muted-foreground mt-0.5">&ldquo;{r.message}&rdquo;</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                type="button" size="sm" onClick={() => handleApprove(r)} disabled={pending}
                aria-label={`Godkend ${r.label}`}
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Godkend
              </Button>
              <Button
                type="button" size="sm" variant="ghost" onClick={() => handleDecline(r)} disabled={pending}
                aria-label={`Afvis ${r.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
