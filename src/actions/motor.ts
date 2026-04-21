'use server'

import { koerMotor } from '@/lib/motor/engine'
import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'

/**
 * Kald motoren manuelt (fx fra Hjem-siden ved load).
 */
export async function triggerMotor() {
  try {
    const result = await koerMotor()
    revalidatePath('/')
    revalidatePath('/dashboard')
    return { success: true, ...result }
  } catch {
    return { error: 'Motoren kunne ikke opdatere forslag' }
  }
}

/**
 * Afvis et motor-forslag (marker som completed med note).
 * Dedup i motoren forhindrer at samme forslag genopstår de næste 24t.
 */
export async function afvisForslag(taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({
      completed_at: new Date().toISOString(),
      description: (await supabase.from('tasks').select('description').eq('id', taskId).single()).data?.description
        + '\n\n(Afvist)',
    })
    .eq('id', taskId)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Marker opgave som udført (samme som normal complete — men med revalidate).
 */
export async function udfoerForslag(taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { success: true }
}
