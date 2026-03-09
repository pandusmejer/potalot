'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'

export async function updateNotificationPreferences(formData: FormData) {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const prefs = {
    user_id: userId,
    push_enabled: formData.get('push_enabled') === 'on',
    daily_reminder_time: (formData.get('daily_reminder_time') as string) || '08:00',
    remind_task_due: formData.get('remind_task_due') === 'on',
    remind_days_before: Number(formData.get('remind_days_before') || 1),
    remind_watering: formData.get('remind_watering') === 'on',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(prefs, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const userId = DEMO_USER_ID
  

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: formData.get('display_name') as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}
