/**
 * Små udgaver af brugerens egne fotos til thumbnails (Frøbank og Mine planter).
 *
 * Brugerens uploadede fotos ligger i Supabase Storage i fuld størrelse (op til
 * flere MB). En 48×60 px thumbnail skal ikke hente originalen: accepttesten
 * 6/11 målte seks fotos på ca. 19 MB på én Frøbank-visning. Billedet sendes i
 * stedet gennem `/_next/image` (på Netlify: Netlify Image CDN), der leverer en
 * lille webp i den størrelse skærmen faktisk bruger.
 *
 * Kun brugerens egne Supabase-fotos omskrives. Kuraterede billeder i
 * `/images/*` er allerede genkomprimeret og returneres uændret, ligesom alt,
 * der ikke er en offentlig Supabase Storage-URL. Originalen røres aldrig —
 * detaljevisninger bruger den som før.
 *
 * Skal forblive en ren funktion uden imports (bruges i klient og i tests).
 */

/** Størrelser skal være i Next's `imageSizes`/`deviceSizes` (/_next/image afviser andre). */
export const THUMB_BREDDER = [64, 128, 256] as const

const OFFENTLIG_STI = '/storage/v1/object/public/'

/** Er det en offentlig Supabase Storage-URL på dette projekts host? */
export function erSupabaseFoto(src: string | null | undefined, supabaseUrl?: string | null): boolean {
  if (!src || !supabaseUrl) return false
  let host: string
  try {
    host = new URL(supabaseUrl).host
  } catch {
    return false
  }
  try {
    const u = new URL(src)
    return u.protocol === 'https:' && u.host === host && u.pathname.startsWith(OFFENTLIG_STI)
  } catch {
    return false
  }
}

/** `/_next/image`-adressen for en given bredde (pixels). */
export function thumbUrl(src: string, bredde: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${bredde}&q=75`
}

/**
 * srcset til en thumbnail på 1x/2x/3x skærme, eller null hvis billedet ikke
 * skal omskrives (så kalderen bruger src uændret).
 */
export function thumbSrcSet(src: string | null | undefined, supabaseUrl?: string | null): string | null {
  if (!src || !erSupabaseFoto(src, supabaseUrl)) return null
  const [b1, b2, b3] = THUMB_BREDDER
  return `${thumbUrl(src, b1)} 1x, ${thumbUrl(src, b2)} 2x, ${thumbUrl(src, b3)} 3x`
}

/** `src` til de skærme, der ikke forstår srcset (og som fallback): 1x-udgaven. */
export function thumbSrc(src: string | null | undefined, supabaseUrl?: string | null): string | null {
  if (!src || !erSupabaseFoto(src, supabaseUrl)) return null
  return thumbUrl(src, THUMB_BREDDER[1])
}
