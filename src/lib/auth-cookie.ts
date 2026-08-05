/**
 * Klient-side heuristik: har browseren en Supabase-auth-cookie?
 *
 * Bruges af skallen på STATISK genererede sider, hvor serveren ikke kunne
 * læse cookies ved build: den anonyme grundform er bagt ind i HTML'en, og
 * klienten opgraderer til logget ind-tilstand når cookien findes.
 * (@supabase/ssr's cookies er JS-læsbare; chunkede varianter hedder
 * sb-<ref>-auth-token.0 osv. — derfor includes, ikke lighed.)
 */
export function harAuthCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split('; ')
    .some((c) => c.startsWith('sb-') && c.includes('-auth-token'))
}
