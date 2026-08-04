import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/** Som requireUser, men returnerer null hvis ingen session — bruges i layouts mv.
 * cache(): auth.getUser() er et netværkskald mod Supabase Auth; memoiseres pr.
 * request så en sideåbning med mange actions kun betaler ét auth-hop. */
export const getCurrentUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { id: user.id, email: user.email ?? null }
})

/**
 * Hent nuværende user ID fra session. Smider redirect til /login hvis ikke logged in.
 * Brug i alle Server Components + Server Actions hvor en bruger er påkrævet.
 */
export async function requireUser(): Promise<{ id: string; email: string | null }> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/** Sikrer at den loggede-ind bruger er admin. Smider redirect til '/' ellers. */
export async function requireAdmin(): Promise<{ id: string; email: string | null }> {
  const user = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!data?.is_admin) redirect('/')
  return user
}

/** True hvis logged-in bruger er admin. False ellers (også hvis ikke logged in). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  return data?.is_admin === true
}
