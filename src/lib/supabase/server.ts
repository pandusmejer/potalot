import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for Server Components, Route Handlers, and Server Actions.
 *
 * Bruger cookies til session — dvs. RLS-policies (auth.uid() = user_id) håndhæves
 * automatisk pr. logged-in user. Anvend altid denne i stedet for service-role.
 * cache(): én klient-instans pr. request (deler cookieStore; ingen delt state på tværs).
 */
export const createClient = cache(async (): Promise<SupabaseClient> => {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase env vars mangler. Tjek NEXT_PUBLIC_SUPABASE_URL og NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components kan ikke sætte cookies — middleware/route handlers gør det
        }
      },
    },
  })
})
