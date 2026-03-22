'use client'

import { createNote, updateNote, deleteNote } from '@/actions/notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { LOG_TYPES, type LogType } from '@/lib/constants'
import type { Note } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Trash2, Eye, Apple, AlertTriangle, Lightbulb, Flag, Cloud, PenLine } from 'lucide-react'

const LOG_ICONS: Record<string, React.ReactNode> = {
  observation: <Eye className="h-3.5 w-3.5" />,
  harvest: <Apple className="h-3.5 w-3.5" />,
  problem: <AlertTriangle className="h-3.5 w-3.5" />,
  learning: <Lightbulb className="h-3.5 w-3.5" />,
  milestone: <Flag className="h-3.5 w-3.5" />,
  weather: <Cloud className="h-3.5 w-3.5" />,
  other: <PenLine className="h-3.5 w-3.5" />,
}

function getLogTypeFromTags(tags: string[] | null): LogType | '' {
  if (!tags) return ''
  for (const tag of tags) {
    if (tag in LOG_TYPES) return tag as LogType
  }
  return ''
}

function getOtherTags(tags: string[] | null): string {
  if (!tags) return ''
  return tags.filter(t => !(t in LOG_TYPES)).join(', ')
}

interface NoteEditorProps {
  note?: Note | null
  plants: { id: string; name: string; variety?: string | null }[]
  basePath?: string
}

export function NoteEditor({ note, plants, basePath = '/dyrkningslog' }: NoteEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [logType, setLogType] = useState<LogType | ''>(getLogTypeFromTags(note?.tags ?? null))

  function handleSubmit(formData: FormData) {
    setError(null)

    // Merge log type into tags
    const tagsRaw = formData.get('tags') as string
    const userTags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
    if (logType) {
      userTags.unshift(logType)
    }

    // Replace tags in formData
    formData.set('tags', userTags.join(', '))

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
      {/* Log type quick-select */}
      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(LOG_TYPES).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => setLogType(logType === key ? '' : key as LogType)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                logType === key
                  ? `${meta.color} border-current`
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              {LOG_ICONS[key]}
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Titel</label>
        <Input name="title" required defaultValue={note?.title ?? ''} placeholder="Hvad observerede du?" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Indhold</label>
        <Textarea
          name="content"
          required
          rows={8}
          defaultValue={note?.content ?? ''}
          placeholder="Beskriv din observation, læring eller bemærkning..."
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
        <label className="block text-sm font-medium mb-1">Ekstra tags (kommasepareret)</label>
        <Input
          name="tags"
          defaultValue={getOtherTags(note?.tags ?? null)}
          placeholder="fx. drivhus, 2026"
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
