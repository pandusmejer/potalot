/**
 * guides:mark — sæt livscyklus-status på en guide.
 *
 *   npm run guides:mark <slug> <draft|reviewed|approved|imported>
 *
 * Status gemmes i en ledger (content/guide-production/status.json) — ALDRIG i
 * selve guide-teksten. Build/import rører aldrig indholdet; kun mennesket
 * flytter status. guides:status viser overblikket.
 *
 *   draft     leveret, ikke tjekket
 *   reviewed  guides:validate er kørt uden fejl
 *   approved  et menneske har godkendt fakta (se editorial-rules.md)
 *   imported  importeret til DB
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const LEDGER = 'content/guide-production/status.json'
const STATUSES = ['draft', 'reviewed', 'approved', 'imported'] as const
type Status = (typeof STATUSES)[number]

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n\nBrug:  npm run guides:mark <slug> <${STATUSES.join('|')}>\n`)
  process.exit(1)
}

const [, , slug, status] = process.argv
if (!slug || !status) fail('Angiv slug og status.')
if (!STATUSES.includes(status as Status)) fail(`Ukendt status "${status}".`)
if (!existsSync(`content/guides/${slug}.md`)) fail(`Ingen guide hedder "${slug}" i content/guides/.`)

const ledger: Record<string, Status> = existsSync(LEDGER)
  ? (JSON.parse(readFileSync(LEDGER, 'utf8')) as Record<string, Status>)
  : {}

const before = ledger[slug] ?? 'draft'
ledger[slug] = status as Status

// sortér for stabil diff
const sorted = Object.fromEntries(Object.entries(ledger).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(LEDGER, JSON.stringify(sorted, null, 2) + '\n')

console.log(`✓ ${slug}:  ${before} → ${status}`)
