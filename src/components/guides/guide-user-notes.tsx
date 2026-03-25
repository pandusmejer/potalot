'use client'

import { updateGuideUserNotes } from '@/actions/guides'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useState, useTransition } from 'react'
import { Check, Pencil } from 'lucide-react'

interface GuideUserNotesProps {
  guideId: string
  initialNotes: string
}

export function GuideUserNotes({ guideId, initialNotes }: GuideUserNotesProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    startTransition(async () => {
      const result = await updateGuideUserNotes(guideId, notes)
      if (result.success) {
        setEditing(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  if (!editing && !notes) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
        Tilføj dine noter...
      </button>
    )
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line bg-muted/30 rounded-lg p-4 border border-border">
          {notes}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Rediger
          </Button>
          {saved && <span className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Gemt</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={4}
        placeholder="Skriv dine egne erfaringer, observationer og tips..."
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Gemmer...' : 'Gem'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setNotes(initialNotes) }}>
          Annuller
        </Button>
      </div>
    </div>
  )
}
