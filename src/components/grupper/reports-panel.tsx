'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, X, Loader2, Flag } from 'lucide-react'
import { resolveReport, REASON_LABEL, type ContentReport, type ReportTarget } from '@/actions/moderation'

const TARGET_LABEL: Record<ReportTarget, string> = {
  forum_post: 'Forum-opslag',
  forum_reply: 'Forum-svar',
  swap_listing: 'Frøbytte-opslag',
  chat_message: 'Chat-besked',
}

interface Props {
  groupId: string
  initial: ContentReport[]
}

function venligTid(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ReportsPanel({ groupId, initial }: Props) {
  const router = useRouter()
  const [reports, setReports] = useState<ContentReport[]>(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleResolve(report: ContentReport, action: 'delete' | 'dismiss') {
    setError(null)
    startTransition(async () => {
      const res = await resolveReport({
        reportId: report.id,
        groupId,
        decision: action === 'delete' ? 'resolved' : 'dismissed',
        deleteTarget: action === 'delete',
        targetType: report.targetType,
        targetId: report.targetId,
      })
      if ('error' in res) { setError(res.error); return }
      setReports(prev => prev.filter(r => r.id !== report.id))
      router.refresh()
    })
  }

  if (reports.length === 0) return null

  return (
    <div className="space-y-2 border border-amber-200 bg-amber-50/40 rounded-lg p-3">
      <p className="text-xs uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
        <Flag className="h-3 w-3" />
        Rapporteret indhold ({reports.length})
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <ul className="space-y-2">
        {reports.map(r => (
          <li key={r.id} className="rounded-md border border-amber-200 bg-card p-2 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="muted" className="text-[10px]">{TARGET_LABEL[r.targetType]}</Badge>
              <Badge variant="warning" className="text-[10px]">{REASON_LABEL[r.reason]}</Badge>
              <span className="text-[10px] text-muted-foreground">{venligTid(r.createdAt)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Rapporteret af <span className="text-foreground">{r.reporterLabel}</span>
            </p>
            {r.message && <p className="text-xs text-muted-foreground italic">&ldquo;{r.message}&rdquo;</p>}
            <div className="flex gap-1 pt-1">
              <Button
                type="button" size="sm" className="text-destructive" variant="outline"
                onClick={() => handleResolve(r, 'delete')} disabled={pending}
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Slet indhold
              </Button>
              <Button
                type="button" size="sm" variant="ghost"
                onClick={() => handleResolve(r, 'dismiss')} disabled={pending}
              >
                <X className="h-3.5 w-3.5" />
                Afvis rapport
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
