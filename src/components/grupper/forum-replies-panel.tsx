'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { CheckCircle2, Trash2, Loader2, Send, MessageSquare } from 'lucide-react'
import {
  postReply, deleteReply, markBestReply, type ForumReply,
} from '@/actions/group-forum'
import { cn } from '@/lib/utils'

interface Props {
  postId: string
  groupId: string
  replies: ForumReply[]
  bestReplyId: string | null
  myUserId: string
  isMember: boolean
  isLocked: boolean
  canMarkBest: boolean
}

function venligTid(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function ForumRepliesPanel({
  postId, groupId, replies, bestReplyId, myUserId, isMember, isLocked, canMarkBest,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sortér: bedste svar først, derefter kronologisk
  const sorted = [...replies].sort((a, b) => {
    if (a.isBestReply && !b.isBestReply) return -1
    if (!a.isBestReply && b.isBestReply) return 1
    return a.createdAt.localeCompare(b.createdAt)
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!body.trim()) return
    startTransition(async () => {
      const res = await postReply({
        postId,
        body: body.trim(),
        imageUrl: imageUrl ?? undefined,
      })
      if ('error' in res) { setError(res.error); return }
      setBody(''); setImageUrl(null)
      router.refresh()
    })
  }

  function handleDelete(reply: ForumReply) {
    if (!confirm('Slet dette svar?')) return
    startTransition(async () => {
      const res = await deleteReply(reply.id, postId)
      if ('error' in res) { alert(res.error); return }
      router.refresh()
    })
  }

  function handleMarkBest(reply: ForumReply) {
    const isAlready = bestReplyId === reply.id
    startTransition(async () => {
      const res = await markBestReply(postId, isAlready ? null : reply.id)
      if ('error' in res) { alert(res.error); return }
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Svar ({replies.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Ingen svar endnu.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map(r => (
              <li
                key={r.id}
                className={cn(
                  'rounded-lg p-3 border',
                  r.isBestReply
                    ? 'border-green-300 bg-green-50/40'
                    : 'border-border bg-card',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{r.authorLabel}</span>
                    <span className="text-[10px] text-muted-foreground">{venligTid(r.createdAt)}</span>
                    {r.isBestReply && (
                      <span className="text-[10px] inline-flex items-center gap-0.5 text-green-800 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Bedste svar
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{r.body}</p>
                {r.imageUrl && (
                  <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.imageUrl} alt="" className="rounded-md max-h-60 object-cover" loading="lazy" />
                  </a>
                )}
                <div className="flex gap-1 mt-2">
                  {canMarkBest && (
                    <Button
                      type="button" variant="ghost" size="sm" className="h-7 text-[10px] gap-1"
                      onClick={() => handleMarkBest(r)} disabled={pending}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {r.isBestReply ? 'Fjern markering' : 'Markér som bedste'}
                    </Button>
                  )}
                  {r.userId === myUserId && (
                    <Button
                      type="button" variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-destructive"
                      onClick={() => handleDelete(r)} disabled={pending}
                    >
                      <Trash2 className="h-3 w-3" />
                      Slet
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isMember ? (
          <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
            Kun medlemmer kan svare. Deltag i gruppen for at deltage i debatten.
          </p>
        ) : isLocked ? (
          <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
            Tråden er lukket. Ingen nye svar tillades.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2 border-t border-border pt-3">
            <Label className="text-xs">Skriv et svar</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
              placeholder="Bidrag med din erfaring eller stil et opfølgende spørgsmål…"
            />
            {imageUrl ? (
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded-md overflow-hidden border border-border shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl(null)}>
                  Fjern billede
                </Button>
              </div>
            ) : (
              <ImageUpload
                value={null}
                onChange={url => setImageUrl(url)}
                folder="chat"
                label="Vedhæft billede"
              />
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={pending || !body.trim()}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send svar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
