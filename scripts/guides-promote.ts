/**
 * guides:promote — flyt en kandidat i produktion.
 *
 *   npm run guides:promote <slug>
 *   npm run guides:promote <slug> -- --force
 *
 * Kopierer content/guide-production/built/<slug>.md → content/guides/<slug>.md.
 * KUN som eksplicit kommando (kræver slug). Ændrer ALDRIG ledger-status
 * automatisk — det gør du bagefter med guides:mark.
 *
 * REGRESSIONS-SPÆRRE: en promote der OVERSKRIVER en eksisterende, godkendt
 * live-guide blokeres, hvis kandidaten TABER indhold (botaniskeKendetegn,
 * pluralName, Potalot-note, teknik-kort, :::next-guide, sektioner, kilder).
 * Værktøjet ejer beskyttelsen — ikke menneskets hukommelse. Bevidst tab
 * kræver eksplicit --force, og rapporten vises altid før filen røres.
 */

import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { applyPromote, formatRegressionReport } from './guide-regression'

const BUILT = 'content/guide-production/built'
const LIVE = 'content/guides'

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n\nBrug:  npm run guides:promote <slug> [-- --force]\n`)
  process.exit(1)
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const slug = (args.find(a => !a.startsWith('-')) ?? '').replace(/\.md$/, '')
if (!slug) fail('Angiv en slug.')

const candPath = join(BUILT, `${slug}.md`)
const livePath = join(LIVE, `${slug}.md`)
if (!existsSync(candPath)) fail(`Ingen kandidat "${slug}" i ${BUILT}/. Kør guides:build først.`)

const plan = applyPromote(candPath, livePath, force, regs => {
  // Vises FØR en evt. skrivning — både ved blokering og ved --force.
  console.error(`\n⚠️  ${formatRegressionReport(slug, regs)}\n`)
})

switch (plan.action) {
  case 'create':
    console.log(`\n✓ ${slug}: oprettet i ${LIVE}/  (NEW)`)
    break
  case 'update-clean':
    console.log(`\n✓ ${slug}: erstattet i ${LIVE}/  (UPDATE — ingen regression)`)
    break
  case 'update-forced':
    console.log(`\n✓ ${slug}: erstattet i ${LIVE}/  (UPDATE — --force TRODS ${plan.regressions.length} regression(er))`)
    break
  case 'blocked':
    console.error(`❌ BLOKERET: promote afvist for at beskytte godkendt live-indhold.`)
    console.error(`   Er tabet bevidst?  Kør igen med:  npm run guides:promote ${slug} -- --force`)
    console.error(`   content/guides/${slug}.md er URØRT.\n`)
    process.exit(1)
}

// Kun nået hvis IKKE blokeret (blocked-grenen kalder process.exit).
console.log(`Ledger er URØRT — kør evt.:  npm run guides:mark ${slug} approved`)
console.log(`Verificér:  npm run guides:validate`)
