/**
 * guides:build — laver leveret guide-JSON om til repoets markdown som KANDIDATER.
 *
 *   content/guide-production/generated/*.json   (matcher Docs/guide-templates/guide-schema.json)
 *        → content/guide-production/built/<slug>.md      (KANDIDAT — ikke live)
 *
 * Build overskriver ALDRIG content/guides/. Kandidaterne granskes med
 * guides:diff og flyttes først i produktion med guides:promote efter godkendelse.
 * Deterministisk: strukturen styres her, teksten røres ikke.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'content/guide-production/generated'
const OUT = 'content/guide-production/built'
const LIVE = 'content/guides'
const CATS = ['fro', 'loeg', 'knolde', 'buske', 'traeer', 'stauder']

interface Section { heading: string; content: string }
interface Guide {
  slug: string
  guideLevel: 'species' | 'variety' | 'technique'
  parentSlug?: string | null
  title?: string | null
  plantName?: string
  variety?: string | null
  latinName?: string | null
  appliesTo?: string[]
  primaryCategoryId?: string
  summary: string
  difficulty?: string
  tags?: string[]
  quickFacts?: Record<string, unknown>
  calendarRules?: unknown[]
  sourceLinks?: string[]
  sections: Section[]
}

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n`)
  process.exit(1)
}

/** Citér kun når nødvendigt (matcher import-scriptets parseYaml). */
function scalar(v: string): string {
  if (v === '') return '""'
  return /[:#'"]|^\s|\s$/.test(v) ? JSON.stringify(v) : v
}
function inlineArr(a: (string | number)[]): string {
  return '[' + a.map(x => (typeof x === 'number' ? String(x) : scalar(x))).join(', ') + ']'
}

function frontmatter(g: Guide): string {
  const L: string[] = []
  L.push(`slug: ${g.slug}`)
  L.push(`guideLevel: ${g.guideLevel}`)
  if (g.guideLevel === 'variety' && g.parentSlug) L.push(`parentSlug: ${g.parentSlug}`)
  if (g.title) L.push(`title: ${scalar(g.title)}`)
  if (g.plantName) L.push(`plantName: ${scalar(g.plantName)}`)
  if (g.variety) L.push(`variety: ${scalar(g.variety)}`)
  if (g.latinName) L.push(`latinName: ${scalar(g.latinName)}`)
  if (g.appliesTo && g.appliesTo.length) L.push(`appliesTo: ${inlineArr(g.appliesTo)}`)
  if (g.primaryCategoryId) L.push(`primaryCategoryId: ${g.primaryCategoryId}`)
  L.push(`summary: ${JSON.stringify(g.summary)}`)
  if (g.difficulty) L.push(`difficulty: ${g.difficulty}`)
  if (g.tags && g.tags.length) L.push(`tags: ${inlineArr(g.tags)}`)
  if (g.quickFacts && Object.keys(g.quickFacts).length) {
    L.push('quickFacts:')
    for (const [k, v] of Object.entries(g.quickFacts)) {
      if (Array.isArray(v)) L.push(`  ${k}: ${inlineArr(v as (string | number)[])}`)
      else if (typeof v === 'boolean' || typeof v === 'number') L.push(`  ${k}: ${v}`)
      else L.push(`  ${k}: ${scalar(String(v))}`)
    }
  }
  L.push(`calendarRules: ${g.calendarRules && g.calendarRules.length ? JSON.stringify(g.calendarRules) : '[]'}`)
  L.push(`sourceLinks: ${g.sourceLinks && g.sourceLinks.length ? inlineArr(g.sourceLinks) : '[]'}`)
  return L.join('\n')
}

function body(g: Guide): string {
  return g.sections.map(s => `## ${s.heading}\n\n${s.content.trim()}\n`).join('\n')
}

function check(g: Guide, file: string): void {
  for (const k of ['slug', 'guideLevel', 'summary'] as const) {
    if (!g[k]) fail(`${file}: mangler feltet '${k}'`)
  }
  if (!['species', 'variety', 'technique'].includes(g.guideLevel)) fail(`${file}: guideLevel skal være 'species', 'variety' eller 'technique'`)
  if (g.guideLevel === 'technique') {
    // Teknikguide: titel driver H1, ingen plante/kategori/quickFacts.
    if (!g.title) fail(`${file}: teknikguide mangler feltet 'title'`)
  } else {
    if (!g.plantName) fail(`${file}: mangler feltet 'plantName'`)
    if (!g.primaryCategoryId) fail(`${file}: mangler feltet 'primaryCategoryId'`)
    if (!CATS.includes(g.primaryCategoryId)) fail(`${file}: ugyldig primaryCategoryId '${g.primaryCategoryId}'`)
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.slug)) fail(`${file}: slug '${g.slug}' er ikke kebab-case`)
  if (g.guideLevel === 'variety' && !g.parentSlug) fail(`${file}: sortsguide mangler parentSlug`)
  if (!Array.isArray(g.sections) || g.sections.length === 0) fail(`${file}: mindst én section kræves`)
}

function main(): void {
  if (!existsSync(SRC)) fail(`Mappen ${SRC}/ findes ikke`)
  const files = readdirSync(SRC).filter(f => f.endsWith('.json'))
  if (files.length === 0) {
    console.log(`Ingen .json-filer i ${SRC}/ — intet at bygge.`)
    return
  }
  mkdirSync(OUT, { recursive: true })
  let n = 0
  for (const f of files) {
    let g: Guide
    try {
      g = JSON.parse(readFileSync(join(SRC, f), 'utf8')) as Guide
    } catch (e) {
      fail(`${f}: ugyldig JSON — ${e instanceof Error ? e.message : String(e)}`)
    }
    check(g, f)
    // Skriv KANDIDAT til built/ — aldrig til content/guides/.
    writeFileSync(join(OUT, `${g.slug}.md`), `---\n${frontmatter(g)}\n---\n\n${body(g)}`)
    const status = existsSync(join(LIVE, `${g.slug}.md`)) ? 'opdaterer eksisterende' : 'NEW'
    console.log(`  ✓ ${g.slug}  (${status})`)
    n++
  }
  console.log(`\n${n} kandidat(er) bygget → ${OUT}/`)
  console.log(`Gransk:  npm run guides:diff   ·   sæt i produktion:  npm run guides:promote <slug>`)
  console.log('content/guides/ er URØRT indtil du promoter.')
}

main()
