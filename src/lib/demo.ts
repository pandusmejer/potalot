// Demo user for single-user MVP mode
// When auth is added later, replace usages of DEMO_USER_ID with auth.uid()

import type { SupabaseClient } from '@supabase/supabase-js'

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

let _ensured = false

/**
 * Auto-create demo user profile if it doesn't exist.
 * Call once on app startup (e.g. from app layout).
 */
export async function ensureDemoUser(supabase: SupabaseClient) {
  if (_ensured) return
  _ensured = true

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', DEMO_USER_ID)
    .single()

  if (data) return

  // Create auth user with specific UUID (requires service role key)
  await supabase.auth.admin.createUser({
    id: DEMO_USER_ID,
    email: 'demo@potalot.app',
    password: 'demo-not-used',
    email_confirm: true,
  })

  // Upsert profile in case the trigger didn't fire
  await supabase.from('profiles').upsert({
    id: DEMO_USER_ID,
    display_name: 'Demo Gartner',
  })
}
