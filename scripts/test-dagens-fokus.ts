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
import { quickFactsForNavn } from '@/lib/afledninger'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import type { GardenAlert } from '@/actions/weather'
import type { InventoryItem, Plant } from '@/lib/types'

const TODAY = new Date('2026-06-17T09:00:00') // juni — samme dag som currentDate
const plants = mockPlants as unknown as Plant[]
const guides = IMPORTED_GUIDES

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

function visningsKort(p: Plant): string {
  return p.variety ? `${p.name} ${p.variety}` : p.name
}

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
  if (r.rytme.length) {
    console.log(`RYTME / lag 5 (${r.rytme.length} — vedligehold, ikke dagens fokus):`)
    r.rytme.forEach(h => console.log(vis(h)))
  }
  if (r.almanak) console.log(`ALMANAK: ${r.almanak}`)
  if (r.stilhed) console.log('   (stilhed → UI ville sige "alt ser godt ud i dag")')
}

// ── Assertions (let, men fanger regressioner) ────────────────────
let fejl = 0
function ok(betingelse: boolean, besked: string) {
  if (!betingelse) { fejl++; console.log(`   ✗ FAIL: ${besked}`) }
  else console.log(`   ✓ ${besked}`)
}

// ── Scenarie 1: fuld demo-have (trin 2) ──────────────────────────
const fuld = byggDagensFokus({ plants, inventory, guides, today: TODAY })
rapport('Scenarie 1 — fuld demo-have, ingen completions', fuld)
console.log('  assertions:')
ok(fuld.trin === 2, 'trin = 2 (aktive planter findes)')
ok(fuld.fokus.length === 3, 'max 3 i fokus')
ok(!fuld.stilhed, 'ikke stilhed (der ER pressende handlinger)')
ok(fuld.fokus.every(h => /^[A-ZÆØÅ]/.test(h.titel)), 'alle titler i bydeform (stort forbogstav-verbum)')
ok(fuld.fokus[0].lag <= fuld.fokus[fuld.fokus.length - 1].lag, 'fokus er lag-sorteret (lavest lag først)')
const harHoest = [...fuld.fokus, ...fuld.flere].some(h => h.taskType === 'hoest')
ok(harHoest, 'Salat (hoestklar) gav en Høst-handling (lag 2)')
// Lag 5 (rytme) er adskilt fra fokus/flere og bryder ikke stilhed.
ok(fuld.fokus.concat(fuld.flere).every(h => h.lag <= 4), 'fokus/flere er KUN lag 1-4 (lag 5 ligger i rytme)')
ok(fuld.rytme.every(h => h.lag === 5), 'rytme indeholder kun lag-5-handlinger')
console.log(`     (rytme/vedligehold i juni: ${fuld.rytme.length} handling(er))`)
// Tie-break #1 (deadline): inden for samme lag må en kendt deadline aldrig
// stå EFTER en ukendt, og tidligere deadline ikke efter en senere.
function deadlineMonotont(hs: FokusHandling[]): boolean {
  for (let i = 1; i < hs.length; i++) {
    if (hs[i - 1].lag !== hs[i].lag) continue
    const a = hs[i - 1].deadlineMaaned ?? 99
    const b = hs[i].deadlineMaaned ?? 99
    if (a > b) return false
  }
  return true
}
ok(deadlineMonotont(fuld.fokus.concat(fuld.flere)), 'tie-break: deadline-rækkefølge er monoton inden for hvert lag')
// Dedup-test: ingen LAG-4-invitation (så/plant-ud) for en sort der gror.
// (Lag-2 "Prikl Agurk" er den aktive plante og SKAL være der — derfor lag===4.)
const saaAgurk = [...fuld.fokus, ...fuld.flere].some(h => h.lag === 4 && h.titel.includes('Agurk'))
ok(!saaAgurk, 'Agurk Marketmore foreslås IKKE sået i lag 4 (gror allerede)')
const harFroebank = [...fuld.fokus, ...fuld.flere].some(h => h.lag === 4)
ok(harFroebank, 'frøbank-invitationer (lag 4) er med')

// ── Scenarie 2: completions → udførte falder ud af pres ──────────
// Markér ALLE pressende plante-handlinger udført → tjek at de skubbes bagud
// og at stilhed indtræffer hvis intet pressende er tilbage.
const alle = byggDagensFokus({ plants, inventory, guides, today: TODAY })
const alleKeys = [...alle.fokus, ...alle.flere, ...alle.rytme].map(h => h.taskKey)
const medCompletions = byggDagensFokus({ plants, inventory, guides, today: TODAY, completions: alleKeys })
rapport('Scenarie 2 — ALT markeret udført', medCompletions)
console.log('  assertions:')
ok(medCompletions.stilhed, 'stilhed = true når alt pressende er udført')
ok(medCompletions.fokus.every(h => h.udfoert), 'de viste handlinger er markeret udført')

