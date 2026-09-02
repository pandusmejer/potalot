/**
 * Redaktionel oprydningsliste for guide-tags.
 *
 * Kører formatteren hen over hele repoets tagvokabular og viser, hvad der
 * IKKE rammer lag 1. Det er listen Anna arbejder efter, når vokabularet
 * skal ryddes op — ikke en test, og den fejler ikke.
 *
 * Live DB kan have tags repoet ikke har; kør en tilsvarende
 * `select distinct unnest(tags) from guides` og læg dem ind i STDIN-listen,
 * hvis rapporten skal dække begge kilder:
 *   npx tsx scripts/tags-rapport.ts < tags-fra-db.txt   (én nøgle pr. linje)
 *
 *   npm run tags:rapport
 */

import { readFileSync } from 'node:fs'
import { formatGuideTag, GUIDE_TAG_LABELS } from '@/lib/guide-tags'
import { IMPORTED_GUIDES } from '@/data/guides-imported'

const alle = new Set<string>()
for (const g of IMPORTED_GUIDES) for (const t of g.tags) alle.add(t)

if (!process.stdin.isTTY) {
  try {
    for (const linje of readFileSync(0, 'utf8').split('\n')) {
      const t = linje.trim()
      if (t) alle.add(t)
    }
  } catch { /* ingen stdin — repoet alene */ }
}

const lag2: string[] = []
const lag3: string[] = []
let lag1 = 0
for (const t of [...alle].sort((a, b) => a.localeCompare(b, 'da'))) {
  const { lag } = formatGuideTag(t)
  if (lag === 1) lag1++
  else if (lag === 2) lag2.push(t)
  else lag3.push(t)
}

console.log(`\nGuide-tags i vokabularet: ${alle.size}`)
console.log(`  lag 1 (verificeret label): ${lag1}`)
console.log(`  lag 2 (kun versaliseret):  ${lag2.length}`)
console.log(`  lag 3 (vises ikke):        ${lag3.length}`)
console.log(`  labels i tabellen:         ${Object.keys(GUIDE_TAG_LABELS).length}`)

if (lag3.length) {
  console.log('\nLAG 3 — struktur der ikke kan formatteres. Vises IKKE for brugeren.')
  console.log('Giv dem enten en verificeret label i GUIDE_TAG_LABELS eller ryd dem ud af data.')
  for (const t of lag3) console.log(`  · ${t}`)
}

console.log('\nLAG 2 — typografisk sikre, men uverificerede.')
console.log('De renderes med stort begyndelsesbogstav. Gennemgå dem redaktionelt:')
console.log('et dårligt tag bliver ikke godt af at få en versal.')
for (const t of lag2) console.log(`  · ${t}`)
console.log('')
