'use server'

import { createClient } from '@/lib/supabase/server'
import { DEMO_USER_ID } from '@/lib/demo'
import { revalidatePath } from 'next/cache'
import type { UserMode } from '@/lib/user-modes'

export async function sætUserMode(mode: UserMode) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ user_mode: mode, onboarded: true })
    .eq('id', DEMO_USER_ID)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function hentOnboardingStatus() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('onboarded, user_mode, display_name')
    .eq('id', DEMO_USER_ID)
    .maybeSingle()
  return data
}
