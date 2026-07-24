/**
 * guides:sync-master — spejl Potalot-masterguides ind i DB-tabellen `guides`.
 *
 *   npm run guides:sync-master -- --dry-run   # skriver INTET, rapporterer diff
 *   npm run guides:sync-master                # rigtig sync (kun efter ren dry-run)
 *
 * Envejs: IMPORTED_GUIDES → public.guides master-rækker (user_id NULL), så
 * ensureGuideForInventoryItem/ensureGuideForPlant GENBRUGER masteren i stedet
 * for at generere et overflødigt AI-udkast. DB-masteren er en afledt cache —
 * aldrig en indholdskilde. Spec: Docs/product/guides-master-sync-spec.md.
 *
 * Kører med SERVICE-ROLE-nøglen (bypasser RLS; master-rækker har user_id NULL,
 * som ingen bruger-kontekst kan skrive). Al skrivning sker atomisk i DB-
 * funktionen sync_master_guides — ved enhver fejl rulles hele kørslen tilbage.
 */

import { createClient } from '@supabase/supabase-js'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { normalizeGuideKey } from '@/lib/guides/normalize-key'
import type { Guide } from '@/lib/types'

// ── Env ────────────────────────────────────────────────────────────────────
try {
  process.loadEnvFile('.env.local')
} catch {
  // .env.local mangler → falder tilbage på allerede-satte miljøvariabler
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// DB CHECK-sættet på guides.primary_category_id (00023_guides.sql).
const VALID_CATEGORIES = new Set([
  'fro', 'loeg', 'knolde', 'buske', 'traeer', 'stauder', 'indkoebsliste',
])
const VALID_DIFFICULTY = new Set(['easy', 'medium', 'hard'])

const DRY_RUN = process.argv.includes('--dry-run')

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n`)
  process.exit(1)
}

// ── Mapping: statisk Guide → DB-rækkepayload (snake_case) ────────────────────
export interface PayloadRow {
  slug: string
  plant_name: string
  variety: string | null
  latin_name: string | null
  guide_level: 'art' | 'sort'
  parent_slug: string | null
  primary_category_id: string
  subcategory_id: string | null
  summary: string | null
  difficulty: string | null
  tags: string[]
  quick_facts: unknown
  sections: unknown
  calendar_rules: unknown
  primary_image_url: string | null
  source_links: string[]
}

export function mapGuide(g: Guide): PayloadRow {
  const isSort = g.guideLevel === 'variety'
  return {
    slug: g.id,
    plant_name: g.plantName,
    variety: g.variety ?? null,
    latin_name: g.latinName ?? null,
    guide_level: isSort ? 'sort' : 'art', // oversæt species→art, variety→sort
    parent_slug: isSort ? (g.parentGuideId ?? null) : null,
    primary_category_id: g.primaryCategoryId!, // teknik filtreret fra i main() → altid sat her
    subcategory_id: g.subcategoryId ?? null,
    summary: g.summary ?? null,
    difficulty: g.difficulty ?? null,
    tags: g.tags ?? [],
    quick_facts: g.quickFacts ?? {},
    sections: g.sections ?? [],
    calendar_rules: g.calendarRules ?? [],
    primary_image_url: g.primaryImageId ?? null,
    source_links: g.sourceLinks ?? [],
  }
}

// ── Validering (§3) — INTET skrives hvis noget fejler ────────────────────────
export function validate(guides: Guide[]): string[] {
  const errors: string[] = []

  const speciesSlugs = new Set(
    guides.filter(g => g.guideLevel === 'species').map(g => g.id),
  )

  const seen = new Set<string>()
  for (const g of guides) {
    if (seen.has(g.id)) errors.push(`Duplikeret slug i kilden: "${g.id}"`)
    seen.add(g.id)

    if (!g.primaryCategoryId || !VALID_CATEGORIES.has(g.primaryCategoryId)) {
      errors.push(`"${g.id}": ugyldig primaryCategoryId "${g.primaryCategoryId}"`)
    }
    if (g.difficulty != null && !VALID_DIFFICULTY.has(g.difficulty)) {
      errors.push(`"${g.id}": ugyldig difficulty "${g.difficulty}"`)
    }
    if (g.guideLevel === 'variety') {
      if (!g.parentGuideId) {
        errors.push(`"${g.id}": sortsguide uden parentGuideId`)
      } else if (!speciesSlugs.has(g.parentGuideId)) {
        errors.push(`"${g.id}": forældreløs — parent "${g.parentGuideId}" findes ikke som artsguide i kilden`)
      }
    }
    // JSON-serialiserbarhed (quick_facts/sections/calendar_rules)
    try {
      JSON.stringify({ q: g.quickFacts, s: g.sections, c: g.calendarRules })
    } catch {
      errors.push(`"${g.id}": ikke-serialiserbar quick_facts/sections/calendar_rules`)
    }
  }

  // Advar om normaliseringskollisioner (to masters med samme navn+sort-nøgle
  // ville gøre matchning tvetydig).
  const keyMap = new Map<string, string>()
  for (const g of guides) {
    const key = `${normalizeGuideKey(g.plantName)}|${g.variety ? normalizeGuideKey(g.variety) : ''}`
    if (keyMap.has(key)) {
      errors.push(`Navnekollision: "${g.id}" og "${keyMap.get(key)}" normaliserer til samme nøgle "${key}"`)
    }
    keyMap.set(key, g.id)
  }

  return errors
}

// ── Rapport ──────────────────────────────────────────────────────────────────
function printReport(r: {
  create_count: number
  update_count: number
  unchanged_count: number
  created: string[]
  updated: string[]
  unchanged: string[]
}) {
  const line = (label: string, n: number, slugs: string[]) => {
    console.log(`  ${label.padEnd(11)} ${String(n).padStart(3)}` + (slugs.length ? `   ${slugs.join(', ')}` : ''))
  }
  console.log('')
  line('create:', r.create_count, r.created ?? [])
  line('update:', r.update_count, r.updated ?? [])
  line('unchanged:', r.unchanged_count, r.unchanged ?? [])
  console.log('')
}

// ── Kør ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    fail('Mangler NEXT_PUBLIC_SUPABASE_URL og/eller SUPABASE_SERVICE_ROLE_KEY. Syncen nægter at køre uden service-role-nøglen.')
  }

  // Teknikguider kobles ikke til inventar-planter, så de skal IKKE være
  // master-rækker (de har hverken plantName eller primaryCategoryId).
  const guides = IMPORTED_GUIDES.filter(g => g.guideLevel !== 'technique')
  console.log(`\n🌱 guides:sync-master ${DRY_RUN ? '(DRY-RUN — skriver intet)' : '(RIGTIG KØRSEL)'}`)
  console.log(`   Kilde: ${guides.length} masterguides (${guides.filter(g => g.guideLevel === 'species').length} art · ${guides.filter(g => g.guideLevel === 'variety').length} sort)`)

  const errors = validate(guides)
  if (errors.length) {
    console.error('\n❌ Validering fejlede — intet skrives:')
    for (const e of errors) console.error(`   · ${e}`)
    process.exit(1)
  }
  console.log('   ✓ Validering OK')

  const payload = guides.map(mapGuide)

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.rpc('sync_master_guides', {
    p_guides: payload,
    p_dry_run: DRY_RUN,
  })

  if (error) {
    fail(`Sync fejlede (hele kørslen rullet tilbage): ${error.message}`)
  }

  const report = data as Parameters<typeof printReport>[0]
  printReport(report)

  if (DRY_RUN) {
    console.log('👉 Dry-run. Kør uden --dry-run for at anvende.\n')
  } else {
    console.log('✓ Sync anvendt.\n')
  }
}

// Kør kun main() når scriptet startes direkte (ikke når testen importerer
// mapGuide/validate). import.meta.main er undefined under tsx, så vi matcher
// entry-filen i stedet.
if (process.argv[1]?.endsWith('guides-sync-master.ts')) {
  main().catch(e => fail(e instanceof Error ? e.message : String(e)))
}
