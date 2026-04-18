'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { Garden } from '@/lib/types'

export async function getGardens(): Promise<Garden[]> {
  const userId = DEMO_USER_ID
  const supabase = await createClient()
  const { data } = await supabase
    .from('gardens')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function getDefaultGarden(): Promise<Garden | null> {
  const userId = DEMO_USER_ID
  const supabase = await createClient()
  const { data } = await supabase
    .from('gardens')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  return data
}

export async function createGarden(formData: FormData) {
  const userId = DEMO_USER_ID
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Navn er påkrævet' }

  const lat = formData.get('latitude')
  const lng = formData.get('longitude')

  const { data, error } = await supabase
    .from('gardens')
    .insert({
      user_id: userId,
      name,
      latitude: lat ? Number(lat) : null,
      longitude: lng ? Number(lng) : null,
      notes: (formData.get('notes') as string)?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true, gardenId: data.id }
}

export async function updateGarden(gardenId: string, formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Navn er påkrævet' }

  const lat = formData.get('latitude')
  const lng = formData.get('longitude')

  const { error } = await supabase
    .from('gardens')
    .update({
      name,
      latitude: lat ? Number(lat) : null,
      longitude: lng ? Number(lng) : null,
      notes: (formData.get('notes') as string)?.trim() || null,
    })
    .eq('id', gardenId)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function setDefaultGarden(gardenId: string) {
  const userId = DEMO_USER_ID
  const supabase = await createClient()

  // Unset all
  await supabase
    .from('gardens')
    .update({ is_default: false })
    .eq('user_id', userId)

  // Set this one
  const { error } = await supabase
    .from('gardens')
    .update({ is_default: true })
    .eq('id', gardenId)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function deleteGarden(gardenId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('gardens')
    .delete()
    .eq('id', gardenId)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
