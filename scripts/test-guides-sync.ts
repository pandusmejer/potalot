/**
 * Node-tests for master-syncen (guides-master-sync-spec.md §6).
 *
 *   npx tsx scripts/test-guides-sync.ts
 *
 * Dækker de OFFLINE-verificerbare dele: normaliseringsnøglen, mapping (statisk
 * Guide → DB-payload) og valideringen. De DB-afhængige acceptkrav (idempotens,
 * master-preference i ensureGuideFor*, badge-integritet) bevises mod live via
 *   npm run guides:sync-master -- --dry-run   (kør to gange → 0 create/update)
 * og gennemgås i den kørsel. Se noterne nederst.
 */

import { normalizeGuideKey } from '@/lib/guides/normalize-key'
import { mapGuide, validate } from './guides-sync-master'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import type { Guide } from '@/lib/types'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ← ' + extra}`)
  if (cond) ok++; else fejl++
}

// Minimal Guide-fabrik til konstruerede validerings-/mapping-cases.
function guide(over: Partial<Guide>): Guide {
  return {
    id: 'x', plantName: 'X', variety: null, latinName: null,
    guideLevel: 'species', parentGuideId: null, primaryCategoryId: 'fro',
    subcategoryId: null, summary: '', difficulty: 'medium', tags: [],
    quickFacts: { sowingMonths: [], directSowingMonths: [], plantingOutMonths: [], harvestMonths: [] },
    sections: [], calendarRules: [], mediaIds: [],
    primaryImageId: null, sourceLinks: [], status: 'published',
    visibility: 'public', reviewStatus: 'approved', createdAt: '', updatedAt: '',
    ...over,
  }
}

// ── §5 / §6 test 5 — normaliseringsnøgle (apostrof/case/whitespace) ──────────
{
  const a = normalizeGuideKey("Gardener's Delight")      // U+2019 krøllet
  const b = normalizeGuideKey("Gardener's Delight")      // U+0027 lige
  const c = normalizeGuideKey('Gardeners Delight')       // ingen apostrof
  tjek('Apostrof: alle tre skrivemåder → samme nøgle', a === b && b === c, `${a} | ${b} | ${c}`)
  tjek('Case + whitespace kollapser', normalizeGuideKey('  TOMAT   Sungold ') === 'tomat sungold')
  tjek('Café au Lait bevarer accent, lowercases', normalizeGuideKey('Café au Lait') === 'café au lait')
}

// ── §2 mapping — guide_level oversættelse + parent_slug ──────────────────────
{
  const art = mapGuide(guide({ id: 'tomat', plantName: 'Tomat', guideLevel: 'species' }))
  tjek('Art: guideLevel species → guide_level art', art.guide_level === 'art')
  tjek('Art: variety null, parent_slug null', art.variety === null && art.parent_slug === null)
  tjek('Art: slug = id', art.slug === 'tomat')

  const sort = mapGuide(guide({
    id: 'tomat-sungold', plantName: 'Tomat', variety: 'Sungold',
    guideLevel: 'variety', parentGuideId: 'tomat',
  }))
  tjek('Sort: guideLevel variety → guide_level sort', sort.guide_level === 'sort')
  tjek('Sort: parent_slug = parentGuideId', sort.parent_slug === 'tomat')
  tjek('Sort: variety bevaret', sort.variety === 'Sungold')

  // status/is_ai_generated sættes i DB-funktionen — payload bærer indhold, ikke flag.
  const real = mapGuide(IMPORTED_GUIDES.find(g => g.id === 'tomat-gardeners-delight')!)
  tjek('Ægte Gardeners Delight mappes til sort under tomat',
    real.guide_level === 'sort' && real.parent_slug === 'tomat')
}

