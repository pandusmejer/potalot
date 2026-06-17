'use client'

import { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, NotebookText } from 'lucide-react'
import { saveMyGuideNote } from '@/actions/guide-notes'

interface Props {
  guideId: string
  initialNote: string
}

/**
 * Privat note for den loggede-ind bruger på en guide. Påvirker ikke
 * master-guidens indhold — gemmes i user_guide_notes-tabellen.
 */
export function GuideNotesCard({ guideId, initialNote }: Props) {
  const [note, setNote] = useState(initialNote)
  const [savedNote, setSavedNote] = useState(initialNote)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isDirty = note !== savedNote

  function handleSave() {
    setError(null)
    setStatus(null)
    startTransition(async () => {
      const res = await saveMyGuideNote(guideId, note)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setSavedNote(note)
      setStatus('Gemt.')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <NotebookText className="h-4 w-4" />
          Mine noter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Kun synligt for dig. Bruges fx til at notere dine egne erfaringer eller justeringer til denne guide.
        </p>
        <Textarea
          value={note}
          onChange={e => { setNote(e.target.value); setStatus(null) }}
          rows={4}
          placeholder="Skriv hvad der virkede for dig…"
        />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={handleSave} disabled={pending || !isDirty}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? 'Gemmer…' : 'Gem note'}
          </Button>
          {status && <span className="text-xs text-muted-foreground">{status}</span>}
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
