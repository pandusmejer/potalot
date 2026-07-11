/**
 * Node-test for kompetence-deriveren (lib/havebog-kompetencer.ts).
 * Kør:  npx tsx scripts/test-kompetencer.ts
 */
import { byggKompetencer, kompetenceAntal, type KompPlant } from '@/lib/havebog-kompetencer'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ' + extra}`)
  cond ? ok++ : fejl++
}

const plantById = new Map<string, KompPlant>([
  ['p1', { name: 'Tomat' }],
  ['p2', { name: 'Agurk' }],
])
const logs = [
  { plant_id: 'p1', type: 'pruning' },
  { plant_id: 'p1', type: 'harvest' },
  { plant_id: 'p1', type: 'note' },        // ikke en kompetence
  { plant_id: 'p1', type: 'watering' },    // ikke en kompetence
  { plant_id: 'p2', type: 'sowing' },
  { plant_id: 'p2', type: 'planting_out' },
  { plant_id: 'p2', type: 'harvest' },
  { plant_id: 'pX', type: 'harvest' },     // ukendt plante → ignoreres
]

const res = byggKompetencer(logs, plantById)
console.log('     ' + res.map(o => `${o.omraade}[${o.faerdigheder.join('·')}]`).join('  '))

const tomat = res.find(o => o.omraade === 'Tomatdyrkning')
const agurk = res.find(o => o.omraade === 'Agurkdyrkning')
tjek('Tomatdyrkning = Beskæring·Høst', JSON.stringify(tomat?.faerdigheder) === JSON.stringify(['Beskæring', 'Høst']))
tjek('Agurkdyrkning = Såning·Udplantning·Høst', JSON.stringify(agurk?.faerdigheder) === JSON.stringify(['Såning', 'Udplantning', 'Høst']))
tjek('note/watering tæller ikke som kompetence', !res.some(o => o.faerdigheder.some(f => /vand|note/i.test(f))))
tjek('Ukendt plante ignoreret (kun 2 områder)', res.length === 2)
tjek('Flest færdigheder først (Agurk før Tomat)', res[0].omraade === 'Agurkdyrkning')
tjek('kompetenceAntal = 5', kompetenceAntal(res) === 5)
tjek('Tom input → []', byggKompetencer([], plantById).length === 0)

console.log(`\n${ok} bestået, ${fejl} fejlet.`)
if (fejl > 0) process.exit(1)
