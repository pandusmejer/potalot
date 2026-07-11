/**
 * Node-test for forvandlings-selektoren (lib/havebog-forvandlinger.ts).
 * Kør:  npx tsx scripts/test-forvandlinger.ts
 */

import { vaelgForvandlinger, findForvandling } from '@/lib/havebog-forvandlinger'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ' + extra}`)
  cond ? ok++ : fejl++
}

// Demo-crops (kun mad-afgrøder) → stadig mix af kategorier (ikke kun spis).
{
  const v = vaelgForvandlinger({ crops: ['Jordbær', 'Agurker', 'Tomater'], maxTiles: 6 })
  const kats = new Set(v.map(f => f.category))
  console.log('     ' + v.map(f => `${f.title}[${f.category}]`).join(', '))
  tjek('Max 3 spis', v.filter(f => f.category === 'spis').length <= 3)
  tjek('Mindst én ikke-spis (bredere end opskrifter)', v.some(f => f.category !== 'spis'))
  tjek('Flere kategorier repræsenteret', kats.size >= 2)
  tjek('Max 6 tiles', v.length <= 6)
}

// Bredere have (lavendel, mynte) → duft/tør/bryg kommer med.
{
  const v = vaelgForvandlinger({ crops: ['Lavendel', 'Mynte', 'Tomat'], maxTiles: 6 })
  const kats = new Set(v.map(f => f.category))
  tjek('Lavendel → duft/tør optræder', kats.has('duft') || kats.has('toer'))
  tjek('Mynte → bryg optræder', kats.has('bryg') || kats.has('toer'))
}

// Kun matchende afgrøder vælges.
{
  const v = vaelgForvandlinger({ crops: ['Tomat'], maxTiles: 6 })
  tjek('Kun forvandlinger der bruger tomat', v.every(f => f.crops.includes('tomat')))
}

// Ingen kendte afgrøder → tom (mosaik falder til farvefelter/foto).
{
  tjek('Ukendt afgrøde → tom', vaelgForvandlinger({ crops: ['Pastinak'] }).length === 0)
}

// Detalje-opslag + sikkerhedsnote på plej.
{
  const olie = findForvandling('lavendelolie')
  tjek('Lavendelolie har sikkerhedsnote (ingen medicinske claims)', !!olie?.safetyNote)
  tjek('Gazpacho findes med trin', (findForvandling('gazpacho')?.steps.length ?? 0) >= 3)
}

console.log(`\n${ok} bestået, ${fejl} fejlet.`)
if (fejl > 0) process.exit(1)
