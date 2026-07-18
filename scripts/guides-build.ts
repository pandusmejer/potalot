/**
 * guides:build — laver AI-genereret guide-JSON om til repoets markdown.
 *
 *   content/guide-production/generated/*.json   (matcher Docs/guide-templates/guide-schema.json)
 *        → content/guides/<slug>.md
 *
 * Deterministisk: AI'en skriver KUN JSON; strukturen (frontmatter + sektioner)
 * styres her, så alle guides ser ens ud. Kør derefter guides:validate + import:guides.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'content/guide-production/generated'
const OUT = 'content/guides'
const CATS = ['fro', 'loeg', 'knolde', 'buske', 'traeer', 'stauder']

interface Section { heading: string; content: string }
interface Guide {
  slug: string
  guideLevel: 'species' | 'variety'
  parentSlug?: string | null
  plantName: string
  variety?: string | null
  latinName?: string | null
  primaryCategoryId: string
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
  L.push(`plantName: ${scalar(g.plantName)}`)
  if (g.variety) L.push(`variety: ${scalar(g.variety)}`)
  if (g.latinName) L.push(`latinName: ${scalar(g.latinName)}`)
  L.push(`primaryCategoryId: ${g.primaryCategoryId}`)
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
  for (const k of ['slug', 'guideLevel', 'plantName', 'primaryCategoryId', 'summary'] as const) {
    if (!g[k]) fail(`${file}: mangler feltet '${k}'`)
  }
  if (!['species', 'variety'].includes(g.guideLevel)) fail(`${file}: guideLevel skal være 'species' eller 'variety'`)
  if (!CATS.includes(g.primaryCategoryId)) fail(`${file}: ugyldig primaryCategoryId '${g.primaryCategoryId}'`)
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
  let n = 0
  for (const f of files) {
    let g: Guide
    try {
      g = JSON.parse(readFileSync(join(SRC, f), 'utf8')) as Guide
    } catch (e) {
      fail(`${f}: ugyldig JSON — ${e instanceof Error ? e.message : String(e)}`)
    }
    check(g, f)
    writeFileSync(join(OUT, `${g.slug}.md`), `---\n${frontmatter(g)}\n---\n\n${body(g)}`)
    console.log(`  ✓ ${OUT}/${g.slug}.md`)
    n++
  }
  console.log(`\n${n} guide(s) bygget. Kør nu:  npm run guides:validate  →  npm run import:guides`)
}

main()
