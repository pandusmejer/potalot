/**
 * Fælles oversættelse af database-, storage- og netværksfejl til dansk.
 *
 * Samme regel som for auth (src/lib/auth-fejl.ts, Anna 12/8): brugeren må
 * ALDRIG se en rå fejl fra Supabase/Postgres/HTTP. Kendte fejl mappes,
 * resten får en kontekstuel dansk fallback fra kaldestedet, og den tekniske
 * detalje logges server-side.
 *
 * `return { error: error.message }` er derfor forbudt i server actions og
 * API-ruter. Kaldestedet skal sige, hvad der ikke lykkedes — det er den
 * eneste der ved det.
 */

/** Det, både PostgrestError, StorageError og en almindelig Error opfylder. */
export interface TekniskFejl {
  message: string
  code?: string | null
  /** Storage-fejl bruger statusCode i stedet for code. */
  statusCode?: string | number | null
}

/** Postgres/PostgREST-koder med en entydig brugerbetydning. */
const KENDTE_KODER: Readonly<Record<string, string>> = {
  '23505': 'Det findes allerede.',
  '23503': 'Noget af det, handlingen peger på, findes ikke længere. Genindlæs siden.',
  '23514': 'Værdien kan ikke bruges her.',
  '22001': 'Teksten er for lang.',
  '42501': 'Du har ikke adgang til det her.',
  PGRST116: 'Vi kunne ikke finde det, du prøvede at ændre. Måske er det allerede slettet.',
  PGRST301: 'Din session er udløbet. Log ind igen.',
}

const KENDTE_BESKEDER: Array<{ moenster: RegExp; besked: string }> = [
  { moenster: /row-level security|violates row-level security/i, besked: 'Du har ikke adgang til det her.' },
  { moenster: /jwt expired|invalid claim|not authenticated/i, besked: 'Din session er udløbet. Log ind igen.' },
  { moenster: /payload too large|exceeded the maximum allowed size/i, besked: 'Filen er for stor.' },
  { moenster: /the resource already exists|duplicate/i, besked: 'Det findes allerede.' },
  { moenster: /bucket not found|object not found|not_found/i, besked: 'Vi kunne ikke finde filen. Måske er den allerede slettet.' },
  { moenster: /mime type|invalid file type/i, besked: 'Filtypen kan ikke bruges her.' },
  { moenster: /fetch failed|network|econnreset|etimedout|timeout/i, besked: 'Forbindelsen svigtede. Tjek nettet, og prøv igen.' },
  { moenster: /rate limit|too many requests/i, besked: 'For mange forsøg. Vent et øjeblik, og prøv igen.' },
]

/**
 * Dansk besked til brugeren.
 *
 * @param fejl      den tekniske fejl fra Supabase/HTTP
 * @param fallback  hvad der IKKE lykkedes, skrevet af kaldestedet
 *                  ("Kunne ikke slette gruppen. Prøv igen.")
 */
export function dataFejlBesked(fejl: TekniskFejl | null | undefined, fallback: string): string {
  if (!fejl) return fallback

  const kode = fejl.code != null ? String(fejl.code) : ''
  const kendtKode = KENDTE_KODER[kode]
  if (kendtKode) return kendtKode

  const besked = fejl.message ?? ''
  for (const { moenster, besked: dansk } of KENDTE_BESKEDER) {
    if (moenster.test(besked)) return dansk
  }

  // Ukendt fejl: brugeren får kaldestedets kontekst, vi får detaljen.
  console.error('data-fejl (vist som fallback):', { kode: kode || undefined, besked })
  return fallback
}

/**
 * Til API-ruter, der fanger en exception i stedet for at få et error-objekt.
 * `String(e)` og `${err.message}` i et JSON-svar er den samme læk.
 */
export function fangetFejlBesked(e: unknown, fallback: string): string {
  if (e instanceof Error) return dataFejlBesked(e, fallback)
  console.error('data-fejl (ikke en Error, vist som fallback):', e)
  return fallback
}
