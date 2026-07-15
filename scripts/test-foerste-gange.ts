/**
 * Node-test for "Første gange"-deriveren (lib/havebog-foerste-gange.ts).
 *
 * Kør:  npx tsx scripts/test-foerste-gange.ts
 *
 * Beviser Annas afgrænsning: kun beviselige milepæle, drivhus kun ved tydelig
 * location, ingen gæt, stabil sortering, korrekt gating.
 */

import {
  byggFoersteGange,
  foersteGangePreview,
  type FGLog,
  type FGPlant,
} from '@/lib/havebog-foerste-gange'

let passed = 0
let failed = 0
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++
    console.log(`✅ ${name}`)
  } else {
    failed++
    console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}
const pmap = (e: [string, FGPlant][]) => new Map<string, FGPlant>(e)

// 1 · Første høst = tidligste harvest-dato + afgrøde-label
{
  const logs: FGLog[] = [
    { plant_id: 't', type: 'harvest', date: '2025-08-10' },
    { plant_id: 't', type: 'harvest', date: '2025-07-01' },
    { plant_id: 't', type: 'harvest', date: '2025-09-05' },
  ]
  const h = byggFoersteGange(logs, pmap([['t', { name: 'Tomat' }]])).find(x => x.kind === 'hoest')
  ok('1. Første høst = tidligste + afgrøde-label', h?.dato === '2025-07-01' && h?.titel === 'Første tomathøst', JSON.stringify(h))
}

// 2 · Finder såning, spiring, udplantning, beskæring
{
  const logs: FGLog[] = [
    { plant_id: 'a', type: 'sowing', date: '2025-03-01' },
    { plant_id: 'a', type: 'germination', date: '2025-03-10' },
    { plant_id: 'a', type: 'planting_out', date: '2025-05-01' },
    { plant_id: 'a', type: 'pruning', date: '2025-06-15' },
    { plant_id: 'a', type: 'pest_disease', date: '2025-06-20' },
  ]
  const kinds = new Set(byggFoersteGange(logs, pmap([['a', { name: 'Agurk' }]])).map(x => x.kind))
  ok('2. Finder såning+spiring+udplantning+beskæring+skadedyr',
    ['saaning', 'spiring', 'udplantning', 'beskaering', 'skadedyr'].every(k => kinds.has(k as never)),
    [...kinds].join(','))
}

// 3 · Ignorerer typer uden milepæl (vanding/gødning/note/ompotning/ukendt)
{
  const logs: FGLog[] = [
    { plant_id: 'a', type: 'watering', date: '2025-04-01' },
    { plant_id: 'a', type: 'fertilizing', date: '2025-04-02' },
    { plant_id: 'a', type: 'note', date: '2025-04-03' },
    { plant_id: 'a', type: 'repotting', date: '2025-04-04' },
    { plant_id: 'a', type: 'froeavl', date: '2025-04-05' }, // findes ikke som logtype
  ]
  const r = byggFoersteGange(logs, pmap([['a', { name: 'Basilikum' }]]))
  ok('3. Ignorerer vanding/gødning/note/ompotning/frøavl', r.length === 0, `fik ${r.length}`)
}

// 4 · Ingen drivhus ved manglende eller uklar location
{
  const logs: FGLog[] = [{ plant_id: 'a', type: 'sowing', date: '2025-03-01' }]
  const ingen = byggFoersteGange(logs, pmap([['a', { name: 'Tomat', location: null }]])).some(x => x.kind === 'drivhus')
  const uklar = byggFoersteGange(logs, pmap([['a', { name: 'Tomat', location: 'ved siden af drivhuset' }]])).some(x => x.kind === 'drivhus')
  const andet = byggFoersteGange(logs, pmap([['a', { name: 'Tomat', location: 'Køkkenhaven' }]])).some(x => x.kind === 'drivhus')
  ok('4. Ingen drivhus ved manglende/uklar/anden location', !ingen && !uklar && !andet, `ingen=${ingen} uklar=${uklar} andet=${andet}`)
}

// 5 · Drivhus vises ved tydelig location (label starter med drivhus)
{
  const logs: FGLog[] = [
    { plant_id: 'd', type: 'sowing', date: '2025-02-15' },
    { plant_id: 'd', type: 'harvest', date: '2025-08-01' },
  ]
  const d = byggFoersteGange(logs, pmap([['d', { name: 'Tomat', location: 'Drivhus 1' }]])).find(x => x.kind === 'drivhus')
  ok('5. Drivhus ved tydelig location + tidligste log-dato', d?.dato === '2025-02-15' && d?.titel === 'Første drivhussæson', JSON.stringify(d))
}

// 6 · Preview: max 4, nyeste først
{
  const logs: FGLog[] = [
    { plant_id: 'a', type: 'sowing', date: '2023-03-01' },
    { plant_id: 'a', type: 'germination', date: '2023-03-10' },
    { plant_id: 'a', type: 'planting_out', date: '2024-05-01' },
    { plant_id: 'a', type: 'pruning', date: '2024-06-01' },
    { plant_id: 'a', type: 'harvest', date: '2025-08-01' },
  ]
  const prev = foersteGangePreview(byggFoersteGange(logs, pmap([['a', { name: 'Tomat' }]])), 4)
  ok('6. Preview max 4, nyeste først', prev.length === 4 && prev[0].kind === 'hoest' && prev[0].aar === '2025', JSON.stringify(prev.map(p => p.aar)))
}

// 7 · Stabil, deterministisk sortering (samme input → samme output)
{
  const logs: FGLog[] = [
    { plant_id: 'a', type: 'sowing', date: '2025-03-01' },
    { plant_id: 'a', type: 'harvest', date: '2025-03-01' }, // samme dato → tie-break på kind
    { plant_id: 'a', type: 'pruning', date: '2025-03-01' },
  ]
  const a = JSON.stringify(byggFoersteGange(logs, pmap([['a', { name: 'Tomat' }]])))
  const b = JSON.stringify(byggFoersteGange(logs, pmap([['a', { name: 'Tomat' }]])))
  ok('7. Stabil sortering ved ens datoer', a === b, 'to kald gav forskelligt output')
}

// 8 · Gating: tom liste når ingen milepæle
{
  const r = byggFoersteGange([], new Map())
  ok('8. Ingen milepæle → tom liste', r.length === 0, `fik ${r.length}`)
}

// Bonus · afsluttet forløb fra arkiveret plante
{
  const r = byggFoersteGange([], pmap([['x', { name: 'Tomat', is_archived: true, archived_at: '2024-11-01T10:00:00Z' }]]))
  const af = r.find(x => x.kind === 'afsluttet')
  ok('9. Afsluttet forløb fra arkiveret plante', af?.dato === '2024-11-01' && af?.titel === 'Første afsluttede forløb', JSON.stringify(af))
}

console.log(`\n${passed} bestået, ${failed} fejlet.`)
if (failed > 0) process.exit(1)
