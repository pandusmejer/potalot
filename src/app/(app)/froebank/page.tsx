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

  // Subcategories table may not exist yet — fail gracefully
  let customSubcategories: Array<{ id: string; user_id: string; primary_category: string; name: string; created_at: string }> = []
  try {
    const subcategoriesRes = await supabase
      .from('seed_subcategories')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    if (subcategoriesRes.data) customSubcategories = subcategoriesRes.data
  } catch {
    // Table doesn't exist yet — that's fine
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Frøbank</h1>
        <p className="text-sm text-muted-foreground">Alle dine frø, løg, knolde og planter samlet ét sted</p>
      </div>
      <SeedBank
        seeds={seedsRes.data ?? []}
        guides={guidesRes.data ?? []}
        customSubcategories={customSubcategories}
      />
    </div>
  )
}
