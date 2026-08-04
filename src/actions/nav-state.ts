'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export interface NavState {
  /** Antal kritiske + forsinkede + i-dag-opgaver (åbne). Bruges som badge. */
  criticalTaskCount: number
}

export async function getNavState(): Promise<NavState> {
  const user = await getCurrentUser()
  if (!user) return { criticalTaskCount: 0 }
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Tidligere lå her også en plants_v2-count til heroHref — dens eneste
  // aftager var den uimporterede Sidebar (død kode), så den query er fjernet.
  const { count } = await supabase
    .from('calendar_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'open')
    .lte('date', today)

  return { criticalTaskCount: count ?? 0 }
}
