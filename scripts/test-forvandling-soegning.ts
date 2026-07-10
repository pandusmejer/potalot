/**
 * Node-test for forvandlings-søge-helperen (lib/forvandling-soegning.ts).
 * Kør:  npx tsx scripts/test-forvandling-soegning.ts
 */

import {
  byggForvandlingSoegninger,
  handlingsOrd,
  naesteHandling,
  googleSoegUrl,
} from '@/lib/forvandling-soegning'
import { findForvandling } from '@/lib/havebog-forvandlinger'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ' + extra}`)
  cond ? ok++ : fejl++
}

const gazpacho = findForvandling('gazpacho')!        // spis · tomat/agurk/basilikum
const toerBasilikum = findForvandling('toer-basilikum')! // toer · basilikum
const lavendelolie = findForvandling('lavendelolie')!    // plej · lavendel

// Opskrift vs vejledning pr. kategori.
tjek('spis → opskrift', handlingsOrd('spis') === 'opskrift')
tjek('toer → vejledning', handlingsOrd('toer') === 'vejledning')
tjek('plej → vejledning', handlingsOrd('plej') === 'vejledning')

// Næste handling-linje findes for alle kategorier.
tjek('naesteHandling(spis) ikke tom', naesteHandling('spis').length > 0)
tjek('naesteHandling(plej) er kosmetisk-orienteret', /kosmetisk/i.test(naesteHandling('plej')))

// Søgefraser: bruger titel + afgrøde + handlingsord.
{
  const s = byggForvandlingSoegninger(gazpacho)
  console.log('     ' + s.join(' | '))
  tjek('Maks 4 fraser', s.length <= 4)
  tjek('Indeholder titel + afgrøde', s.some(x => x.includes('Gazpacho') && x.includes('tomat')))
  tjek('Indeholder "opskrift"', s.some(x => x.includes('opskrift')))
  tjek('Ingen dubletter', new Set(s).size === s.length)
}

// Tør basilikum → "vejledning".
{
  const s = byggForvandlingSoegninger(toerBasilikum)
  tjek('Tør basilikum → vejledning-frase', s.some(x => x.includes('vejledning')))
}

// Plej → styret mod kosmetisk brug (ingen medicinske claims).
{
  const s = byggForvandlingSoegninger(lavendelolie)
  console.log('     ' + s.join(' | '))
  tjek('Plej → "kosmetisk brug"-frase', s.some(x => /kosmetisk brug/.test(x)))
}

// Sort injiceres når kendt.
{
  const s = byggForvandlingSoegninger(gazpacho, { variety: 'San Marzano' })
  tjek('Sort med i fraser', s.some(x => x.includes('San Marzano')))
}

// URL-encoding.
tjek('googleSoegUrl encoder mellemrum/æøå', googleSoegUrl('jordbær sorbet') === 'https://www.google.com/search?q=jordb%C3%A6r%20sorbet')

console.log(`\n${ok} bestået, ${fejl} fejlet.`)
if (fejl > 0) process.exit(1)
