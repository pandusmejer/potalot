export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { InventoryList } from '@/components/inventory/inventory-list'

export default async function InventoryPage() {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const [seedsRes, plantsRes, guidesRes] = await Promise.all([
    supabase
      .from('seeds')
      .select('*, guide:plant_guides(name_da)')
      .eq('user_id', userId)
      .order('name'),
    supabase
      .from('plants')
      .select('*, guide:plant_guides(name_da)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('plant_guides')
      .select('*')
      .order('name_da'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Beholdning</h1>
        <p className="text-sm text-muted-foreground">Dine frø og planter</p>
      </div>
      <InventoryList
        seeds={seedsRes.data ?? []}
        plants={plantsRes.data ?? []}
        guides={guidesRes.data ?? []}
      />
    </div>
  )
}