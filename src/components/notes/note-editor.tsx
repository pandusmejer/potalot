'use client'

import { createNote, updateNote, deleteNote } from '@/actions/notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import type { Note } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'

interface NoteEditorProps {
  note?: Note | null
  plants: { id: string; name: string; variety?: string | null }[]
  basePath?: string
}

export function NoteEditor({ note, plants, basePath = '/dyrkningslog' }: NoteEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = note
        ? await updateNote(note.id, formData)
        : await createNote(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push(basePath)
      }
    })
  }

  function handleDelete() {
    if (!note) return
    startTransition(async () => {
      await deleteNote(note.id)
      router.push(basePath)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Titel</label>
        <Input name="title" required defaultValue={note?.title ?? ''} placeholder="Titel på noten" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Indhold</label>
        <Textarea
          name="content"
          required
          rows={8}
          defaultValue={note?.content ?? ''}
          placeholder="Skriv din observation, læring eller note..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Plante (valgfri)</label>
          <Select name="plant_id" defaultValue={note?.plant_id ?? ''}>
            <option value="">Ingen</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.variety ? ` — ${p.variety}` : ''}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dato</label>
          <Input
            name="note_date"
            type="date"
            defaultValue={note?.note_date ?? new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tags (kommasepareret)</label>
        <Input
          name="tags"
          defaultValue={note?.tags?.join(', ') ?? ''}
          placeholder="fx. tomat, drivhus, 2026"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <div>
          {note && (
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="h-4 w-4 mr-1" />
              Slet
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push(basePath)}>Annuller</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Gemmer...' : note ? 'Opdater' : 'Opret'}
          </Button>
        </div>
      </div>
    </form>
  )
}
