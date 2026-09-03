/**
 * Uploadgrænser for billeder — ét sted, så route, klient og bruger-copy
 * aldrig kan sige tre forskellige tal (Batch 3, D4, Anna 3/9 2026).
 *
 * Den reelle ydre grænse er Supabase-bucketten `media`:
 * `supabase/migrations/00024_relax_media_bucket.sql` sætter
 * file_size_limit = 10485760 (10 MB). Alt over det afvises af storage,
 * uanset hvad koden ellers lover — så koden lover det samme.
 *
 * HEIC/HEIF (iPhone) har sin egen, LAVERE indgangsgrænse af teknisk grund:
 * heic-convert dekoder hele billedet i hukommelsen på Netlify Functions
 * (1024 MB heap), og over ~12 MB OOM'er den (91ebada, 15/5 2026). Output
 * er JPEG q0,85 og lander langt under bucketgrænsen.
 *
 * Klienten komprimerer normalt FØR upload (compress-image.ts: 2400 px,
 * q0,85), så de fleste filer når aldrig i nærheden. Tallet her er det,
 * brugeren møder, når komprimeringen ikke kan (fx HEIC på desktop).
 */

/** Bucketgrænsen i MB. SKAL matche 00024_relax_media_bucket.sql. */
export const MAKS_BILLEDE_MB = 10
export const MAKS_BILLEDE_BYTES = MAKS_BILLEDE_MB * 1024 * 1024

/** Indgangsgrænse for HEIC/HEIF før konvertering (hukommelse, ikke storage). */
export const MAKS_HEIC_MB = 12
export const MAKS_HEIC_BYTES = MAKS_HEIC_MB * 1024 * 1024

/** iPhone-formater, der konverteres server-side. */
export function erHeic(fil: { name: string; type: string }): boolean {
  const navn = fil.name.toLowerCase()
  return (
    navn.endsWith('.heic') ||
    navn.endsWith('.heif') ||
    fil.type === 'image/heic' ||
    fil.type === 'image/heif'
  )
}

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1)
}

/**
 * Den fejltekst brugeren ser, hvis filen er for stor — eller null, hvis
 * den må uploades. Samme funktion i klient og route, så teksten er én.
 */
export function billedeForStortBesked(fil: { size: number; name: string; type: string }): string | null {
  if (erHeic(fil)) {
    if (fil.size <= MAKS_HEIC_BYTES) return null
    return `iPhone-billede for stort (${mb(fil.size)} MB). Maks. ${MAKS_HEIC_MB} MB for HEIC — prøv at vælge en mindre størrelse i iPhone Kamera-indstillinger eller tag billedet om.`
  }
  if (fil.size <= MAKS_BILLEDE_BYTES) return null
  return `Billede for stort (${mb(fil.size)} MB). Maks. ${MAKS_BILLEDE_MB} MB.`
}
