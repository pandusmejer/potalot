import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Demo mode: use service role key to bypass RLS
// When auth is added later, switch back to @supabase/ssr with cookie-based auth
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
