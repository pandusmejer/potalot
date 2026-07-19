/**
 * Node-tests for intake-core (guides:intake's rene logik).
 *   npx tsx scripts/test-guides-intake.ts
 */

import {
  normalizeName, guideKey, slugKey, folderForLevel, classify,
  photoNameKey, matchPhotoToGuide, promoteOrder, type GuideMeta,
} from './intake-core'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ← ' + extra}`)
  if (cond) ok++; else fejl++
}

const g = (over: Partial<GuideMeta>): GuideMeta => ({
  slug: 'x', guideLevel: 'variety', parentSlug: null, plantName: 'X', variety: null, ...over,
})

// ── normalizeName ─────────────────────────────────────────────────
tjek('apostrof fjernes', normalizeName("Gardener's Delight") === 'gardeners delight', normalizeName("Gardener's Delight"))
tjek('ø→oe', normalizeName('Hvidløg') === 'hvidloeg')
tjek('slash+whitespace kollapser', normalizeName('Salat / Little Gem') === 'salat little gem')
tjek('accent foldes', normalizeName('Café') === 'cafe')

// ── folderForLevel ────────────────────────────────────────────────
tjek('art → arts', folderForLevel('species') === 'arts')
tjek('sort → plantekort', folderForLevel('variety') === 'plantekort')

// ── classify ──────────────────────────────────────────────────────
{
  const live = new Set(['tomat', 'tomat-sungold'])
  tjek('eksisterende slug → update', classify('tomat', live) === 'update')
  tjek('ny slug → new', classify('hvidloeg', live) === 'new')
}

// ── slugKey / guideKey ────────────────────────────────────────────
tjek('slugKey: bindestreg→ord', slugKey('salat-little-gem') === 'salat little gem')
tjek('guideKey: art+sort', guideKey(g({ plantName: 'Tomat', variety: 'Sungold' })) === 'tomat sungold')
tjek('guideKey: kun art', guideKey(g({ plantName: 'Hvidløg', variety: null })) === 'hvidloeg')

// ── photoNameKey (rolle-ord fjernes) ──────────────────────────────
tjek('rolle-ord "plantekort" fjernes', photoNameKey('tomat sungold plantekort.png') === 'tomat sungold')
tjek('rolle-ord "arts" fjernes', photoNameKey('hvidloeg arts.jpg') === 'hvidloeg')
tjek('endelse fjernes', photoNameKey('hvidloeg.jpg') === 'hvidloeg')
tjek('token "art" i navn bevares (ikke rolle-ord)', photoNameKey('smoke-art.jpg') === 'smoke art')

// ── matchPhotoToGuide ─────────────────────────────────────────────
{
  const guides: GuideMeta[] = [
    g({ slug: 'hvidloeg', guideLevel: 'species', plantName: 'Hvidløg', variety: null }),
    g({ slug: 'salat', guideLevel: 'species', plantName: 'Salat', variety: null }),
    g({ slug: 'salat-little-gem', guideLevel: 'variety', plantName: 'Salat', variety: 'Little Gem' }),
    g({ slug: 'tomat-sungold', guideLevel: 'variety', plantName: 'Tomat', variety: 'Sungold' }),
    g({ slug: 'tomat-gardeners-delight', guideLevel: 'variety', plantName: 'Tomat', variety: "Gardener's Delight" }),
  ]
  const m = (f: string) => matchPhotoToGuide(f, guides)
  tjek('foto → tomat-sungold', m('tomat sungold plantekort.png').kind === 'match' && (m('tomat sungold plantekort.png') as any).guide.slug === 'tomat-sungold')
  tjek('foto (slug-navn) → hvidloeg', (m('hvidloeg.jpg') as any).guide?.slug === 'hvidloeg')
  tjek('apostrof-sort → gardeners-delight', (m('tomat gardeners delight plantekort.png') as any).guide?.slug === 'tomat-gardeners-delight')
  tjek('sort-navn → salat-little-gem', (m('salat little gem.jpg') as any).guide?.slug === 'salat-little-gem')
  tjek('bare "salat" → art-guiden (ikke flertydig)', (m('salat.png') as any).guide?.slug === 'salat')
  tjek('ukendt → none', m('agurk marketmore.jpg').kind === 'none')
}

// ── ambiguous: to guides med samme nøgle → placeres ikke ──────────
{
  const dup: GuideMeta[] = [
    g({ slug: 'a', plantName: 'Tomat', variety: 'Roma' }),
    g({ slug: 'b', plantName: 'Tomat', variety: 'Roma' }),
  ]
  tjek('flertydig → ambiguous', matchPhotoToGuide('tomat roma.jpg', dup).kind === 'ambiguous')
}

// ── promoteOrder: species før variety ─────────────────────────────
{
  const ord = promoteOrder([
    g({ slug: 'salat-little-gem', guideLevel: 'variety' }),
    g({ slug: 'salat', guideLevel: 'species' }),
  ])
  tjek('species promoveres før variety', ord[0].slug === 'salat' && ord[1].slug === 'salat-little-gem')
}

console.log(`\n${ok} ok · ${fejl} fejl`)
process.exit(fejl ? 1 : 0)
