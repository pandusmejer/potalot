import { Badge } from '@/components/ui/badge'
import type { Note } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface NoteCardProps {
  note: Note
  basePath?: string
}

export function NoteCard({ note, basePath = '/dyrkningslog' }: NoteCardProps) {
  return (
    <Link href={`${basePath}/${note.id}`} className="block">
      <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground line-clamp-1">{note.title}</h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(note.note_date)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{note.content}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {note.plant && (
            <Badge className="bg-green-100 text-green-800">{note.plant.name}</Badge>
          )}
          {note.tags?.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      </div>
    </Link>
  )
}
