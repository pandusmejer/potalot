'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'

export async function createNote(formData: FormData) {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const tagsRaw = formData.get('tags') as string
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : null

  const { error } = await supabase.from('notes').insert({
    user_id: userId,
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    plant_id: (formData.get('plant_id') as string) || null,
    guide_id: (formData.get('guide_id') as string) || null,
    tags,
    season_year: new Date().getFullYear(),
    note_date: (formData.get('note_date') as string) || new Date().toISOString().split('T')[0],
  })

  if (error) return { error: error.message }
  revalidatePath('/notes')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateNote(noteId: string, formData: FormData) {
  const supabase = await createClient()

  const tagsRaw = formData.get('tags') as string
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : null

  const { error } = await supabase
    .from('notes')
    .update({
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      plant_id: (formData.get('plant_id') as string) || null,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)

  if (error) return { error: error.message }
  revalidatePath('/notes')
  return { success: true }
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('notes').delete().eq('id', noteId)

  if (error) return { error: error.message }
  revalidatePath('/notes')
  return { success: true }
}
