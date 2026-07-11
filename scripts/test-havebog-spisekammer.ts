/**
 * Node-test for Spisekammer-motoren (lib/havebog-spisekammer.ts).
 * Kør:  npx tsx scripts/test-havebog-spisekammer.ts
 *
 * Beviser: gruppér pr. afgrøde, sortér mest høstet + nyligst, max 3, null
 * uden høst.
 */

import { byggSpisekammer, type HoestEntry } from '@/lib/havebog-spisekammer'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ' + extra}`)
  cond ? ok++ : fejl++
}

const H: HoestEntry[] = [
  { art: 'Tomat', date: '2026-07-01' },
  { art: 'Tomat', date: '2026-07-05' },
  { art: 'Tomat', date: '2026-07-08' },
  { art: 'Jordbær', date: '2026-06-20' },
  { art: 'Jordbær', date: '2026-06-25' },
  { art: 'Agurk', date: '2026-07-07' },
  { art: 'Chili', date: '2026-07-02' },
]

const r = byggSpisekammer(H)!
console.log('     ' + JSON.stringify(r))
tjek('Grupperet + sorteret: Tomat øverst (3)', r.hoest[0].navn === 'Tomat' && r.hoest[0].antal === '3')
tjek('Nr. 2 Jordbær (2)', r.hoest[1].navn === 'Jordbær' && r.hoest[1].antal === '2')
tjek('Max 3 afgrøder', r.hoest.length === 3)
tjek('Chili (1, kun 1 høst) falder ud af top 3', !r.hoest.some(h => h.navn === 'Chili'))
tjek('Opskrifter fra top-afgrøder (fx Tomatsalat)', r.opskrifter.includes('Tomatsalat'))

// Tie-break: samme antal → nyligst først.
const T: HoestEntry[] = [
  { art: 'Agurk', date: '2026-07-09' },
  { art: 'Tomat', date: '2026-07-01' },
]
const rt = byggSpisekammer(T)!
tjek('Tie-break på antal → nyligst (Agurk før Tomat)', rt.hoest[0].navn === 'Agurk')

// Ingen høst → null (skjul).
tjek('Ingen høst → null', byggSpisekammer([]) === null)

console.log(`\n${ok} bestået, ${fejl} fejlet.`)
if (fejl > 0) process.exit(1)
