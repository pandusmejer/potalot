import { createClient } from '@supabase/supabase-js'

/**
 * Admin (service-role) Supabase-klient — bypasser RLS og kan bruge auth-admin
 * (fx sletning af login-brugere).
 *
 * ⚠️ KUN server-side, i afgrænsede, autoriserede handlinger (fx konto-sletning).
 * Service-role-nøglen (SUPABASE_SERVICE_ROLE_KEY) må ALDRIG eksponeres til
 * klienten eller bruges i almindelige data-flows — brug createClient() (anon +
 * RLS) til alt andet.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Service-role env vars mangler (SUPABASE_SERVICE_ROLE_KEY).')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
