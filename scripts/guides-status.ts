/**
 * guides:status — overblik over guide-produktionen.
 *
 * Sammenholder planen (content/guide-production/*.csv) med de færdige guides
 * (content/guides/*.md) og JSON-køen (generated/*.json), og viser:
 *   · antal arts-/sortsguider
 *   · hvad der er planlagt men mangler
 *   · JSON i køen der ikke er bygget endnu
 *   · sortsguider hvis parentSlug ikke findes
 *   · guides uden hero-billede
 *
 * Ingen AI. Ren status ud fra filerne.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const GUIDES = 'content/guides'
const PROD = 'content/guide-production'
const GEN = join(PROD, 'generated')

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Læs top-level frontmatter-felter fra en guide-md (light). */
function fields(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const lines = raw.split('\n')
  let inFm = false, done = false
  for (const line of lines) {
    if (line.trim() === '---') { if (!inFm && !done) { inFm = true; continue } if (inFm) { done = true; break } }
    if (inFm && !/^\s/.test(line)) {
      const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
      if (m) out[m[1]] = m[2].trim()
    }
  }
  return out
}

interface Guide { slug: string; level: string; parentSlug: string; file: string }

function readGuides(): Guide[] {
  if (!existsSync(GUIDES)) return []
  return readdirSync(GUIDES).filter(f => f.endsWith('.md')).map(f => {
    const F = fields(readFileSync(join(GUIDES, f), 'utf8'))
    return { slug: F.slug ?? basename(f, '.md'), level: F.guideLevel ?? '?', parentSlug: F.parentSlug ?? '', file: f }
  })
}

/** Naiv CSV → rækker som objekter (nok til de ledende kolonner; notes er sidst). */
function readCsv(path: string): Record<string, string>[] {
  if (!existsSync(path)) return []
  const lines = readFileSync(path, 'utf8').split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim())
  if (lines.length < 2) return []
  const head = lines[0].split(',')
  return lines.slice(1).map(l => {
    const cols = l.split(',')
    const row: Record<string, string> = {}
    head.forEach((h, i) => { row[h.trim()] = (cols[i] ?? '').trim() })
    return row
  })
}

function hasHero(g: Guide): boolean {
  const dir = g.level === 'species' ? 'arts' : 'plantekort'
  return ['jpg', 'png', 'webp'].some(ext => existsSync(`public/images/${dir}/${g.slug}.${ext}`))
}

function main(): void {
  const guides = readGuides()
  const bySlug = new Set(guides.map(g => g.slug))
  const speciesSlugs = new Set(guides.filter(g => g.level === 'species').map(g => g.slug))
  const nSpecies = guides.filter(g => g.level === 'species').length
  const nVariety = guides.filter(g => g.level === 'variety').length

  const plannedSpecies = readCsv(join(PROD, 'species.csv')).map(r => ({ name: r.plantName, slug: slugify(r.plantName || '') }))
  const plannedVarieties = readCsv(join(PROD, 'varieties.csv')).map(r => ({
    name: `${r.plantName} ${r.variety}`, slug: slugify(`${r.plantName}-${r.variety}`), parent: r.parentSlug,
  }))

  const genJson = existsSync(GEN) ? readdirSync(GEN).filter(f => f.endsWith('.json')) : []
  const genSlugs = genJson.map(f => {
    try { return (JSON.parse(readFileSync(join(GEN, f), 'utf8')) as { slug?: string }).slug ?? basename(f, '.json') }
    catch { return basename(f, '.json') }
  })

  const line = (s = '') => console.log(s)
  line(`\n📊 GUIDE-STATUS\n${'─'.repeat(40)}`)
  line(`Færdige guides:  ${guides.length}  (${nSpecies} arts · ${nVariety} sorts)`)
  line(`JSON i køen:     ${genJson.length}${genJson.length ? ' (kør guides:build)' : ''}`)
  line(`Planlagt (CSV):  ${plannedSpecies.length} arter · ${plannedVarieties.length} sorter`)

  const missingSpecies = plannedSpecies.filter(p => p.slug && !bySlug.has(p.slug))
  const missingVarieties = plannedVarieties.filter(p => p.slug && !bySlug.has(p.slug))
  if (missingSpecies.length || missingVarieties.length) {
    line(`\n⏳ Planlagt men mangler (${missingSpecies.length + missingVarieties.length}):`)
    missingSpecies.forEach(p => line(`   art:  ${p.name}  →  ${p.slug}`))
    missingVarieties.forEach(p => line(`   sort: ${p.name}  →  ${p.slug}`))
  }

  const notBuilt = genSlugs.filter(s => !bySlug.has(s))
  if (notBuilt.length) {
    line(`\n📦 JSON klar men ikke bygget (${notBuilt.length}):`)
    notBuilt.forEach(s => line(`   ${s}`))
  }

  const orphans = guides.filter(g => g.level === 'variety' && g.parentSlug && !speciesSlugs.has(g.parentSlug))
  if (orphans.length) {
    line(`\n⚠️  Sortsguider uden artsguide (parentSlug mangler) (${orphans.length}):`)
    orphans.forEach(g => line(`   ${g.slug}  →  savner art '${g.parentSlug}'`))
  }

  const noImage = guides.filter(g => !hasHero(g))
  if (noImage.length) {
    line(`\n🖼️  Guides uden hero-billede (${noImage.length}):`)
    noImage.forEach(g => line(`   ${g.slug}  (læg i public/images/${g.level === 'species' ? 'arts' : 'plantekort'}/)`))
  }

  line(`\n${'─'.repeat(40)}`)
  if (!missingSpecies.length && !missingVarieties.length && !notBuilt.length && !orphans.length) {
    line('✅ Planen er produceret. ' + (noImage.length ? `${noImage.length} mangler billede.` : 'Alt har billeder.'))
  }
  line('')
}

main()
