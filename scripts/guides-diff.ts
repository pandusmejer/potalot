/**
 * guides:diff — vis forskellen mellem en kandidat (built/) og den nuværende
 * guide (content/guides/) med samme slug.
 *
 *   npm run guides:diff [slug]
 *
 * Uden slug: alle kandidater i built/.
 * Findes der ingen nuværende guide → 'NEW' (ikke en fejl).
 * Read-only: ændrer intet.
 */

import { readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { execSync } from 'node:child_process'

const BUILT = 'content/guide-production/built'
const LIVE = 'content/guides'

function diffOne(slug: string): void {
  const cand = join(BUILT, `${slug}.md`)
  const cur = join(LIVE, `${slug}.md`)
  if (!existsSync(cand)) {
    console.log(`\n● ${slug}: ingen kandidat i built/`)
    return
  }
  if (!existsSync(cur)) {
    console.log(`\n● ${slug}: \x1b[32mNEW\x1b[0m — ingen eksisterende guide, intet at sammenligne med`)
    return
  }
  // git diff --no-index: exit 0 (identisk) eller exit 1 (forskel, diff på stdout).
  let out = ''
  try {
    out = execSync(`git --no-pager diff --no-index --no-color -- "${cur}" "${cand}"`, { encoding: 'utf8' })
  } catch (e) {
    const err = e as { stdout?: Buffer | string }
    out = err.stdout ? err.stdout.toString() : ''
  }
  if (out.trim()) {
    console.log(`\n● ${slug}: forskel (− nuværende / + kandidat)`)
    console.log(out.replace(/^/gm, '  '))
  } else {
    console.log(`\n● ${slug}: identisk med den nuværende guide`)
  }
}

function main(): void {
  const arg = process.argv[2]
  if (arg) {
    diffOne(arg.replace(/\.md$/, ''))
    return
  }
  if (!existsSync(BUILT)) {
    console.log('Ingen built/-mappe endnu — kør guides:build først.')
    return
  }
  const slugs = readdirSync(BUILT).filter(f => f.endsWith('.md')).map(f => basename(f, '.md'))
  if (slugs.length === 0) {
    console.log('Ingen kandidater i built/ — kør guides:build først.')
    return
  }
  console.log(`Sammenligner ${slugs.length} kandidat(er) mod content/guides/:`)
  for (const s of slugs) diffOne(s)
  console.log('\nBrug  npm run guides:promote <slug>  for at sætte en kandidat i produktion.')
}

main()
