/**
 * Node-test for sæson-motoren (lib/havebog-saeson.ts).
 *
 * Kør:  npx tsx scripts/test-havebog-saeson.ts
 *
 * Beviser Annas regel: en sæson løber fra årets første såning til næste
 * års første såning; tælleren nulstilles ALDRIG ved nytår, kun ved en
 * såning i et senere år.
 */

import { beregnSaeson, saesonEtiket } from '@/lib/havebog-saeson'

function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00').getTime()
  const b = new Date(to + 'T00:00:00').getTime()
  return Math.round((b - a) / 86400000)
}
function dag(start: string | null, today: string): number | null {
  return start ? daysBetween(start, today) + 1 : null
}

let ok = 0, fejl = 0
function tjek(navn: string, faktisk: unknown, forventet: unknown) {
  const pass = JSON.stringify(faktisk) === JSON.stringify(forventet)
  console.log(`${pass ? '✅' : '❌'} ${navn}${pass ? '' : `  (fik ${JSON.stringify(faktisk)}, ville have ${JSON.stringify(forventet)})`}`)
  pass ? ok++ : fejl++
}

// Annas eksempel-forløb -------------------------------------------------
const saaninger2026 = ['2026-03-01', '2026-03-20', '2026-04-15', '2026-06-01', '2026-08-10']
const s1 = beregnSaeson(saaninger2026)
tjek('Sæson 1 start = første såning', s1.start, '2026-03-01')
tjek('Sæson 1 nummer = 1', s1.nummer, 1)
tjek('Efteråret er stadig sæson 1 (ingen ny sæson af succession)', s1.nummer, 1)
tjek('DAG på 1. jan 2027 tæller videre (~307)', dag(s1.start, '2027-01-01'), 307)
tjek('DAG på 1. mar 2027 før ny såning (~366)', dag(s1.start, '2027-03-01'), 366)

// Ny såning i 2027 → sæson 2
const medNy = [...saaninger2026, '2027-03-01']
const s2 = beregnSaeson(medNy)
tjek('Ny såning 2027 → sæson 2', s2.nummer, 2)
tjek('Sæson 2 start = 2027-03-01', s2.start, '2027-03-01')
tjek('Forrige sæson start bevaret', s2.forrigeStart, '2026-03-01')
tjek('DAG 001 på selve dagen for ny såning', dag(s2.start, '2027-03-01'), 1)

// Springer et helt år over (ingen såning i 2027) → næste sæson tæller +1, ikke +2
const spring = ['2026-03-01', '2028-03-01']
const s3 = beregnSaeson(spring)
tjek('Sprunget år er ikke en sæson → nummer 2 (ikke 3)', s3.nummer, 2)

// Tomt / ingen såning
const tom = beregnSaeson([])
tjek('Ingen såning → start null, nummer 0', { start: tom.start, nummer: tom.nummer }, { start: null, nummer: 0 })

// Etiketter
tjek('Etiket sæson 1', saesonEtiket(1), 'af din første sæson')
tjek('Etiket sæson 3', saesonEtiket(3), 'af din tredje sæson')
tjek('Etiket sæson 10', saesonEtiket(10), 'af din tiende sæson')
tjek('Etiket sæson 0 = null', saesonEtiket(0), null)

console.log(`\n${ok} bestået, ${fejl} fejlet.`)
if (fejl > 0) process.exit(1)
