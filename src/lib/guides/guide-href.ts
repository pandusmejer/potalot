/**
 * Rute-adskillelse for guide-detaljer (perf-sprint 5/8 2026):
 *
 *   /guides/[id]       = redaktionelle Potalot-guides (statiske slugs som
 *                        'aert', 'tomat-san-marzano') — statisk genereret.
 *   /guides/mine/[id]  = brugerens egne + AI-genererede guides (DB-uuid'er,
 *                        RLS/login) — dynamisk og adgangskontrolleret.
 *
 * DB-guides har uuid-id'er; redaktionelle har kebab-slugs. Uuid-formen er
 * derfor et pålideligt diskriminator-felt. Gamle /guides/<uuid>-links (fx i
 * gemte notifikationer) redirectes af proxyen.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isDbGuideId(id: string): boolean {
  return UUID_RE.test(id)
}

export function guideHref(id: string, returnTo?: string): string {
  const base = isDbGuideId(id) ? `/guides/mine/${id}` : `/guides/${id}`
  return returnTo ? `${base}?returnTo=${encodeURIComponent(returnTo)}` : base
}
