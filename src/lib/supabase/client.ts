import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client. Bruges i Client Components til auth-flows
 * (signInWithOtp, signOut osv.). Læser session fra cookies sat af serveren.
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase env vars mangler i browser.')
  }

  return createBrowserClient(url, anonKey)
}
