'use server'

import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Kun navnene på brugerens frø — bruges af statiske kategorisider til
 * MINE FRØ-chippen (klient-hydreret; render-stien kan ikke læse cookies).
 */
export async function getMineFroeNavne(): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory_items')
    .select('name')
    .eq('user_id', user.id)
  return ((data ?? []) as { name: string }[]).map((r) => r.name)
}
