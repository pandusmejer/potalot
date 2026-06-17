/**
 * Node-test for Kalenderens BRAIN (lib/kalender/dagens-fokus.ts).
 *
 * Kør:  npx tsx scripts/test-dagens-fokus.ts
 *
 * Ikke en del af appen — et inspektions-script så vi kan SE
 * prioriteringslogikkens output på demo-data uden at røre UI'et.
 * Det er sådan brain'en valideres trin for trin (inkrement 1).
 */

import { byggDagensFokus, type DagensFokus, type FokusHandling } from '@/lib/kalender/dagens-fokus'
import { mockPlants } from '@/data/mock-plants'
import type { InventoryItem, Plant } from '@/lib/types'

const TODAY = new Date('2026-06-17T09:00:00') // juni — samme dag som currentDate
const plants = mockPlants as unknown as Plant[]

// Demo-frøbank: et par poser så lag 4 (frøbank × måned) kan vises.
// Marketmore-agurk gror ALLEREDE (i demo) → skal IKKE foreslås sået.
// Gulerod + Spinat ejes men gror ikke → ægte lag-4-invitationer i juni.
function inv(p: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'name'>): InventoryItem {
  return {
    userId: 'demo-user', variety: null, primaryCategoryId: 'fro' as InventoryItem['primaryCategoryId'],
    sowingDepthMm: 0, sowingMonths: [], plantingOutMonths: [], harvestMonths: [],
    growingLocations: [], status: 'aktiv' as InventoryItem['status'],
    isFavorite: false, isPinned: false, imageIds: [], linkedPlantIds: [],
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...p,
  } as InventoryItem
}
const inventory: InventoryItem[] = [
  inv({ id: 'seed-gulerod', name: 'Gulerod', variety: 'Nantes', sowingMonths: [3, 4, 5, 6, 7] }),
  inv({ id: 'seed-spinat', name: 'Spinat', variety: 'Matador', sowingMonths: [4, 8, 9], plantingOutMonths: [6] }),
  inv({ id: 'seed-agurk', name: 'Agurk', variety: 'Marketmore', sowingMonths: [5, 6] }), // gror allerede → skip
  inv({ id: 'seed-kaalrabi', name: 'Kålrabi', variety: 'Blaril', preCultivation: true, sowingMonths: [6] }),
]

// ── Hjælpere til pæn udskrift ────────────────────────────────────
const LAG_NAVN: Record<number, string> = {
  1: 'TIDSKRITISK', 2: 'STATUS', 3: 'VERIFIKATION', 4: 'FRØBANK', 5: 'VEDLIGEHOLD',
}
function vis(h: FokusHandling): string {
  const mark = h.udfoert ? '✓' : '·'
  return `   ${mark} [lag ${h.lag} ${LAG_NAVN[h.lag]}] ${h.titel}\n       → ${h.hvorfor}\n       key: ${h.taskKey}`
}
function rapport(navn: string, r: DagensFokus) {
  console.log(`\n━━━ ${navn} ━━━`)
  console.log(`trin: ${r.trin}   stilhed: ${r.stilhed}`)
  console.log(`FOKUS (${r.fokus.length}/3):`)
  r.fokus.forEach(h => console.log(vis(h)))
  if (r.flere.length) {
    console.log(`FLERE (${r.flere.length} bag "Se alle"):`)
    r.flere.forEach(h => console.log(vis(h)))
  }
  if (r.stilhed) console.log('   (stilhed → UI ville sige "alt ser godt ud i dag")')
}

// ── Assertions (let, men fanger regressioner) ────────────────────
let fejl = 0
function ok(betingelse: boolean, besked: string) {
  if (!betingelse) { fejl++; console.log(`   ✗ FAIL: ${besked}`) }
  else console.log(`   ✓ ${besked}`)
}

// ── Scenarie 1: fuld demo-have (trin 2) ──────────────────────────
const fuld = byggDagensFokus({ plants, inventory, today: TODAY })
rapport('Scenarie 1 — fuld demo-have, ingen completions', fuld)
console.log('  assertions:')
ok(fuld.trin === 2, 'trin = 2 (aktive planter findes)')
ok(fuld.fokus.length === 3, 'max 3 i fokus')
ok(!fuld.stilhed, 'ikke stilhed (der ER pressende handlinger)')
ok(fuld.fokus.every(h => /^[A-ZÆØÅ]/.test(h.titel)), 'alle titler i bydeform (stort forbogstav-verbum)')
ok(fuld.fokus[0].lag <= fuld.fokus[fuld.fokus.length - 1].lag, 'fokus er lag-sorteret (lavest lag først)')
const harHoest = [...fuld.fokus, ...fuld.flere].some(h => h.taskType === 'hoest')
ok(harHoest, 'Salat (hoestklar) gav en Høst-handling (lag 2)')
// Dedup-test: ingen LAG-4-invitation (så/plant-ud) for en sort der gror.
// (Lag-2 "Prikl Agurk" er den aktive plante og SKAL være der — derfor lag===4.)
const saaAgurk = [...fuld.fokus, ...fuld.flere].some(h => h.lag === 4 && h.titel.includes('Agurk'))
ok(!saaAgurk, 'Agurk Marketmore foreslås IKKE sået i lag 4 (gror allerede)')
const harFroebank = [...fuld.fokus, ...fuld.flere].some(h => h.lag === 4)
ok(harFroebank, 'frøbank-invitationer (lag 4) er med')

// ── Scenarie 2: completions → udførte falder ud af pres ──────────
// Markér ALLE pressende plante-handlinger udført → tjek at de skubbes bagud
// og at stilhed indtræffer hvis intet pressende er tilbage.
const alle = byggDagensFokus({ plants, inventory, today: TODAY })
const alleKeys = [...alle.fokus, ...alle.flere].map(h => h.taskKey)
const medCompletions = byggDagensFokus({ plants, inventory, today: TODAY, completions: alleKeys })
rapport('Scenarie 2 — ALT markeret udført', medCompletions)
console.log('  assertions:')
ok(medCompletions.stilhed, 'stilhed = true når alt pressende er udført')
ok(medCompletions.fokus.every(h => h.udfoert), 'de viste handlinger er markeret udført')

// ── Scenarie 3: tom have (trin 0 — degradation) ──────────────────
const tom = byggDagensFokus({ plants: [], inventory: [], today: TODAY })
rapport('Scenarie 3 — ingen data (ny bruger)', tom)
console.log('  assertions:')
ok(tom.trin === 0, 'trin = 0 (ingen data)')
ok(tom.stilhed, 'stilhed = true (intet at gøre — almanak-tekst kommer i inkrement 3)')
ok(tom.fokus.length === 0, 'ingen fokus-handlinger')

// ── Scenarie 4: kun frøbank (trin 1) ─────────────────────────────
const kunFroe = byggDagensFokus({ plants: [], inventory, today: TODAY })
rapport('Scenarie 4 — kun frøbank, ingen planter', kunFroe)
console.log('  assertions:')
ok(kunFroe.trin === 1, 'trin = 1 (frøbank har indhold, ingen planter)')
ok([...kunFroe.fokus, ...kunFroe.flere].every(h => h.lag === 4), 'kun lag-4-invitationer')

console.log(`\n${fejl === 0 ? '✅ ALLE ASSERTIONS BESTÅET' : `❌ ${fejl} ASSERTION(ER) FEJLEDE`}`)
process.exit(fejl === 0 ? 0 : 1)
