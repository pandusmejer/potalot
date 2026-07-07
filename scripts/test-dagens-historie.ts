/**
 * Node-test for Dagens historie-motoren (lib/havebog-dagens-historie.ts).
 *
 * Kør:  npx tsx scripts/test-dagens-historie.ts
 *
 * Ikke en del af appen — et inspektions-script så vi kan SE at
 * prioriteringen opfører sig som Annas spec: en frisk personlig milepæl
 * slår generel guideviden, første høst er stærkest, og recency vægter
 * (en gammel høst taber til en fersk bemærkelsesværdig spiring).
 */

import {
  byggDagensHistorie,
  type HistorieLog,
  type HistoriePlant,
} from '@/lib/havebog-dagens-historie'
import type { NaturFakta, OnThisDayEntry } from '@/data/havebog-demo'

const TODAY = new Date('2026-07-07T09:00:00')
const YEAR = 2026

const VEJR: NaturFakta = { value: '18°', statement: 'Tomaterne modner i drivhuset.' }

const PLANTER: Record<string, HistoriePlant> = {
  jordbaer: { name: 'Jordbær', variety: 'Malwina' },
  chili: { name: 'Chili', variety: 'Habanero' },
  tomat: { name: 'Tomat', variety: 'San Marzano' },
}
const plant = (id: string) => PLANTER[id]

function base(overrides: Partial<Parameters<typeof byggDagensHistorie>[0]> = {}) {
  return {
    logs: [] as HistorieLog[],
    plant,
    currentYear: YEAR,
    today: TODAY,
    opdagelse: null as string | null,
    onThisDay: [] as OnThisDayEntry[],
    ligeNuFakta: VEJR,
    inspirationer: [] as string[],
    klarTilUdplantning: 0,
    erNy: false,
    maaned1: 7,
    dagNr: 188,
    ...overrides,
  }
}

let bestaaet = 0
let fejlet = 0
function tjek(navn: string, faktisk: string, forventetSub: string) {
  const ok = faktisk.includes(forventetSub)
  console.log(`${ok ? '✅' : '❌'} ${navn}`)
  console.log(`     lead: "${faktisk}"`)
  if (!ok) console.log(`     forventede at indeholde: "${forventetSub}"`)
  ok ? bestaaet++ : fejlet++
}

// 1 · Fersk første høst slår en fersk spiretids-opdagelse.
{
  const r = byggDagensHistorie(base({
    logs: [
      { plant_id: 'jordbaer', date: '2026-07-07', type: 'harvest' },
      { plant_id: 'chili', date: '2026-07-06', type: 'germination' },
      { plant_id: 'chili', date: '2026-06-27', type: 'sowing' },
    ],
    opdagelse: 'Chilierne spirede på 9 dage — hurtigere end guiden regner med.',
  }))
  tjek('Fersk første høst > fersk spiring-opdagelse', r.lead.tekst, 'De første jordbær kom i dag.')
}

// 2 · GAMMEL høst (40 dage) taber til fersk bemærkelsesværdig spiring.
{
  const r = byggDagensHistorie(base({
    logs: [
      { plant_id: 'chili', date: '2026-07-06', type: 'germination' },
      { plant_id: 'chili', date: '2026-06-27', type: 'sowing' },
      { plant_id: 'jordbaer', date: '2026-05-28', type: 'harvest' },
    ],
    opdagelse: 'Chilierne spirede på 9 dage — hurtigere end guiden regner med.',
  }))
  tjek('Gammel høst < fersk spiring-opdagelse', r.lead.tekst, 'spirede på 9 dage')
}

// 3 · Fersk udplantning slår "klar til udplantning"-status.
{
  const r = byggDagensHistorie(base({
    logs: [{ plant_id: 'tomat', date: '2026-07-06', type: 'planting_out' }],
    klarTilUdplantning: 3,
  }))
  tjek('Fersk udplantning > status', r.lead.tekst, 'flyttede ud i går')
}

// 4 · Ny bruger uden logs → lånt erfaring som lead (personlig-ish > vejr).
{
  const r = byggDagensHistorie(base({ erNy: true }))
  tjek('Ny bruger → lånt erfaring (ikke vejr)', r.lead.tekst, '')
  const brugerVejr = r.lead.tekst === VEJR.statement
  console.log(`     (lead er ${brugerVejr ? 'DESVÆRRE vejr' : 'ikke vejr — ok'})`)
}

// 5 · Intet personligt → falder tilbage på vejr/sæson (ikke tomt).
{
  const r = byggDagensHistorie(base())
  tjek('Ingen hændelser → rolig fallback', r.lead.tekst, VEJR.statement)
  console.log(`     beats: ${r.beats.map(b => b.kicker).join(' · ')}`)
}

// 6 · Personlig hændelse slår generel viden (høst + masser af generelt).
{
  const r = byggDagensHistorie(base({
    logs: [{ plant_id: 'tomat', date: '2026-07-05', type: 'harvest' }],
    inspirationer: ['Du dyrker San Marzano. Mange kombinerer den med basilikum.'],
    onThisDay: [{ yearsAgo: 1, plantName: 'Dahlia', variety: 'Café au Lait', text: 'første knop', imageUrl: null }],
  }))
  tjek('Personlig milepæl > generel viden', r.lead.tekst, 'De første tomater')
  console.log(`     beats: ${r.beats.map(b => `${b.kicker}: ${b.tekst}`).join('\n            ')}`)
}

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet.`)
if (fejlet > 0) process.exit(1)
