/**
 * Tekst-audit: mekanisk udtræk af det REDAKTIONELLE lag (content/guides/*.md)
 * til JSONL-rækker — én pr. sektion/frontmatter-felt, med ordret tekst,
 * fil og linjenummer. Ordret udtræk sker mekanisk (aldrig ved afskrivning),
 * så auditten ikke selv kan introducere tekstfejl.
 *
 * Brug:  npx tsx scripts/text-audit/extract-editorial.ts <output.jsonl>
 * Kun audit-værktøj — påvirker ikke produktionsbuildet.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'

const GUIDES_DIR = 'content/guides'

interface Raekke {
  omraade: string
  route: string
  kontekst: string
  type: string
  tekst: string
  status: string
  problemkategori: string
  bemaerkning: string
  forslag: string
  prioritet: string
  fil: string
  linje: number
  dynamisk: string
}

const ud: Raekke[] = []

function row(fil: string, slug: string, linje: number, kontekst: string, type: string, tekst: string) {
  if (!tekst.trim()) return
  ud.push({
    omraade: 'Guides (redaktionelt)',
    route: `/guides/${slug}`,
    kontekst,
    type,
    tekst: tekst.trim(),
    status: 'ikke_vurderet',
    problemkategori: '',
    bemaerkning: '',
    forslag: '',
    prioritet: '',
    fil,
    linje,
    dynamisk: 'nej',
  })
}

/** Fjern YAML-quotes omkring en værdi. */
function unquote(v: string): string {
  const t = v.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1)
  }
  return t
}

const outputPath = process.argv[2]
if (!outputPath) {
  console.error('Brug: npx tsx scripts/text-audit/extract-editorial.ts <output.jsonl>')
  process.exit(1)
}

const files = readdirSync(GUIDES_DIR).filter(f => f.endsWith('.md')).sort()

for (const f of files) {
  const fil = join(GUIDES_DIR, f)
  const slug = basename(f, '.md')
  const lines = readFileSync(fil, 'utf8').split('\n')

  // --- Frontmatter (linje 0 er '---'; find slut) ---
  let fmEnd = -1
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') { fmEnd = i; break }
    }
  }

  for (let i = 1; i < fmEnd; i++) {
    const line = lines[i]
    const mSummary = line.match(/^summary:\s*(.+)$/)
    if (mSummary) row(fil, slug, i + 1, 'Frontmatter: summary (guidekort/hero)', 'guide', unquote(mSummary[1]))

    // Brugervendte tekst-værdier i quickFacts (tal/booleans/lister springes over)
    const mQf = line.match(/^\s{2,}(soil|minimumTemperature|germinationDays|germinationTemperature|plantSpacing|rowSpacing|height|growthType|maturityDays|primaryUse):\s*(.+)$/)
    if (mQf) {
      const vaerdi = unquote(mQf[2])
      if (vaerdi && !/^\[|^(true|false)$/.test(vaerdi)) {
        row(fil, slug, i + 1, `Frontmatter: quickFacts.${mQf[1]}`, 'dyrkningsfakta', vaerdi)
      }
    }

    const mTitle = line.match(/^\s*-\s*title:\s*(.+)$/)
    if (mTitle) row(fil, slug, i + 1, 'Frontmatter: calendarRules.title (kalenderopgave)', 'dyrkningsfakta', unquote(mTitle[1]))
  }

  // --- Sektioner: '## Overskrift' + prosa indtil næste '##' ---
  let heading: string | null = null
  let headingLinje = 0
  let buffer: string[] = []

  const flush = () => {
    if (heading !== null) {
      row(fil, slug, headingLinje, `Sektion: ${heading}`, 'guide', buffer.join('\n'))
    }
    buffer = []
  }

  for (let i = fmEnd + 1; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+)$/)
    if (m) {
      flush()
      heading = m[1].trim()
      headingLinje = i + 1
    } else if (heading !== null) {
      buffer.push(lines[i])
    } else if (lines[i].trim()) {
      // Prosa før første sektion (intro uden heading)
      heading = '(intro uden overskrift)'
      headingLinje = i + 1
      buffer.push(lines[i])
    }
  }
  flush()
}

writeFileSync(outputPath, ud.map(r => JSON.stringify(r)).join('\n') + '\n')
console.log(`${ud.length} redaktionelle rækker fra ${files.length} guides → ${outputPath}`)
