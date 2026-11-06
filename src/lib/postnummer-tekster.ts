/**
 * Brugertekster til postnummeropslag — bevidst UDEN import af selve
 * postnummertabellen (53 kB), så klientkomponenter trygt kan importere herfra.
 *
 * Der er tre forskellige situationer, og brugeren skal kunne skelne dem:
 *   1. Format forkert (ikke 4 cifre)        → komponenten tjekker selv
 *   2. Postnummeret findes ikke / kan ikke bruges → lookupPostnummer giver null
 *   3. Teknisk fejl (serverkaldet fejlede)  → POSTNR_TEKNISK_FEJL
 */

/** Serverkaldet til opslaget fejlede (netværk, ny version af appen m.m.) — IKKE brugerens skyld. */
export const POSTNR_TEKNISK_FEJL =
  'Opslaget virkede ikke lige nu. Prøv igen om lidt — det er ikke dit postnummer, der er noget galt med.'
