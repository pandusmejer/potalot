/**
 * Fælles oversættelse af Supabase-auth-fejl til dansk (Anna, NAV-batchen):
 * brugeren må ALDRIG se en rå fejl fra Supabase/Postgres/HTTP — kendte
 * fejl mappes, resten får en kontekstuel dansk fallback, og den tekniske
 * detalje logges i konsollen.
 */

import { KODEORD_MIN_TEGN } from '@/lib/kodeord'

type Besked = string | ((match: RegExpExecArray) => string)

const KENDTE: Array<{ moenster: RegExp; besked: Besked }> = [
  { moenster: /already registered|already been registered/i, besked: 'Der findes allerede en konto med den mail.' },
  { moenster: /invalid login credentials/i, besked: 'Forkert mail eller kodeord. Brug “Glemt kodeord”, hvis du ikke kan logge ind.' },
  { moenster: /email not confirmed/i, besked: 'Kontoen er ikke bekræftet endnu. Åbn bekræftelseslinket i din mail først.' },
  // Længdekravet er Supabase-projektets, ikke vores gæt: står tallet i
  // serverens svar, ekkoer vi det. Potalots egne formularer afviser i
  // forvejen alt under KODEORD_MIN_TEGN, så beskeden her er sikkerhedsnet.
  { moenster: /password should be at least (\d+) character/i, besked: m => `Kodeordet skal være på mindst ${m[1]} tegn.` },
  { moenster: /password should be at least/i, besked: `Kodeordet skal være på mindst ${KODEORD_MIN_TEGN} tegn.` },
  { moenster: /should be different from the old password|same password/i, besked: 'Det nye kodeord skal være forskelligt fra det gamle.' },
  { moenster: /rate limit|for security purposes/i, besked: 'For mange forsøg. Vent et øjeblik, og prøv igen.' },
  { moenster: /invalid email|unable to validate email/i, besked: 'Mailadressen ser ikke rigtig ud. Tjek den, og prøv igen.' },
]

export function authFejlBesked(err: { message: string }, fallback: string): string {
  for (const { moenster, besked } of KENDTE) {
    const match = moenster.exec(err.message)
    if (match) return typeof besked === 'function' ? besked(match) : besked
  }
  console.error('auth-fejl (vist som fallback):', err.message)
  return fallback
}
