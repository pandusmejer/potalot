/**
 * Node-test for dyrkerstatus-deriveren (lib/havebog-dyrkerstatus.ts).
 * Kør:  npx tsx scripts/test-dyrkerstatus.ts
 */
import { byggDyrkerstatus, type StatusPlant } from '@/lib/havebog-dyrkerstatus'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ' + extra}`)
  cond ? ok++ : fejl++
}
const titler = (r: { titel: string }[]) => r.map(s => s.titel)
const seasonStart = '2026-03-01'

// Selvforsyner: høst fra 3 distinkte arter i sæson.
{
  const plantById = new Map<string, StatusPlant>([['t', { name: 'Tomat' }], ['a', { name: 'Agurk' }], ['j', { name: 'Jordbær' }]])
  const logs = [
    { plant_id: 't', type: 'harvest', date: '2026-07-01' },
    { plant_id: 'a', type: 'harvest', date: '2026-07-02' },
    { plant_id: 'j', type: 'harvest', date: '2026-06-01' },
    { plant_id: 't', type: 'harvest', date: '2026-02-01' }, // før sæson → tæller ikke som 4.
  ]
  const r = byggDyrkerstatus({ logs, plantById, seasonStart, plants: [], inventory: [] })
  tjek('Selvforsyner ved 3 arter', titler(r).includes('Selvforsyner'))
  tjek('Selvforsyner står først (primær)', r[0]?.titel === 'Selvforsyner')
}

// Høst før sæsonstart tæller ikke → ingen Selvforsyner.
{
  const plantById = new Map<string, StatusPlant>([['t', { name: 'Tomat' }], ['a', { name: 'Agurk' }], ['j', { name: 'Jordbær' }]])
  const logs = [
    { plant_id: 't', type: 'harvest', date: '2026-01-01' },
    { plant_id: 'a', type: 'harvest', date: '2026-01-02' },
    { plant_id: 'j', type: 'harvest', date: '2026-01-03' },
  ]
  const r = byggDyrkerstatus({ logs, plantById, seasonStart, plants: [], inventory: [] })
  tjek('Høst før sæson → ingen Selvforsyner', !titler(r).includes('Selvforsyner'))
}

// Frøsamler (>=6 sorter), Blomsterdyrker, Krydderurteholder via frøbank.
{
  const inventory = [
    { name: 'Tomat', variety: 'San Marzano', subcategory_id: null },
    { name: 'Agurk', variety: 'Marketmore', subcategory_id: null },
    { name: 'Basilikum', variety: null, subcategory_id: 'krydderurter' },
    { name: 'Morgenfrue', variety: null, subcategory_id: 'blomster_1aarige' },
    { name: 'Dahlia', variety: 'Café au Lait', subcategory_id: 'blomster_fleraarige' },
    { name: 'Chili', variety: 'Habanero', subcategory_id: null },
  ]
  const r = byggDyrkerstatus({ logs: [], plantById: new Map(), seasonStart, plants: [], inventory })
  tjek('Frøsamler ved 6 sorter', titler(r).includes('Frøsamler'))
  tjek('Blomsterdyrker via subcategory', titler(r).includes('Blomsterdyrker'))
  tjek('Krydderurteholder via subcategory', titler(r).includes('Krydderurteholder'))
}

// Drivhusdyrker via plante-location.
{
  const plants: StatusPlant[] = [{ name: 'Tomat', location: 'Drivhus, sydvæg' }, { name: 'Agurk', location: 'Højbed' }]
  const r = byggDyrkerstatus({ logs: [], plantById: new Map(), seasonStart, plants, inventory: [] })
  tjek('Drivhusdyrker via location', titler(r).includes('Drivhusdyrker'))
}

// Tom → tom liste (sektion skjules).
tjek('Ingen data → tom liste', byggDyrkerstatus({ logs: [], plantById: new Map(), seasonStart, plants: [], inventory: [] }).length === 0)

console.log(`\n${ok} bestået, ${fejl} fejlet.`)
if (fejl > 0) process.exit(1)
