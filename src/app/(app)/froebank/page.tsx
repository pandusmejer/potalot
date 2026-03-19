export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { SeedBank } from '@/components/froebank/seed-bank'

export default async function FroebankPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const [seedsRes, guidesRes] = await Promise.all([
    supabase
      .from('seeds')
      .select('*, guide:plant_guides(name_da)')
      .eq('user_id', userId)
      .order('name'),
    supabase
      .from('plant_guides')
      .select('*')
      .order('name_da'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Frøbank</h1>
        <p className="text-sm text-muted-foreground">Alle dine frø samlet ét sted</p>
      </div>
      <SeedBank
        seeds={seedsRes.data ?? []}
        guides={guidesRes.data ?? []}
      />
    </div>
  )
}
