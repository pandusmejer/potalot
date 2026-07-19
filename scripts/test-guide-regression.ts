/**
 * Tests for promote-regressions-spærren (scripts/guide-regression.ts).
 *
 *   npx tsx scripts/test-guide-regression.ts
 *
 * Rene beslutnings-tests på planPromote/compareGuides + fil-niveau-tests på
 * applyPromote (--force skriver; afvist promote rører ALDRIG live-filen).
 * Alle fil-tests kører i en midlertidig mappe, som ryddes til sidst.
 */

import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { planPromote, applyPromote } from './guide-regression'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ← ' + extra}`)
  if (cond) ok++; else fejl++
}

/** Byg en guide-markdown med kontrollerbare markører. */
function mk(o: {
  botaniske?: boolean; plural?: boolean; potalotNote?: boolean
  guideCards?: number; nextGuide?: boolean; sections?: number; sources?: number
} = {}): string {
  const fm = ['---', 'slug: x', 'guideLevel: species', 'plantName: X', 'primaryCategoryId: fro', 'summary: "s"']
  if (o.plural) fm.push('pluralName: xer')
  const sources = o.sources ?? 0
  fm.push(`sourceLinks: [${Array.from({ length: sources }, (_, i) => `"https://ex.com/${i}"`).join(', ')}]`)
  if (o.botaniske) fm.push('botaniskeKendetegn:', '  - label: Højde', '    value: 2 m')
  fm.push('---', '')
  const body: string[] = []
  for (let i = 0; i < (o.sections ?? 1); i++) body.push(`## Sektion ${i + 1}`, '', `Tekst ${i + 1}.`, '')
  for (let i = 0; i < (o.guideCards ?? 0); i++) body.push(':::guide', `slug: teknik-${i}`, 'title: T', 'description: D', ':::', '')
  if (o.nextGuide) body.push(':::next-guide', 'title: N', 'description: D', 'slug: y', 'label: L', ':::', '')
  if (o.potalotNote) body.push('## Potalot-note', '', 'En note.', '')
  return fm.join('\n') + body.join('\n')
}

const blocked = (cand: string, live: string) => planPromote(cand, live, false).action === 'blocked'

// ── 1. Ny guide promoveres uden problemer ───────────────────────────────────
tjek('NEW: ingen live → create, skriver', (() => {
  const p = planPromote(mk({ sections: 2 }), null, false)
  return p.action === 'create' && p.willWrite && p.regressions.length === 0
})())

// ── 2. Identisk eller rigere kandidat promoveres ────────────────────────────
{
  const live = mk({ botaniske: true, plural: true, potalotNote: true, guideCards: 2, nextGuide: true, sections: 3, sources: 2 })
  tjek('Identisk kandidat → update-clean', planPromote(live, live, false).action === 'update-clean')
  const rigere = mk({ botaniske: true, plural: true, potalotNote: true, guideCards: 3, nextGuide: true, sections: 5, sources: 4 })
  tjek('Rigere kandidat (flere kort/sektioner/kilder) → update-clean', planPromote(rigere, live, false).action === 'update-clean')
}

// ── 3. Færre sektioner blokeres ─────────────────────────────────────────────
tjek('Færre sektioner (4→2) blokeres', blocked(mk({ sections: 2 }), mk({ sections: 4 })))

// ── 4. Tab af botaniskeKendetegn blokeres ───────────────────────────────────
tjek('Tab af botaniskeKendetegn blokeres', blocked(mk({ sections: 2 }), mk({ botaniske: true, sections: 2 })))

// ── 5. Tab af Potalot-note blokeres ─────────────────────────────────────────
// live: 2 alm. sektioner + Potalot-note = 3 ## ; cand: 3 alm. sektioner = 3 ##
// → kun potalotNote adskiller (sektionstal ens).
tjek('Tab af Potalot-note blokeres', blocked(mk({ sections: 3 }), mk({ potalotNote: true, sections: 2 })))

// ── 6. Tab af teknik-kort eller next-guide blokeres ─────────────────────────
tjek('Tab af :::guide teknik-kort (2→0) blokeres', blocked(mk({ sections: 2 }), mk({ guideCards: 2, sections: 2 })))
tjek('Tab af :::next-guide blokeres', blocked(mk({ sections: 2 }), mk({ nextGuide: true, sections: 2 })))

// ── 7. Færre kilder blokeres ────────────────────────────────────────────────
tjek('Færre sourceLinks (3→1) blokeres', blocked(mk({ sources: 1, sections: 2 }), mk({ sources: 3, sections: 2 })))

// ── Fil-niveau: --force skriver · afvist promote rører ikke live ────────────
const dir = mkdtempSync(join(tmpdir(), 'guide-reg-'))
try {
  const livePath = join(dir, 'g.md')
  const candPath = join(dir, 'cand.md')
  const richLive = mk({ botaniske: true, potalotNote: true, guideCards: 2, nextGuide: true, sections: 3, sources: 2 })
  const thinCand = mk({ sections: 2 })

  // 8. --force virker (skriver trods regression, rapporterer)
  writeFileSync(livePath, richLive)
  writeFileSync(candPath, thinCand)
  let reported = 0
  const forced = applyPromote(candPath, livePath, true, () => { reported++ })
  tjek('--force: action=update-forced, skriver, rapport vist',
    forced.action === 'update-forced' && forced.willWrite && reported === 1 && readFileSync(livePath, 'utf8') === thinCand)

  // 9. Afvist promote (uden force) ændrer IKKE live-filen
  writeFileSync(livePath, richLive)
  writeFileSync(candPath, thinCand)
  reported = 0
  const rejected = applyPromote(candPath, livePath, false, () => { reported++ })
  tjek('Afvist promote: action=blocked, skriver IKKE, live-fil uændret',
    rejected.action === 'blocked' && !rejected.willWrite && reported === 1 && readFileSync(livePath, 'utf8') === richLive)

  // Ekstra: NEW via applyPromote (fil-niveau) opretter live-filen
  const newLive = join(dir, 'ny.md')
  const created = applyPromote(candPath, newLive, false)
  tjek('applyPromote NEW: opretter live-fil',
    created.action === 'create' && existsSync(newLive) && readFileSync(newLive, 'utf8') === thinCand)
} finally {
  rmSync(dir, { recursive: true, force: true })
}

console.log(`\n${ok} ok · ${fejl} fejl`)
process.exit(fejl ? 1 : 0)
