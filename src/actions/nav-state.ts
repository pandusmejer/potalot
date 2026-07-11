'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export interface NavState {
  /** Hvilket nav-item skal være "hero" (visuelt dominerende). */
  heroHref: '/froebank' | '/mine-planter'
  /** Antal kritiske + forsinkede + i-dag-opgaver (åbne). Bruges som badge. */
  criticalTaskCount: number
}

export async function getNavState(): Promise<NavState> {
  const user = await getCurrentUser()
  if (!user) {
    // Demo viser en etableret have (mock-planter) → Planter er den primære
    // destination, så Frøbank ikke fejlagtigt dominerer bundnavet.
    return { heroHref: '/mine-planter', criticalTaskCount: 0 }
  }
  const userId = user.id
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const [plantsCount, taskCount] = await Promise.all([
    supabase
      .from('plants_v2')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false)
      .then(r => r.count ?? 0),
    supabase
      .from('calendar_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'open')
      .lte('date', today)
      .then(r => r.count ?? 0),
  ])

  return {
    heroHref: plantsCount > 0 ? '/mine-planter' : '/froebank',
    criticalTaskCount: taskCount,
  }
}
