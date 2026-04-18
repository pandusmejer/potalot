export const dynamic = 'force-dynamic'

import { DEMO_USER_ID } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { HaveView } from '@/components/have/have-view'

interface Props {
  searchParams: Promise<{ filter?: string; placering?: string; sort?: string }>
}

export default async function HavePage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const userId = DEMO_USER_ID

  const [seedsRes, plantsRes, varietiesRes, placeringerRes, gardensRes, guidesRes] = await Promise.all([
    supabase
      .from('seeds')
      .select('*, guide:plant_guides(name_da), variety_ref:varieties(*)')
      .eq('user_id', userId)
      .order('name'),
    supabase
      .from('plants')
      .select('*, guide:plant_guides(*), variety_ref:varieties(*), placering:placeringer(*)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('varieties')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('species_name'),
    supabase
      .from('placeringer')
      .select('*')
      .eq('user_id', userId)
      .order('name'),
    supabase
      .from('gardens')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false }),
    supabase
      .from('plant_guides')
      .select('*')
      .order('name_da'),
  ])

  return (
    <div className="space-y-6">
      <HaveView
        seeds={seedsRes.data ?? []}
        plants={plantsRes.data ?? []}
        varieties={varietiesRes.data ?? []}
        placeringer={placeringerRes.data ?? []}
        gardens={gardensRes.data ?? []}
        guides={guidesRes.data ?? []}
        initialFilter={params.filter ?? 'alle'}
        initialPlacering={params.placering}
        initialSort={params.sort}
      />
    </div>
  )
}
