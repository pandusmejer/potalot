/**
 * Node-test for forvandlings-asset-selektoren (lib/forvandling-assets.ts).
 * Udøver hele fallback-kæden ved midlertidigt at pushe/poppe registret.
 * Kør:  npx tsx scripts/test-forvandling-assets.ts
 */

import { selectForvandlingAssets, FORVANDLING_KATEGORI_ASSETS } from '@/lib/forvandling-assets'
import { findForvandling, KATEGORI_FARVE } from '@/lib/havebog-forvandlinger'
import { FORVANDLING_ASSETS } from '@/lib/forvandling-registry'

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ' + extra}`)
  cond ? ok++ : fejl++
}

const gazpacho = findForvandling('gazpacho')!  // crops: tomat, agurk, basilikum · spis
const mynteTe = findForvandling('mynte-te')!   // crops: mynte · bryg

// 4. Ingen forvandlings-fotos i registret → farve-tile (kategori-farve).
{
  const v = selectForvandlingAssets(gazpacho)
  tjek('Uden fotos → farve-tile', v.slag === 'farve')
  tjek('Farve = kategori-farve (spis)', v.slag === 'farve' && v.farve === KATEGORI_FARVE.spis)
  const v2 = selectForvandlingAssets(mynteTe)
  tjek('Mynte-te → bryg-farve', v2.slag === 'farve' && v2.farve === KATEGORI_FARVE.bryg)
}

// 2. Afgrøde-asset tagget 'forvandling' → foto (kilde: afgroede).
{
  FORVANDLING_ASSETS.push({ crop: 'tomat', cropLabel: 'Tomater', path: '/test/tomat-forv.jpg', role: 'fruit', seasons: ['summer'], useCases: ['forvandling'], priority: 50 })
  const v = selectForvandlingAssets(gazpacho, { season: 'summer' })
  tjek('Afgrøde-foto → foto', v.slag === 'foto')
  tjek('Kilde = afgroede', v.slag === 'foto' && v.kilde === 'afgroede')
  tjek('Path = det taggede foto', v.slag === 'foto' && v.path === '/test/tomat-forv.jpg')
  // Generisk makro (uden 'forvandling') må IKKE vælges — mynte har ingen.
  tjek('Mynte-te stadig farve (ingen forvandlings-foto)', selectForvandlingAssets(mynteTe).slag === 'farve')
  FORVANDLING_ASSETS.pop()
}

// 1. Sortspecifikt vinder over afgrøde.
{
  FORVANDLING_ASSETS.push({ crop: 'tomat', cropLabel: 'Tomater', path: '/test/tomat-afgrode.jpg', role: 'fruit', useCases: ['forvandling'], priority: 50 })
  FORVANDLING_ASSETS.push({ crop: 'san-marzano', cropLabel: 'San Marzano', path: '/test/sort.jpg', role: 'fruit', useCases: ['forvandling'], priority: 40 })
  const v = selectForvandlingAssets(gazpacho, { variety: 'San Marzano' })
  tjek('Sort vinder over afgrøde', v.slag === 'foto' && v.kilde === 'sort' && v.path === '/test/sort.jpg')
  FORVANDLING_ASSETS.pop(); FORVANDLING_ASSETS.pop()
}

// 3. Kategori/mood-asset når intet afgrøde-foto findes.
{
  FORVANDLING_KATEGORI_ASSETS.push({ kategori: 'bryg', path: '/test/bryg-mood.jpg' })
  const v = selectForvandlingAssets(mynteTe)
  tjek('Kategori-mood → foto (kilde kategori)', v.slag === 'foto' && v.kilde === 'kategori')
  // Afgrøde-foto skal stadig vinde over kategori.
  FORVANDLING_ASSETS.push({ crop: 'mynte', cropLabel: 'Mynte', path: '/test/mynte.jpg', role: 'plant', useCases: ['forvandling'], priority: 30 })
  tjek('Afgrøde vinder over kategori', selectForvandlingAssets(mynteTe).slag === 'foto' && (selectForvandlingAssets(mynteTe) as { kilde: string }).kilde === 'afgroede')
  FORVANDLING_ASSETS.pop()
  FORVANDLING_KATEGORI_ASSETS.pop()
}

// Fallback intakt efter alle pushes/pops.
tjek('Registret ryddet igen → farve', selectForvandlingAssets(gazpacho).slag === 'farve')

console.log(`\n${ok} bestået, ${fejl} fejlet.`)
if (fejl > 0) process.exit(1)
