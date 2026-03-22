export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { VaekstDashboard } from '@/components/vaekst/vaekst-dashboard'

export default async function VaekstPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const [plantsRes, guidesRes, seedsRes] = await Promise.all([
    supabase
      .from('plants')
      .select('*, guide:plant_guides(name_da)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('plant_guides')
      .select('*')
      .order('name_da'),
    supabase
      .from('seeds')
      .select('*')
      .eq('user_id', userId)
      .order('name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Vækst</h1>
        <p className="text-sm text-muted-foreground">Dine aktive planter og dyrkningsstatus</p>
      </div>
      <VaekstDashboard
        plants={plantsRes.data ?? []}
        guides={guidesRes.data ?? []}
        seeds={seedsRes.data ?? []}
      />
    </div>
  )
}
