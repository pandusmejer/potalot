/**
 * Fælles oversættelse af Supabase-auth-fejl til dansk (Anna, NAV-batchen):
 * brugeren må ALDRIG se en rå fejl fra Supabase/Postgres/HTTP — kendte
 * fejl mappes, resten får en kontekstuel dansk fallback, og den tekniske
 * detalje logges i konsollen.
 */

const KENDTE: Array<{ moenster: RegExp; besked: string }> = [
  { moenster: /already registered|already been registered/i, besked: 'Der findes allerede en konto med den mail.' },
  { moenster: /invalid login credentials/i, besked: 'Forkert mail eller kodeord. Brug “Glemt kodeord”, hvis du ikke kan logge ind.' },
  { moenster: /email not confirmed/i, besked: 'Kontoen er ikke bekræftet endnu. Åbn bekræftelseslinket i din mail først.' },
  { moenster: /password should be at least/i, besked: 'Kodeordet skal være på mindst 6 tegn.' },
  { moenster: /should be different from the old password|same password/i, besked: 'Det nye kodeord skal være forskelligt fra det gamle.' },
  { moenster: /rate limit|for security purposes/i, besked: 'For mange forsøg. Vent et øjeblik, og prøv igen.' },
  { moenster: /invalid email|unable to validate email/i, besked: 'Mailadressen ser ikke rigtig ud. Tjek den, og prøv igen.' },
]

export function authFejlBesked(err: { message: string }, fallback: string): string {
  for (const { moenster, besked } of KENDTE) {
    if (moenster.test(err.message)) return besked
  }
  console.error('auth-fejl (vist som fallback):', err.message)
  return fallback
}
