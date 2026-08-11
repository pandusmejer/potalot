/**
 * Tekst-audit: fletter del-JSONL-filer (UI-agenter + mekanisk redaktionelt
 * udtræk + guide-korrektur-patches) til den endelige audit-CSV med stabile
 * ID'er, samt en stats-JSON til summary-dokumentet.
 *
 * Brug:  npx tsx scripts/text-audit/build-csv.ts <parts-dir> <output.csv> <stats.json>
 * Kun audit-værktøj — påvirker ikke produktionsbuildet.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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

interface Patch {
  fil: string
  heading: string
  problemkategori: string
  citat: string
  bemaerkning: string
  forslag: string
  prioritet: string
}

const PREFIX: Record<string, string> = {
  'Frøbank': 'FRB',
  'Planter': 'PLT',
  'Guides (UI)': 'GUI',
  'Guides (redaktionelt)': 'GED',
  'Kalender': 'KAL',
  'Havebog': 'HAV',
  'Gartneren': 'GAR',
  'Navigation & profil': 'NAV',
  'System & fællesskab': 'SYS',
}

const [partsDir, csvPath, statsPath] = process.argv.slice(2)
if (!partsDir || !csvPath || !statsPath) {
  console.error('Brug: npx tsx scripts/text-audit/build-csv.ts <parts-dir> <output.csv> <stats.json>')
  process.exit(1)
}

function laesJsonl<T>(sti: string): T[] {
  const ud: T[] = []
  const raw = readFileSync(sti, 'utf8')
  for (const [i, linje] of raw.split('\n').entries()) {
    const t = linje.trim()
    if (!t) continue
    try {
      ud.push(JSON.parse(t) as T)
    } catch {
      console.error(`  ! ugyldig JSON sprunget over: ${sti}:${i + 1}`)
    }
  }
  return ud
}

const raekker: Raekke[] = []
const patches: Patch[] = []

for (const f of readdirSync(partsDir).filter(f => f.endsWith('.jsonl')).sort()) {
  const sti = join(partsDir, f)
  if (f.startsWith('ED')) {
    patches.push(...laesJsonl<Patch>(sti))
  } else {
    for (const r of laesJsonl<Raekke>(sti)) {
      raekker.push({
        omraade: r.omraade ?? '',
        route: r.route ?? '',
        kontekst: r.kontekst ?? '',
        type: r.type ?? 'andet',
        tekst: String(r.tekst ?? ''),
        status: r.status || 'auto-gennemgået',
        problemkategori: r.problemkategori || 'OK',
        bemaerkning: r.bemaerkning ?? '',
        forslag: r.forslag ?? '',
        prioritet: r.prioritet ?? '',
        fil: r.fil ?? '',
        linje: Number(r.linje ?? 0),
        dynamisk: r.dynamisk ?? 'nej',
      })
    }
  }
}

// --- Kobl guide-korrektur-patches på de mekanisk udtrukne GED-rækker.
// Match: samme fil + heading (sektions- eller frontmatter-kontekst).
const PRIO = (p: string) => (p === 'P0' ? 0 : p === 'P1' ? 1 : p === 'P2' ? 2 : 3)
let umatchede = 0
for (const p of patches) {
  const heading = (p.heading ?? '').trim()
  const kandidater = raekker.filter(r => {
    if (r.fil !== p.fil) return false
    if (heading.startsWith('Frontmatter:')) {
      const felt = heading.replace(/^Frontmatter:\s*/, '').split(' ')[0]
      return r.kontekst.startsWith('Frontmatter:') && r.kontekst.includes(felt)
    }
    return (
      r.kontekst === `Sektion: ${heading}` ||
      r.kontekst.toLowerCase().includes(heading.toLowerCase())
    )
  })
  const notat = `[${p.problemkategori}] ${p.bemaerkning}${p.citat ? ` — citat: "${p.citat}"` : ''}`
  if (kandidater.length > 0) {
    const r = kandidater[0]
    r.status = 'auto-flagget'
    r.problemkategori = r.problemkategori === 'OK' || !r.problemkategori
      ? p.problemkategori
      : `${r.problemkategori}+${p.problemkategori}`
    r.bemaerkning = r.bemaerkning ? `${r.bemaerkning} | ${notat}` : notat
    if (p.forslag) r.forslag = r.forslag ? `${r.forslag} | ${p.forslag}` : p.forslag
    if (!r.prioritet || PRIO(p.prioritet) < PRIO(r.prioritet)) r.prioritet = p.prioritet
  } else {
    // Tab aldrig et fund: uden match bliver patchen sin egen række.
    umatchede++
    raekker.push({
      omraade: 'Guides (redaktionelt)',
      route: `/guides/${p.fil.replace(/^content\/guides\//, '').replace(/\.md$/, '')}`,
      kontekst: `(patch uden sektion-match) ${heading}`,
      type: 'guide',
      tekst: p.citat ?? '',
      status: 'auto-flagget',
      problemkategori: p.problemkategori,
      bemaerkning: p.bemaerkning,
      forslag: p.forslag ?? '',
      prioritet: p.prioritet ?? '',
      fil: p.fil,
      linje: 0,
      dynamisk: 'nej',
    })
  }
}

