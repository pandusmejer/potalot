export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { NoteCard } from '@/components/notes/note-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { ClipboardList, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function DyrkningslogPage() {
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
          <h1 className="text-xl font-bold text-foreground">Dyrkningslog</h1>
          <p className="text-sm text-muted-foreground">Din dyrkningsjournal og læring</p>
        </div>
        <Link href="/dyrkningslog/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Ny log
          </Button>
        </Link>
      </div>

      {!notes || notes.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Ingen log-indlæg endnu"
          description="Tilføj dit første indlæg for at begynde at dokumentere din dyrkning."
          action={
            <Link href="/dyrkningslog/new">
              <Button size="sm">Opret indlæg</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} basePath="/dyrkningslog" />
          ))}
        </div>
      )}
    </div>
  )
}
