'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Send } from 'lucide-react'
import { submitJoinRequest } from '@/actions/group-invitations'

interface Props {
  token: string
}

export function RequestAccessForm({ token }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await submitJoinRequest({ token, message: message.trim() || undefined })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setSubmitted(true)
      router.refresh()
    })
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-1">
        <p className="text-sm font-medium text-foreground">Anmodning sendt</p>
        <p className="text-xs text-muted-foreground">
          Du får adgang når en ejer godkender. Du kan trygt lukke siden.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <Label className="text-xs">Besked til ejeren (valgfrit)</Label>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Hej, jeg vil gerne være med fordi…"
          rows={2}
          className="mt-1.5"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Anmod om adgang
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}
