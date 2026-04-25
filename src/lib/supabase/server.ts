import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client.
 *
 * Bruger service role key i demo-mode (bypasser RLS, single-user).
 * TODO (auth): Når rigtig auth implementeres, switch til @supabase/ssr med
 * cookie-baseret session.
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase env vars mangler. Tjek NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
