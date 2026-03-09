export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { NoteCard } from '@/components/notes/note-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { StickyNote, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function NotesPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const { data: notes } = await supabase
    .from('notes')
    .select('*, plant:plants(name)')
    .eq('user_id', userId)
    .order('note_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Noter & Læring</h1>
          <p className="text-sm text-muted-foreground">Din dyrkningsjournal</p>
        </div>
        <Link href="/notes/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Ny note
          </Button>
        </Link>
      </div>

      {!notes || notes.length === 0 ? (
        <EmptyState
          icon={<StickyNote className="h-10 w-10" />}
          title="Ingen noter endnu"
          description="Tilføj din første note for at begynde at opbygge din dyrkningsviden."
          action={
            <Link href="/notes/new">
              <Button size="sm">Opret note</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}