export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { LogFeed } from '@/components/dyrkningslog/log-feed'

export default async function DyrkningslogPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const [notesRes, plantsRes] = await Promise.all([
    supabase
      .from('notes')
      .select('*, plant:plants(name)')
      .eq('user_id', userId)
      .order('note_date', { ascending: false }),
    supabase
      .from('plants')
      .select('id, name')
      .eq('user_id', userId)
      .not('status', 'in', '("done","dead")')
      .order('name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dyrkningslog</h1>
        <p className="text-sm text-muted-foreground">Din dyrkningsjournal — observationer, høst og læring</p>
      </div>
      <LogFeed
        notes={notesRes.data ?? []}
        plants={plantsRes.data ?? []}
      />
    </div>
  )
}
