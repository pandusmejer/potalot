/**
 * guides:validate — Niveau 1 (automatisk kontrol) af guides FØR import.
 *
 * Læser content/guides/*.md, parser frontmatteren og tjekker det maskinen kan
 * fange: manglende felter, ugyldige enums, dublerede slugs, forkert slug,
 * ukendt parentSlug, manglende sektioner, for lang summary, tomme quickFacts.
 *
 * Fanger IKKE fagligt indhold — det er guides:review (AI) + menneske.
 * Exit 1 hvis der er fejl (så det kan bruges i CI/pre-import).
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join, basename } from 'node:path'

const DIR = 'content/guides'
const CATS = ['fro', 'loeg', 'knolde', 'buske', 'traeer', 'stauder']
const LEVELS = ['species', 'variety']
const DIFFS = ['easy', 'medium', 'hard']
const SUMMARY_MAX = 200

interface Parsed {
  file: string
  fields: Record<string, string>
  quickFactsCount: number
  headingCount: number
  hasFrontmatter: boolean
}

function parse(file: string, raw: string): Parsed {
  const lines = raw.split('\n')
  const fields: Record<string, string> = {}
  let quickFactsCount = 0
  let headingCount = 0
  let inFm = false
  let done = false
  let inQuickFacts = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '---') {
      if (!inFm && !done) { inFm = true; continue }
      if (inFm) { inFm = false; done = true; continue }
    }
    if (inFm) {
      if (/^\s+/.test(line)) {
        // indenteret linje → hører til seneste block (fx quickFacts)
        if (inQuickFacts && line.trim() && !line.trim().startsWith('#')) quickFactsCount++
        continue
      }
      const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
      if (m) {
        fields[m[1]] = m[2].trim()
        inQuickFacts = m[1] === 'quickFacts'
      }
    } else if (done && line.startsWith('## ')) {
      headingCount++
    }
  }
  return { file, fields, quickFactsCount, headingCount, hasFrontmatter: done }
}

function unquote(s: string): string {
  return s.replace(/^["']|["']$/g, '')
}

function main(): void {
  const files = readdirSync(DIR).filter(f => f.endsWith('.md'))
  const parsed = files.map(f => parse(f, readFileSync(join(DIR, f), 'utf8')))

  const errors: string[] = []
  const warnings: string[] = []

  // slug-sæt til dublet- og parentSlug-opslag
  const slugCount = new Map<string, number>()
  const speciesSlugs = new Set<string>()
  for (const p of parsed) {
    const slug = p.fields.slug
    if (slug) slugCount.set(slug, (slugCount.get(slug) ?? 0) + 1)
    if (p.fields.guideLevel === 'species' && slug) speciesSlugs.add(slug)
  }

  for (const p of parsed) {
    const f = p.file
    const F = p.fields
    const err = (m: string) => errors.push(`${f}: ${m}`)
    const warn = (m: string) => warnings.push(`${f}: ${m}`)

    if (!p.hasFrontmatter) { err('mangler frontmatter (--- ... ---)'); continue }

    // slug
    if (!F.slug) err("mangler 'slug'")
    else {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(F.slug)) err(`slug '${F.slug}' er ikke kebab-case`)
      const fromName = basename(f, '.md')
      if (F.slug !== fromName) err(`slug '${F.slug}' matcher ikke filnavnet '${fromName}'`)
      if ((slugCount.get(F.slug) ?? 0) > 1) err(`dubleret slug '${F.slug}'`)
    }

    // guideLevel
    if (!F.guideLevel) err("mangler 'guideLevel'")
    else if (!LEVELS.includes(F.guideLevel)) err(`guideLevel '${F.guideLevel}' skal være species/variety`)

    // plantName
    if (!F.plantName) err("mangler 'plantName'")

    // kategori
    if (!F.primaryCategoryId) err("mangler 'primaryCategoryId'")
    else if (!CATS.includes(F.primaryCategoryId)) err(`ugyldig primaryCategoryId '${F.primaryCategoryId}' (skal være ${CATS.join('/')})`)

    // summary
    if (!F.summary) err("mangler 'summary'")
    else {
      const s = unquote(F.summary)
      if (s.length > SUMMARY_MAX) err(`summary er ${s.length} tegn (maks ${SUMMARY_MAX})`)
    }

    // difficulty (valgfri)
    if (F.difficulty && !DIFFS.includes(F.difficulty)) err(`difficulty '${F.difficulty}' skal være ${DIFFS.join('/')}`)

    // sortsguide-specifikt
    if (F.guideLevel === 'variety') {
      if (!F.variety) err('sortsguide mangler variety')
      if (!F.parentSlug) err('sortsguide mangler parentSlug')
      else if (!speciesSlugs.has(F.parentSlug)) err(`parentSlug '${F.parentSlug}' peger ikke på en eksisterende artsguide`)
    }

    // sektioner
    if (p.headingCount === 0) err('ingen sektioner (mindst én ## overskrift kræves)')

    // quickFacts (advarsel — ikke fejl)
    if (p.quickFactsCount === 0) warn('tomme quickFacts (ingen strukturerede fakta)')
  }

  // rapport
  console.log(`Tjekkede ${parsed.length} guide(s) i ${DIR}/\n`)
  if (warnings.length) {
    console.log(`⚠️  ${warnings.length} advarsel(er):`)
    warnings.forEach(w => console.log(`   · ${w}`))
    console.log('')
  }
  if (errors.length) {
    console.log(`❌ ${errors.length} fejl:`)
    errors.forEach(e => console.log(`   · ${e}`))
    console.log('\nRet fejlene før import.')
    process.exit(1)
  }
  console.log('✅ Ingen fejl. Klar til: npm run import:guides')
}

main()
