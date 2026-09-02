/**
 * Opgavetype-kontrakten — vagt om produktreglen (Anna 2/9).
 *
 *   AI må ALDRIG kunne skrive en calendarRule.taskType, som databasen ikke
 *   accepterer. Constrainten udvides IKKE for at rumme AI-opfundne navne.
 *
 * Den vigtigste test i filen er DRIFT-testen: den læser CHECK-constrainten
 * ud af 00018_calendar_tasks.sql og sammenligner med TS-listen. Går de fra
 * hinanden, er kontrakten brudt — og det var præcis dét brud, der gjorde
 * generatoren tavst virkningsløs for 19 af 22 private AI-guides.
 *
 * De 18 rå værdier nedenfor er ikke opfundne til lejligheden: de er hentet
 * ud af produktionsdatabasen 2/9 (Docs/product/kalenderregel-semantik-audit.md §5).
 */

import { readFileSync } from 'node:fs'
import {
  CANONISKE_OPGAVETYPER,
  GENERISK_OPGAVETYPE,
  erCanoniskOpgavetype,
  normaliserOpgavetype,
  normaliserKalenderregler,
} from '@/lib/kalender/opgavetype'
import { generateTasksFromGuide, partitionerPaaOpgavetype } from '@/lib/task-generation'
import type { Guide, GuideCalendarRule } from '@/lib/types'

let bestaaet = 0
let fejlet = 0

function tjek(navn: string, faktisk: unknown, forventet: unknown) {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet)
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else {
    fejlet++
    console.error(`  ✗ ${navn}\n      forventet: ${JSON.stringify(forventet)}\n      faktisk:   ${JSON.stringify(faktisk)}`)
  }
}

