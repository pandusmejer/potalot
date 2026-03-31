export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { GuideLibrary } from '@/components/guides/guide-library'

export default async function GuidesPage() {
  const supabase = await createClient()

  const { data: guides } = await supabase
    .from('plant_guides')
    .select('*')
    .order('category')
    .order('name_da')

  return <GuideLibrary guides={guides ?? []} />
}
