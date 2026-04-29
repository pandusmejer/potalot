import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Hent nuværende user ID fra session. Smider redirect til /login hvis ikke logged in.
 * Brug i alle Server Components + Server Actions hvor en bruger er påkrævet.
 */
export async function requireUser(): Promise<{ id: string; email: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { id: user.id, email: user.email ?? null }
}

/** Som requireUser, men returnerer null hvis ingen session — bruges i layouts mv. */
export async function getCurrentUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { id: user.id, email: user.email ?? null }
}
