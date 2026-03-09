'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const { error } = await supabase.from('tasks').insert({
    user_id: userId,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    task_type: formData.get('task_type') as string,
    due_date: formData.get('due_date') as string,
    plant_id: (formData.get('plant_id') as string) || null,
    priority: (formData.get('priority') as string) || 'medium',
  })

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function uncompleteTask(taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ completed_at: null })
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}
