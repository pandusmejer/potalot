/**
 * Kodeordskravet — ét sted, så UI-tekst og faktisk validering aldrig kan
 * sige to forskellige ting.
 *
 * Potalot håndhæver kravet i klienten (signup, nulstilling, skift kodeord),
 * FØR Supabase kaldes. Det er derfor dette tal — ikke Supabase-projektets
 * eget minimum — der er kontrakten brugeren møder. Supabase' minimum er
 * lavere eller lig med dette; slår det alligevel igennem, ekkoer
 * auth-fejl.ts serverens tal i stedet for at gætte (se src/lib/auth-fejl.ts).
 */
export const KODEORD_MIN_TEGN = 8

/** Hjælpetekst under kodeordsfeltet. */
export const KODEORD_KRAV_TEKST = `Mindst ${KODEORD_MIN_TEGN} tegn.`

/** Fejlbesked når brugerens kodeord er for kort. */
export const KODEORD_FOR_KORT = `Kodeord skal være mindst ${KODEORD_MIN_TEGN} tegn`

/** Fejlbesked når gentagelsen ikke er identisk med kodeordet. */
export const KODEORD_MATCHER_IKKE = 'De to kodeord matcher ikke'
