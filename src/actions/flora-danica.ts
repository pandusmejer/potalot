'use server'

import { godkendAsset as _godkend, afvisAsset as _afvis, genererFloraDanicaAsset } from '@/lib/flora-danica/assets'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function godkendAsset(varietyId: string) {
  const result = await _godkend(varietyId)
  revalidatePath('/settings/flora-danica')
  return result
}

export async function afvisAsset(varietyId: string) {
  const result = await _afvis(varietyId)
  revalidatePath('/settings/flora-danica')
  return result
}

export async function regenererAsset(varietyId: string) {
  const supabase = await createClient()
  const { data: variety } = await supabase
    .from('varieties')
    .select('species_name, variety_name, botanical_name')
    .eq('id', varietyId)
    .single()

  if (!variety) return { error: 'Sort ikke fundet' }

  const result = await genererFloraDanicaAsset(varietyId, {
    species_name: variety.species_name,
    variety_name: variety.variety_name,
    botanical_name: variety.botanical_name,
  })

  revalidatePath('/settings/flora-danica')

  if (!result.success) return { error: result.error }
  return { success: true }
}
