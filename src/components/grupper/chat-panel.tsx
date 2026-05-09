'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  Send, Loader2, Trash2, ListChecks, X,
} from 'lucide-react'
import { postChatMessage, deleteChatMessage, createTaskFromChatMessage, type ChatMessage } from '@/actions/group-chat'
import { idag } from '@/lib/datetime'
import { cn } from '@/lib/utils'

interface Props {
  groupId: string
  groupName: string
  messages: ChatMessage[]
  myUserId: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('da-DK', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ChatPanel({ groupId, groupName, messages, myUserId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-scroll til bunden ved nye beskeder
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages.length])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = body.trim()
    if (!trimmed && !imageUrl) return
    startTransition(async () => {
      const res = await postChatMessage({
        groupId,
        body: trimmed || undefined,
        imageUrl: imageUrl ?? undefined,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setBody('')
      setImageUrl(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3 min-h-[400px] max-h-[70vh]">
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 text-center">
            Ingen beskeder endnu. Skriv den første.
          </p>
        ) : (
          messages.map(m => (
            <ChatBubble
              key={m.id}
              message={m}
              groupId={groupId}
              groupName={groupName}
              isMine={m.userId === myUserId}
            />
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="space-y-2 border-t border-border pt-3">
        {imageUrl && (
          <div className="flex items-center gap-2">
            <div className="h-16 w-16 rounded-md overflow-hidden border border-border bg-muted shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl(null)}>
              <X className="h-3.5 w-3.5" />
              Fjern billede
            </Button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Skriv en besked…"
            rows={2}
            className="flex-1 resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSend(e as unknown as React.FormEvent)
              }
            }}
          />
          <Button
            type="submit"
            disabled={pending || (!body.trim() && !imageUrl)}
            aria-label="Send"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {!imageUrl && (
          <ImageUpload
            value={null}
            onChange={url => setImageUrl(url)}
            folder="chat"
            label="Vedhæft billede"
          />
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-[10px] text-muted-foreground">
          Tip: tryk ⌘/Ctrl+Enter for at sende.
        </p>
      </form>
    </div>
  )
}

function ChatBubble({
  message, groupId, groupName, isMine,
}: {
  message: ChatMessage
  groupId: string
  groupName: string
  isMine: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskDate, setTaskDate] = useState(idag())
  const [taskInfo, setTaskInfo] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm('Slet denne besked?')) return
    startTransition(async () => {
      const res = await deleteChatMessage(message.id, groupId)
      if ('error' in res) { alert(res.error); return }
      router.refresh()
    })
  }

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    setTaskInfo(null)
    if (!message.body) return
    startTransition(async () => {
      const res = await createTaskFromChatMessage({
        body: message.body!,
        date: taskDate,
        groupId,
        groupName,
      })
      if ('error' in res) { setTaskInfo(`Fejl: ${res.error}`); return }
      setTaskInfo('Opgaven blev oprettet i din kalender.')
      setTimeout(() => setTaskOpen(false), 1500)
    })
  }

  return (
    <div className={cn('flex flex-col gap-1 group', isMine && 'items-end')}>
      <div className={cn('flex items-baseline gap-2', isMine && 'flex-row-reverse')}>
        <span className="text-xs font-medium text-foreground">{message.authorLabel}</span>
        <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
      </div>
      <div className={cn('max-w-[85%]', isMine ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3 py-2 inline-block',
            isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          )}
        >
          {message.imageUrl && (
            <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-1 -mx-1 -mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl}
                alt=""
                className="rounded-lg max-h-72 object-cover"
                loading="lazy"
              />
            </a>
          )}
          {message.body && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
          )}
        </div>
        <div className={cn('flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity', isMine && 'justify-end')}>
          {message.body && (
            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
              <Button
                type="button" variant="ghost" size="sm" className="h-6 text-[10px] gap-1"
                onClick={() => setTaskOpen(true)}
              >
                <ListChecks className="h-3 w-3" />
                Lav opgave
              </Button>
              <DialogContent>
                <DialogTitle>Opret opgave fra besked</DialogTitle>
                <DialogDescription>
                  Opgaven gemmes i din kalender (kun for dig).
                </DialogDescription>
                <form onSubmit={handleCreateTask} className="space-y-3">
                  <div>
                    <Label>Titel</Label>
                    <p className="mt-1 text-sm text-foreground bg-muted/50 rounded-md px-2 py-1.5 line-clamp-3">
                      {message.body}
                    </p>
                  </div>
                  <div>
                    <Label>Dato</Label>
                    <Input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} required className="mt-1.5" />
                  </div>
                  {taskInfo && <p className="text-sm text-muted-foreground">{taskInfo}</p>}
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setTaskOpen(false)}>Annullér</Button>
                    <Button type="submit" disabled={pending}>
                      {pending ? 'Opretter…' : 'Opret opgave'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {(isMine) && (
            <Button
              type="button" variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-destructive"
              onClick={handleDelete} disabled={pending}
            >
              <Trash2 className="h-3 w-3" />
              Slet
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
