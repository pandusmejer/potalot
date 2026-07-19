/**
 * intake-core — ren, testbar logik til guides:intake.
 *
 * Ingen IO. Klassificering (NEW vs UPDATE), foto→guide-matchning,
 * folder-efter-guideniveau og navnenormalisering. Orkestreringen (fs, sharp,
 * execSync) bor i guides-intake.ts; tests dækker funktionerne her.
 */

// ─────────────────────────────────────────────────────────────────
// Normalisering — samme ånd som normalizeGuideKey, men uden src-import
// (scripts må ikke trække Next.js' import-system ind).
// ─────────────────────────────────────────────────────────────────

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // øvrige accenter
    .replace(/['’]/g, '')                              // apostroffer FJERNES
    .replace(/[^a-z0-9]+/g, ' ')                       // alt andet → mellemrum
    .trim()
    .replace(/\s+/g, ' ')
}

// ─────────────────────────────────────────────────────────────────
// Guide-metadata (fra en batch-JSON)
// ─────────────────────────────────────────────────────────────────

export interface GuideMeta {
  slug: string
  guideLevel: 'species' | 'variety'
  parentSlug?: string | null
  plantName: string
  variety?: string | null
}

/** Nøgle et foto kan matche på: normaliseret "art [sort]". */
export function guideKey(g: GuideMeta): string {
  return normalizeName(`${g.plantName} ${g.variety ?? ''}`)
}

/** Slug som ord (bindestreg→mellemrum), normaliseret — også en match-nøgle. */
export function slugKey(slug: string): string {
  return normalizeName(slug.replace(/-/g, ' '))
}

/** art → arts/ · sort → plantekort/  (folder afgøres af NIVEAU, ikke gæt). */
export function folderForLevel(level: GuideMeta['guideLevel']): 'arts' | 'plantekort' {
  return level === 'species' ? 'arts' : 'plantekort'
}

// ─────────────────────────────────────────────────────────────────
// Klassificering: NEW (ny slug) vs UPDATE (findes som live guide)
// ─────────────────────────────────────────────────────────────────

export type Classification = 'new' | 'update'

export function classify(slug: string, liveSlugs: ReadonlySet<string>): Classification {
  return liveSlugs.has(slug) ? 'update' : 'new'
}

// ─────────────────────────────────────────────────────────────────
// Foto → guide-matchning
// ─────────────────────────────────────────────────────────────────

// Kun folder-/rolle-ord der reelt optræder som suffiks på foto-filnavne.
// IKKE 'art' (for kort — ville stjæle et legitimt navne-token).
const ROLE_WORDS = new Set(['plantekort', 'arts', 'frokort', 'froekort', 'hero', 'foto', 'billede'])

/** Fjern filendelse + rolle-ord fra et foto-filnavn og normalisér. */
export function photoNameKey(basename: string): string {
  const noExt = basename.replace(/\.[a-z0-9]+$/i, '')
  const words = normalizeName(noExt)
    .split(' ')
    .filter(w => w && !ROLE_WORDS.has(w))
  return words.join(' ')
}

export type PhotoMatch =
  | { kind: 'match'; guide: GuideMeta }
  | { kind: 'ambiguous'; guides: GuideMeta[] }
  | { kind: 'none' }

/**
 * Match et foto (efter filnavn) til præcis én guide.
 *   1. eksakt: foto-nøgle == guide-nøgle ELLER == slug-nøgle
 *   2. ellers: foto-nøgle INDEHOLDER guide-/slug-nøgle
 * Flere kandidater i samme trin → ambiguous (placeres ALDRIG på gæt).
 */
export function matchPhotoToGuide(basename: string, guides: readonly GuideMeta[]): PhotoMatch {
  const key = photoNameKey(basename)
  if (!key) return { kind: 'none' }

  const exact = guides.filter(g => key === guideKey(g) || key === slugKey(g.slug))
  if (exact.length === 1) return { kind: 'match', guide: exact[0] }
  if (exact.length > 1) return { kind: 'ambiguous', guides: exact }

  const contains = guides.filter(g => {
    const gk = guideKey(g)
    const sk = slugKey(g.slug)
    return (gk && key.includes(gk)) || (sk && key.includes(sk))
  })
  if (contains.length === 1) return { kind: 'match', guide: contains[0] }
  if (contains.length > 1) return { kind: 'ambiguous', guides: contains }
  return { kind: 'none' }
}

/** Species før variety, så en forælder er promoveret før sit barn. */
export function promoteOrder(guides: readonly GuideMeta[]): GuideMeta[] {
  return [...guides].sort((a, b) => {
    if (a.guideLevel !== b.guideLevel) return a.guideLevel === 'species' ? -1 : 1
    return a.slug.localeCompare(b.slug)
  })
}
