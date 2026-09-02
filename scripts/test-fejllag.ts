/**
 * Fejllaget — permanent vagt om reglen fra Anna 12/8, udvidet 2/9:
 * brugeren må ALDRIG se en rå fejl fra Supabase/Postgres/HTTP.
 *
 * To ting testes:
 *   1. at dataFejlBesked oversætter det kendte og aldrig lader den tekniske
 *      streng slippe igennem som brugertekst
 *   2. at mønsteret ikke sniger sig ind igen — en statisk scanning af
 *      src/actions og src/app/api efter `error.message` på vej ud i et svar
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { dataFejlBesked, fangetFejlBesked } from '@/lib/data-fejl'

let bestaaet = 0
let fejlet = 0

function tjek(navn: string, faktisk: unknown, forventet: unknown) {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet)
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}\n      forventet: ${JSON.stringify(forventet)}\n      faktisk:   ${JSON.stringify(faktisk)}`) }
}

const FALLBACK = 'Kunne ikke gemme. Prøv igen.'

console.log('\n[Kendte Postgres-koder]')
for (const [kode, forventet] of [
  ['23505', 'Det findes allerede.'],
  ['42501', 'Du har ikke adgang til det her.'],
  ['PGRST116', 'Vi kunne ikke finde det, du prøvede at ændre. Måske er det allerede slettet.'],
] as const) {
  tjek(`${kode}`, dataFejlBesked({ message: 'duplicate key value violates unique constraint "x"', code: kode }, FALLBACK), forventet)
}

console.log('\n[Kendte beskeder uden kode]')
tjek('RLS', dataFejlBesked({ message: 'new row violates row-level security policy for table "groups"' }, FALLBACK), 'Du har ikke adgang til det her.')
tjek('for stor fil', dataFejlBesked({ message: 'Payload too large' }, FALLBACK), 'Filen er for stor.')
tjek('netværk', dataFejlBesked({ message: 'fetch failed' }, FALLBACK), 'Forbindelsen svigtede. Tjek nettet, og prøv igen.')

console.log('\n[Ukendt fejl] — kaldestedets kontekst, aldrig den tekniske streng')
{
  const teknisk = 'PGRST202: function public.gør_noget(p_x) does not exist'
  const svar = dataFejlBesked({ message: teknisk, code: 'PGRST202' }, FALLBACK)
  tjek('svaret er fallbacken', svar, FALLBACK)
  tjek('svaret indeholder ikke den tekniske tekst', svar.includes('PGRST202'), false)
}
tjek('null-fejl giver fallback', dataFejlBesked(null, FALLBACK), FALLBACK)
tjek('fanget Error', fangetFejlBesked(new Error('ENOTFOUND db.supabase.co'), FALLBACK), FALLBACK)
tjek('fanget ikke-Error', fangetFejlBesked({ noget: 'andet' }, FALLBACK), FALLBACK)

console.log('\n[Ingen danske beskeder ender som tom streng]')
{
  const tomme: string[] = []
  for (const f of [
    { message: '', code: '23505' }, { message: 'x', code: '23503' },
    { message: 'x', code: '23514' }, { message: 'x', code: '22001' },
    { message: 'x', code: 'PGRST301' },
  ]) {
    const s = dataFejlBesked(f, FALLBACK)
    if (!s.trim()) tomme.push(f.code)
  }
  tjek('alle koder giver tekst', tomme, [])
}

console.log('\n[Statisk vagt] — mønsteret må ikke komme tilbage')
{
  function filer(dir: string): string[] {
    const ud: string[] = []
    for (const navn of readdirSync(dir)) {
      const p = join(dir, navn)
      if (statSync(p).isDirectory()) ud.push(...filer(p))
      else if (p.endsWith('.ts') || p.endsWith('.tsx')) ud.push(p)
    }
    return ud
  }

  // `error.message` i en besked der returneres til klienten.
  const LAEK = [
    /error:\s*\w*[eE]rr(or)?\??\.message/,          // { error: error.message }
    /error:\s*`[^`]*\$\{[^}]*\.message[^}]*\}/,      // { error: `... ${e.message}` }
  ]
  const fund: string[] = []
  for (const p of [...filer('src/actions'), ...filer('src/app/api')]) {
    const linjer = readFileSync(p, 'utf8').split('\n')
    linjer.forEach((l, i) => {
      if (l.includes('dataFejlBesked') || l.includes('fangetFejlBesked')) return
      // `?? null` er ikke brugertekst — det er en intern helper der giver
      // fejlen videre til en kalder, som selv formulerer den danske besked.
      if (l.includes('?? null')) return
      if (LAEK.some(r => r.test(l))) fund.push(`${p}:${i + 1}  ${l.trim()}`)
    })
  }
  tjek('ingen rå error.message på vej ud i et svar', fund, [])
}

console.log(`\n${fejlet === 0 ? '✅' : '❌'}  i alt: ${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