// ── 1. Drift mellem TS og databasen ─────────────────────────────────────
console.log('\n[Kontrakten: TS-liste == DB CHECK-constraint]')
{
  const sql = readFileSync('supabase/migrations/00018_calendar_tasks.sql', 'utf8')
  const m = sql.match(/task_type TEXT NOT NULL DEFAULT 'custom' CHECK \(task_type IN \(([\s\S]*?)\)\)/)
  tjek('CHECK-constrainten kan læses ud af migrationen', Boolean(m), true)
  const fraSql = (m?.[1] ?? '').match(/'([a-z_]+)'/g)?.map(s => s.replace(/'/g, '')) ?? []
  tjek(
    'de 13 canonical typer er ORDRET dem databasen accepterer',
    [...fraSql].sort(),
    [...CANONISKE_OPGAVETYPER].sort(),
  )
}

// ── 2. Canonical passerer uændret ───────────────────────────────────────
console.log('\n[Canonical værdier røres ikke]')
for (const t of CANONISKE_OPGAVETYPER) {
  tjek(`${t} → ${t} (canonical)`, normaliserOpgavetype(t), { type: t, kilde: 'canonical', raa: t })
}

// ── 3. De 18 rå værdier fra produktionsdatabasen ────────────────────────
console.log('\n[De 18 ugyldige værdier i produktion 2/9]')
const FORVENTET: Record<string, { type: string; kilde: string }> = {
  // Legacy-vokabular fra 00001_initial_schema.sql
  sow: { type: 'sowing', kilde: 'alias' },
  fertilize: { type: 'fertilizing', kilde: 'alias' },
  prick_out: { type: 'repot', kilde: 'alias' },
  harden_off: { type: 'maintenance', kilde: 'alias' },
  // Redaktionel præcedens fra masterguidernes titel→type-par
  pricking_out: { type: 'repot', kilde: 'alias' },
  hardening: { type: 'maintenance', kilde: 'alias' },
  support: { type: 'maintenance', kilde: 'alias' },
  deadhead: { type: 'maintenance', kilde: 'alias' },
  pinch: { type: 'pruning', kilde: 'alias' },
  harvest_tubers: { type: 'harvest', kilde: 'alias' },
  direct_sow: { type: 'sowing', kilde: 'alias' },
  // Uden belæg → generisk. Vi gætter ikke.
  care: { type: 'custom', kilde: 'ukendt' },
  thin_out: { type: 'custom', kilde: 'ukendt' },
  winter_protection: { type: 'custom', kilde: 'ukendt' },
  seed_collection: { type: 'custom', kilde: 'ukendt' },
  collect_seeds: { type: 'custom', kilde: 'ukendt' },
  bloom: { type: 'custom', kilde: 'ukendt' },
  flower: { type: 'custom', kilde: 'ukendt' },
}
tjek('alle 18 produktionsværdier er dækket', Object.keys(FORVENTET).length, 18)
for (const [raa, forv] of Object.entries(FORVENTET)) {
  const n = normaliserOpgavetype(raa)
  tjek(`${raa} → ${forv.type} (${forv.kilde})`, { type: n.type, kilde: n.kilde }, forv)
  tjek(`  … og resultatet er canonical`, erCanoniskOpgavetype(n.type), true)
}

// ── 4. Vindue-bærende typer må ikke få alias uden belæg ─────────────────
console.log('\n[De vindue-bærende typer er de strammest bevogtede]')
// pre_sow/sowing/plant_out/harvest binder opgaven til et dokumenteret vindue
// via reminder-relevans.ts. Et forkert alias derind giver opgaven et fagligt
// belæg, den ikke har. Kun de tre nedenfor har evidens.
const VINDUE_ALIAS = Object.entries(FORVENTET)
  .filter(([, v]) => ['pre_sow', 'sowing', 'plant_out', 'harvest'].includes(v.type))
  .map(([k]) => k)
  .sort()
tjek('kun sow, direct_sow og harvest_tubers mapper ind i et vindue',
  VINDUE_ALIAS, ['direct_sow', 'harvest_tubers', 'sow'])
tjek('"care" havner ALDRIG i et vindue', normaliserOpgavetype('care').type, GENERISK_OPGAVETYPE)
tjek('"bloom" havner ALDRIG i et vindue', normaliserOpgavetype('bloom').type, GENERISK_OPGAVETYPE)

// ── 5. Stavemåde er ikke betydning ──────────────────────────────────────
console.log('\n[Stavevarianter tolereres, betydning gættes ikke]')
tjek('"plantOut" → plant_out', normaliserOpgavetype('plantOut').type, 'plant_out')
tjek('"Plant Out" → plant_out', normaliserOpgavetype('Plant Out').type, 'plant_out')
tjek('"harden-off" → maintenance', normaliserOpgavetype('harden-off').type, 'maintenance')
tjek('"  harvest  " → harvest', normaliserOpgavetype('  harvest  ').type, 'harvest')
tjek('tom streng → custom/ukendt', normaliserOpgavetype('').kilde, 'ukendt')
tjek('undefined → custom/ukendt', normaliserOpgavetype(undefined).type, GENERISK_OPGAVETYPE)
tjek('tal → custom/ukendt', normaliserOpgavetype(42).type, GENERISK_OPGAVETYPE)
tjek('helt ukendt ord → custom/ukendt', normaliserOpgavetype('zzz_findes_ikke').kilde, 'ukendt')

// ── 6. Guide-normalisering: gyldig / ugyldig / blandet ──────────────────
console.log('\n[Tre guides: gyldig, ugyldig, blandet]')
{
  // Gyldig guide — masterguiden Chili, ordret fra produktionsdatabasen.
  const gyldig = normaliserKalenderregler([
    { taskType: 'sowing', title: 'Forspir chili indendørs', recommendedMonths: [1, 2, 3], priority: 'high' },
    { taskType: 'repot', title: 'Prikl chiliplanter om', recommendedMonths: [2, 3, 4], priority: 'medium' },
    { taskType: 'plant_out', title: 'Plant chili ud', recommendedMonths: [5, 6], priority: 'high' },
  ])
  tjek('gyldig guide: ingen ændringer', gyldig.aendringer, [])
  tjek('gyldig guide: reglerne er uændrede objekter',
    gyldig.regler.map(r => (r as GuideCalendarRule).taskType), ['sowing', 'repot', 'plant_out'])

  // Ugyldig guide — Dahlia Night Silence, ordret fra produktionsdatabasen.
  const ugyldig = normaliserKalenderregler([
    { taskType: 'support', title: 'Opsæt støtte for dahlia', priority: 'medium' },
    { taskType: 'pinch', title: 'Knib dahlia for at fremme forgrening', priority: 'medium' },
    { taskType: 'fertilize', title: 'Gødsk dahlia hver 2-3 uge', priority: 'medium' },
    { taskType: 'deadhead', title: 'Fjern visne blomster fra dahlia', priority: 'low' },
    { taskType: 'harvest_tubers', title: 'Indgrav dahlia-knolde før frost', priority: 'high' },
  ])
  tjek('ugyldig guide: alle 5 regler blev normaliseret', ugyldig.aendringer.length, 5)
  tjek('ugyldig guide: ingen regel tabt', ugyldig.regler.length, 5)
  tjek('ugyldig guide: alle typer er nu canonical',
    ugyldig.regler.every(r => erCanoniskOpgavetype((r as GuideCalendarRule).taskType)), true)
  tjek('ugyldig guide: resultatet',
    ugyldig.regler.map(r => (r as GuideCalendarRule).taskType),
    ['maintenance', 'pruning', 'fertilizing', 'maintenance', 'harvest'])

  // Blandet guide — Chili Padron, ordret fra produktionsdatabasen.
  const blandet = normaliserKalenderregler([
    { taskType: 'pre_sow', title: 'Forspir Padron chili', priority: 'high' },
    { taskType: 'plant_out', title: 'Udplant chili', priority: 'high' },
    { taskType: 'care', title: 'Pasning', priority: 'low' },
  ])
  tjek('blandet guide: kun den ugyldige regel er ændret', blandet.aendringer.length, 1)
  tjek('blandet guide: ændringen er den rigtige',
    blandet.aendringer[0], { titel: 'Pasning', fra: 'care', til: 'custom', kilde: 'ukendt' })
  tjek('blandet guide: de gyldige regler overlever uændret',
    blandet.regler.map(r => (r as GuideCalendarRule).taskType),
    ['pre_sow', 'plant_out', 'custom'])

  tjek('ikke-array → tomt resultat', normaliserKalenderregler(null), { regler: [], aendringer: [] })
}

// ── 7. Hele vejen: guide → opgaver → DB-vagt ────────────────────────────
console.log('\n[Blandet guide vælter ikke længere hele batchen]')
{
  function guide(regler: unknown[]): Guide {
    return {
      id: 'g1', plantName: 'Chili', variety: 'Padron',
      calendarRules: regler as GuideCalendarRule[],
    } as unknown as Guide
  }
  // Sådan så det ud FØR: én 'care'-regel blandt gyldige regler.
  const opgaver = generateTasksFromGuide({
    guide: guide([
      { taskType: 'plant_out', title: 'Udplant chili', recommendedMonths: [5, 6], priority: 'high' },
      { taskType: 'care', title: 'Pasning', recommendedMonths: [6, 7], priority: 'low' },
      { taskType: 'harvest_tubers', title: 'Grav op', recommendedMonths: [10], priority: 'high' },
    ]),
    sowDate: '2026-03-01', plantId: 'p1', inventoryItemId: 'i1',
    // Eksplicit registreringsdag: dateringen respekterer nu dyrkningsvinduet
    // og dropper opgaver, hvis vindue er lukket (test-kalenderregel-dato.ts).
    // Uden den ville DENNE test om task_type afhænge af, hvornår den køres.
    idag: '2026-03-01',
  })
  tjek('alle tre regler blev til opgaver', opgaver.length, 3)
  tjek('typerne er normaliseret undervejs',
    opgaver.map(t => t.taskType), ['plant_out', 'custom', 'harvest'])

  const { gyldige, ugyldige } = partitionerPaaOpgavetype(opgaver)
  tjek('DB-vagten afviser ingenting efter normalisering', ugyldige.length, 0)
  tjek('alle tre opgaver når basen', gyldige.length, 3)

  // Vagten skal stadig virke, hvis noget slipper udenom normaliseringen.
  const forurenet = [...opgaver, { ...opgaver[0], taskType: 'bloom' as never }]
  const p2 = partitionerPaaOpgavetype(forurenet)
  tjek('en forurenet række isoleres', p2.ugyldige.length, 1)
  tjek('de gyldige overlever den forurenede', p2.gyldige.length, 3)
}

console.log(`\n${fejlet === 0 ? '✓' : '✗'} ${bestaaet} bestået, ${fejlet} fejlet\n`)
process.exit(fejlet === 0 ? 0 : 1)
