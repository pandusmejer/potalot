export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { NoteEditor } from '@/components/notes/note-editor'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DyrkningslogDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const { data: plants } = await supabase
    .from('plants')
    .select('id, name, variety')
    .eq('user_id', userId)
    .not('status', 'in', '("done","dead")')

  if (id === 'new') {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-foreground mb-6">Nyt log-indlæg</h1>
        <NoteEditor plants={plants ?? []} basePath="/dyrkningslog" />
      </div>
    )
  }

  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!note) notFound()

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-foreground mb-6">Rediger log-indlæg</h1>
      <NoteEditor note={note} plants={plants ?? []} basePath="/dyrkningslog" />
    </div>
  )
}
