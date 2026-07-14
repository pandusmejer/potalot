'use server'

import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Slet den indloggede brugers konto + ALLE deres data (F3, GDPR).
 *
 * To trin via service-role-klienten:
 *   1. delete_account(userId) — DB-funktion (00057) der rydder alle 39 bruger-
 *      tabeller og returnerer de tabeller den IKKE kunne rydde ([] = fuld sletning).
 *   2. auth.admin.deleteUser(userId) — sletter selve login-brugeren.
 *
 * userId hentes fra den autentificerede session (requireUser) — en bruger kan
 * ALDRIG slette en anden. Kræver at brugeren har skrevet "SLET".
 */
export async function deleteAccount(confirm: string): Promise<{ ok: true } | { error: string }> {
  if (confirm !== 'SLET') {
    return { error: 'Skriv SLET (med store bogstaver) for at bekræfte.' }
  }

  const { id: userId } = await requireUser()
  const admin = createAdminClient()

  // 1. Slet al brugerens data. Funktionen returnerer blokerede tabeller.
  const { data: blocked, error: dataErr } = await admin.rpc('delete_account', { p_user: userId })
  if (dataErr) {
    return { error: `Kunne ikke slette dine data lige nu — prøv igen om lidt. (${dataErr.message})` }
  }
  if (Array.isArray(blocked) && blocked.length > 0) {
    return { error: 'Noget data kunne ikke slettes fuldstændigt. Din konto er IKKE slettet — prøv igen eller kontakt os.' }
  }

  // 2. Slet selve login-brugeren (session bliver derefter ugyldig).
  const { error: authErr } = await admin.auth.admin.deleteUser(userId)
  if (authErr) {
    return { error: `Dine data er slettet, men login-kontoen kunne ikke fjernes helt — prøv igen. (${authErr.message})` }
  }

  return { ok: true }
}