// Rækker der er flaget af UI-agenterne: ensret status.
for (const r of raekker) {
  if (r.problemkategori && r.problemkategori !== 'OK' && r.status !== 'auto-flagget') {
    r.status = 'auto-flagget'
  }
}

// --- Stabile ID'er: områdeprefix + løbenummer, sorteret pr. fil+linje.
raekker.sort((a, b) =>
  (PREFIX[a.omraade] ?? 'AND').localeCompare(PREFIX[b.omraade] ?? 'AND') ||
  a.fil.localeCompare(b.fil) ||
  a.linje - b.linje,
)
const taeller: Record<string, number> = {}
const medId = raekker.map(r => {
  const px = PREFIX[r.omraade] ?? 'AND'
  taeller[px] = (taeller[px] ?? 0) + 1
  return { id: `${px}-${String(taeller[px]).padStart(4, '0')}`, ...r }
})

// --- CSV (komma-separeret, RFC-quoting, UTF-8 med BOM så Excel læser æøå).
const KOLONNER = ['id', 'område', 'route', 'kontekst', 'type', 'nuværende_tekst', 'status', 'problemkategori', 'bemærkning', 'forslag', 'prioritet', 'fil', 'linje', 'dynamisk']
const q = (v: string | number) => {
  const s = String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = [
  KOLONNER.join(','),
  ...medId.map(r => [r.id, r.omraade, r.route, r.kontekst, r.type, r.tekst, r.status, r.problemkategori, r.bemaerkning, r.forslag, r.prioritet, r.fil, r.linje, r.dynamisk].map(q).join(',')),
].join('\n')
writeFileSync(csvPath, '﻿' + csv + '\n')

// --- Stats til summary.
const optael = (vaelger: (r: (typeof medId)[number]) => string) => {
  const m: Record<string, number> = {}
  for (const r of medId) {
    const k = vaelger(r) || '(tom)'
    m[k] = (m[k] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]))
}
const flaggede = medId.filter(r => r.status === 'auto-flagget')
const stats = {
  totalRaekker: medId.length,
  unikkeTekster: new Set(medId.map(r => r.tekst)).size,
  flaggedeIAlt: flaggede.length,
  umatchedePatches: umatchede,
  prOmraade: optael(r => r.omraade),
  prType: optael(r => r.type),
  flagPrKategori: (() => {
    const m: Record<string, number> = {}
    for (const r of flaggede) {
      for (const k of r.problemkategori.split('+')) m[k] = (m[k] ?? 0) + 1
    }
    return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]))
  })(),
  prPrioritet: optael(r => r.prioritet || '(ingen)'),
  dynamiske: medId.filter(r => r.dynamisk === 'ja').length,
}
writeFileSync(statsPath, JSON.stringify(stats, null, 2))
console.log(`${medId.length} rækker (${flaggede.length} flagget, ${umatchede} patches uden match) → ${csvPath}`)