// ── Scenarie 3: tom have (trin 0 — degradation) ──────────────────
const tom = byggDagensFokus({ plants: [], inventory: [], today: TODAY })
rapport('Scenarie 3 — ingen data (ny bruger)', tom)
console.log('  assertions:')
ok(tom.trin === 0, 'trin = 0 (ingen data)')
ok(tom.stilhed, 'stilhed = true (intet at gøre)')
ok(tom.fokus.length === 0, 'ingen fokus-handlinger')
ok(!!tom.almanak, 'trin 0 har en almanak-pladsholder (siden er aldrig tom)')
ok(tom.almanak?.includes('juni') ?? false, 'almanak nævner den aktuelle måned (juni)')

// ── Scenarie 4: kun frøbank (trin 1) ─────────────────────────────
const kunFroe = byggDagensFokus({ plants: [], inventory, today: TODAY })
rapport('Scenarie 4 — kun frøbank, ingen planter', kunFroe)
console.log('  assertions:')
ok(kunFroe.trin === 1, 'trin = 1 (frøbank har indhold, ingen planter)')
ok([...kunFroe.fokus, ...kunFroe.flere].every(h => h.lag === 4), 'kun lag-4-invitationer')
ok(!kunFroe.almanak, 'ingen almanak når trin 1 HAR aktuelle handlinger (lag 4 fylder)')

// ── Scenarie 4b: frøbank uden aktuelle handlinger (trin 1 → almanak) ──
// En frøpose hvis vinduer ikke er åbne i juni → trin 1, men intet at gøre.
const vinterFroe = byggDagensFokus({
  plants: [],
  inventory: [inv({ id: 'seed-vinterloeg', name: 'Vinterløg', sowingMonths: [9, 10] })],
  today: TODAY,
})
rapport('Scenarie 4b — frøbank, men intet vindue åbent i juni', vinterFroe)
console.log('  assertions:')
ok(vinterFroe.trin === 1, 'trin = 1 (frøbank har indhold)')
ok(vinterFroe.fokus.length === 0, 'ingen handlinger denne måned')
ok(!!vinterFroe.almanak, 'almanak-pladsholder fylder den ellers tomme side')

// ── Scenarie 5: frostvarsel → lag 1 (tidskritisk) øverst ─────────
const frostAlert: GardenAlert = {
  kind: 'frost', severity: 'warning', icon: 'Snowflake',
  title: 'Nattefrost i nat', detail: 'Ned til -1°. Dæk sarte planter.',
}
// Find en udplantet plante hvis guide POSITIVT siger frostfølsom — så
// scenariet er ærligt forankret i demo-data og ikke et opdigtet tilfælde.
const udplantedeFrostfoelsomme = plants.filter(
  p => !p.isArchived && p.status === 'udplantet' &&
    quickFactsForNavn(p.name, p.variety)?.frostSensitive === true,
)
const medFrost = byggDagensFokus({ plants, inventory, guides, today: TODAY, alerts: [frostAlert] })
rapport('Scenarie 5 — frostvarsel aktivt', medFrost)
console.log(`  (udplantede frostfølsomme i demo: ${udplantedeFrostfoelsomme.map(p => visningsKort(p)).join(', ') || 'ingen'})`)
console.log('  assertions:')
if (udplantedeFrostfoelsomme.length > 0) {
  ok(medFrost.fokus[0]?.lag === 1, 'lag 1 (frost) ligger ØVERST i fokus')
  ok(medFrost.fokus[0]?.taskType === 'daek', 'øverste handling er en Dæk-handling')
  ok(medFrost.fokus.some(h => h.titel.startsWith('Dæk')), 'fokus indeholder en Dæk-handling i bydeform')
} else {
  console.log('   (ingen udplantede frostfølsomme i demo — lag 1 forbliver korrekt tom)')
  ok(!medFrost.fokus.some(h => h.lag === 1), 'ingen lag-1-handling uden frostfølsomme udplantede (ærlig stilhed)')
}
// Uden frostvarsel må lag 1 ALDRIG optræde (selv med frostfølsomme planter).
const udenFrost = byggDagensFokus({ plants, inventory, today: TODAY })
ok(!udenFrost.fokus.concat(udenFrost.flere).some(h => h.lag === 1), 'intet lag 1 uden aktivt frostvarsel')

console.log(`\n${fejl === 0 ? '✅ ALLE ASSERTIONS BESTÅET' : `❌ ${fejl} ASSERTION(ER) FEJLEDE`}`)
process.exit(fejl === 0 ? 0 : 1)
