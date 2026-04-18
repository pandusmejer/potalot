'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { Placering, Exposure, LightLevel } from '@/lib/types'

// Skabeloner med default-flags. Brugeren ser kun navn, flags sættes auto.
export const PLACERING_TEMPLATES: Record<string, {
  label: string
  exposure: Exposure
  light_level: LightLevel
  sheltered: boolean
  heated: boolean
}> = {
  vindue_meget_sol: { label: 'Vindue (meget sollys)', exposure: 'indendoers', light_level: 'meget', sheltered: true, heated: true },
  vindue_noget_sol: { label: 'Vindue (noget sollys)', exposure: 'indendoers', light_level: 'noget', sheltered: true, heated: true },
  vindue_lidt_sol: { label: 'Vindue (lidt sollys)', exposure: 'indendoers', light_level: 'lidt', sheltered: true, heated: true },
  bundvarme: { label: 'Bundvarme / spiringsbord', exposure: 'indendoers', light_level: 'noget', sheltered: true, heated: true },
  drivhus_uopvarmet: { label: 'Drivhus (uopvarmet)', exposure: 'drivhus', light_level: 'meget', sheltered: true, heated: false },
  drivhus_opvarmet: { label: 'Drivhus (opvarmet)', exposure: 'drivhus', light_level: 'meget', sheltered: true, heated: true },
  drivhus_kold_kasse: { label: 'Kold kasse', exposure: 'drivhus', light_level: 'meget', sheltered: true, heated: false },
  polytunnel: { label: 'Polytunnel', exposure: 'tunnel', light_level: 'meget', sheltered: true, heated: false },
  altan_meget_sol: { label: 'Altan (meget sol)', exposure: 'altan', light_level: 'meget', sheltered: false, heated: false },
  altan_lidt_sol: { label: 'Altan (lidt sol)', exposure: 'altan', light_level: 'lidt', sheltered: false, heated: false },
  hoejbed: { label: 'Højbed', exposure: 'friland', light_level: 'meget', sheltered: false, heated: false },
  friland_solrigt_eksponeret: { label: 'Friland (solrigt og eksponeret)', exposure: 'friland', light_level: 'meget', sheltered: false, heated: false },
  friland_solrigt_laee: { label: 'Friland (solrigt og i læ)', exposure: 'friland', light_level: 'meget', sheltered: true, heated: false },
  staudebed_halvskygge: { label: 'Staudebed (halvskygge)', exposure: 'friland', light_level: 'noget', sheltered: false, heated: false },
  krukker_terrasse: { label: 'Krukker på terrasse', exposure: 'altan', light_level: 'meget', sheltered: false, heated: false },
  skyggebed: { label: 'Skyggebed', exposure: 'friland', light_level: 'lidt', sheltered: false, heated: false },
}

export async function getPlaceringer(gardenId?: string): Promise<Placering[]> {
  const userId = DEMO_USER_ID
  const supabase = await createClient()
  let query = supabase
    .from('placeringer')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  if (gardenId) query = query.eq('garden_id', gardenId)

  const { data } = await query
  return data ?? []
}

export async function createPlacering(formData: FormData) {
  const userId = DEMO_USER_ID
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const gardenId = formData.get('garden_id') as string
  if (!name) return { error: 'Navn er påkrævet' }
  if (!gardenId) return { error: 'Have er påkrævet' }

  const template = (formData.get('template') as string) || null

  // Auto-fill flags from template if available, else from form
  let exposure: Exposure | null = (formData.get('exposure') as Exposure) || null
  let light_level: LightLevel | null = (formData.get('light_level') as LightLevel) || null
  let sheltered = formData.get('sheltered') === 'true'
  let heated = formData.get('heated') === 'true'

  if (template && PLACERING_TEMPLATES[template]) {
    const tpl = PLACERING_TEMPLATES[template]
    exposure = tpl.exposure
    light_level = tpl.light_level
    sheltered = tpl.sheltered
    heated = tpl.heated
  }

  const minTempC = formData.get('min_temp_c')

  const { data, error } = await supabase
    .from('placeringer')
    .insert({
      garden_id: gardenId,
      user_id: userId,
      name,
      template,
      exposure,
      light_level,
      sheltered,
      heated,
      min_temp_c: minTempC ? Number(minTempC) : null,
      notes: (formData.get('notes') as string)?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true, placeringId: data.id }
}

export async function updatePlacering(placeringId: string, formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Navn er påkrævet' }

  const minTempC = formData.get('min_temp_c')

  const { error } = await supabase
    .from('placeringer')
    .update({
      name,
      template: (formData.get('template') as string) || null,
      exposure: (formData.get('exposure') as Exposure) || null,
      light_level: (formData.get('light_level') as LightLevel) || null,
      sheltered: formData.get('sheltered') === 'true',
      heated: formData.get('heated') === 'true',
      min_temp_c: minTempC ? Number(minTempC) : null,
      notes: (formData.get('notes') as string)?.trim() || null,
    })
    .eq('id', placeringId)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function deletePlacering(placeringId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('placeringer')
    .delete()
    .eq('id', placeringId)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