// ── §3 validering ────────────────────────────────────────────────────────────
{
  // Samme sæt som main() synker: teknikguider har ingen primaryCategoryId og
  // filtreres fra før validering (de hører ikke til i master-tabellen).
  const syncable = IMPORTED_GUIDES.filter(g => g.guideLevel !== 'technique')
  tjek('Ægte IMPORTED_GUIDES består validering', validate(syncable).length === 0,
    JSON.stringify(validate(syncable)))

  // Test 7-lag: forældreløs sort fanges FØR skrivning (DB-funktionen ruller
  // desuden tilbage, hvis den slipper igennem).
  const orphan = validate([
    guide({ id: 'chili', plantName: 'Chili', guideLevel: 'species' }),
    guide({ id: 'chili-ukendt', plantName: 'Chili', variety: 'Ukendt', guideLevel: 'variety', parentGuideId: 'findes-ikke' }),
  ])
  tjek('Forældreløs sort → valideringsfejl', orphan.some(e => e.includes('forældreløs')), JSON.stringify(orphan))

  const dup = validate([
    guide({ id: 'tomat', plantName: 'Tomat' }),
    guide({ id: 'tomat', plantName: 'Tomat' }),
  ])
  tjek('Duplikeret slug → fejl', dup.some(e => e.includes('Duplikeret')))

  const badCat = validate([guide({ id: 'a', primaryCategoryId: 'favoritter' as Guide['primaryCategoryId'] })])
  tjek('Ugyldig primaryCategoryId → fejl', badCat.some(e => e.includes('primaryCategoryId')))

  const badDiff = validate([guide({ id: 'a', difficulty: 'umulig' as Guide['difficulty'] })])
  tjek('Ugyldig difficulty → fejl', badDiff.some(e => e.includes('difficulty')))

  const collision = validate([
    guide({ id: 'tomat', plantName: 'Tomat', guideLevel: 'species' }),
    guide({ id: 'tomat-gd', plantName: 'Tomat', variety: "Gardener's Delight", guideLevel: 'variety', parentGuideId: 'tomat' }),
    guide({ id: 'tomat-gd2', plantName: 'Tomat', variety: 'Gardeners Delight', guideLevel: 'variety', parentGuideId: 'tomat' }),
  ])
  tjek('Navnekollision (samme normaliserede nøgle) → fejl', collision.some(e => e.includes('Navnekollision')))
}

// ── Matching-preference (spejler ensureGuideFor*-prædikatet i guides.ts) ──────
// Bevis for §6 test 3/4/5 på ren logik: art-uden-sort → arts-guide; art+sort →
// sortsguide; master (user_id NULL) vinder over bruger-guide; apostrof-variant
// kobler til masteren. (Selve DB-opslaget bevises mod live efter sync.)
{
  type Row = { id: string; plant_name: string; variety: string | null; user_id: string | null }
  const pick = (rows: Row[], plantName: string, variety: string | null): string | null => {
    const nameKey = normalizeGuideKey(plantName)
    const varietyKey = variety ? normalizeGuideKey(variety) : null
    const sorted = [...rows].sort((a, b) =>
      (a.user_id === null ? 0 : 1) - (b.user_id === null ? 0 : 1)) // NULLS FIRST
    const m = sorted.find(r => {
      if (normalizeGuideKey(r.plant_name) !== nameKey) return false
      if (varietyKey) return r.variety != null && normalizeGuideKey(r.variety) === varietyKey
      return r.variety == null
    })
    return m ? m.id : null
  }

  const rows: Row[] = [
    { id: 'm-tomat', plant_name: 'Tomat', variety: null, user_id: null },
    { id: 'm-sungold', plant_name: 'Tomat', variety: 'Sungold', user_id: null },
    { id: 'm-gd', plant_name: 'Tomat', variety: "Gardener's Delight", user_id: null },
    { id: 'u-sungold', plant_name: 'Tomat', variety: 'Sungold', user_id: 'user-1' },
  ]
  tjek('Test 3: art uden sort → arts-master', pick(rows, 'Tomat', null) === 'm-tomat')
  tjek('Test 4: art+sort → sorts-master (ikke art)', pick(rows, 'Tomat', 'Sungold') === 'm-sungold')
  tjek('Master vinder over bruger-guide (NULLS FIRST)', pick(rows, 'Tomat', 'Sungold') === 'm-sungold')
  tjek('Test 5: sort uden apostrof → apostrof-master', pick(rows, 'Tomat', 'Gardeners Delight') === 'm-gd')
  tjek('Ukendt sort → ingen match (→ AI-udkast)', pick(rows, 'Tomat', 'Ukendt Sort') === null)
}

console.log(`\n${fejl === 0 ? '✓ ALLE' : '✗'} ${ok} ok, ${fejl} fejl`)
console.log('\nDB-afhængige acceptkrav (§6 test 1,2,6,9) bevises mod live:')
console.log('  npm run guides:sync-master -- --dry-run   → kør efter sync: 0 create/update = idempotens (test 1)')
console.log('  opret Tomat/Sungold i frøbank → guide_id sættes til master, intet AI-udkast (test 2)')
process.exit(fejl === 0 ? 0 : 1)
