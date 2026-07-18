/**
 * guides:promote — flyt en kandidat i produktion.
 *
 *   npm run guides:promote <slug>
 *
 * Kopierer content/guide-production/built/<slug>.md → content/guides/<slug>.md.
 * KUN som eksplicit kommando (kræver slug). Ændrer ALDRIG ledger-status
 * automatisk — det gør du bagefter med guides:mark. Røres teksten ikke:
 * det er en ren kopi af kandidaten.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BUILT = 'content/guide-production/built'
const LIVE = 'content/guides'

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n\nBrug:  npm run guides:promote <slug>\n`)
  process.exit(1)
}

const slug = (process.argv[2] ?? '').replace(/\.md$/, '')
if (!slug) fail('Angiv en slug.')

const cand = join(BUILT, `${slug}.md`)
const live = join(LIVE, `${slug}.md`)
if (!existsSync(cand)) fail(`Ingen kandidat "${slug}" i ${BUILT}/. Kør guides:build først.`)

const wasNew = !existsSync(live)
writeFileSync(live, readFileSync(cand, 'utf8'))

console.log(`\n✓ ${slug}: ${wasNew ? 'oprettet' : 'erstattet'} i ${LIVE}/`)
console.log('Ledger er URØRT — kør evt.:  npm run guides:mark ' + slug + ' approved')
console.log('Verificér:  npm run guides:validate')
