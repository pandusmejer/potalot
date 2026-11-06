/**
 * Frøbankens kompakte liste (MVP 1.0, fase 1) — reglerne bag sortering,
 * beholdning, udløb og artsfilter. Kør: npx tsx scripts/test-froebank-liste.ts
 */
import {
  artsValg, maengdeForSort, maengdeTekst, sammenlignArtOgSort, sammenlignMaengde,
  sammenlignSortsnavn, udloebForSort, udloebMaerkat, udloebTekst,
} from '../src/lib/froebank-liste'
import { grupperEfterSort } from '../src/lib/froebank-grupper'
import type { InventoryItem } from '../src/lib/types'

let bestaaet = 0
let fejlet = 0
function tjek(navn: string, ok: boolean) {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.log(`  ✗ ${navn}`) }
}

let n = 0
function pose(o: Partial<InventoryItem> & { name: string }): InventoryItem {
  n++
  return {
    id: `p${n}`, userId: 'u', primaryCategoryId: 'fro', sowingMonths: [], sowingDepthMm: null,
    plantingOutMonths: [], harvestMonths: [], growingLocations: [], status: 'i_froebank',
    isFavorite: false, isPinned: false, imageIds: [], linkedPlantIds: [],
    createdAt: `2026-01-${String(n).padStart(2, '0')}`, updatedAt: '2026-01-01',
    ...o,
  }
}
const idag = new Date(2026, 10, 6) // 6. november 2026

console.log('\n1. Beholdning: ukendt er ikke nul')
{
  const [g] = grupperEfterSort([pose({ name: 'Tomat', variety: 'Sungold', seedCount: 10, seedsRemaining: 4 }), pose({ name: 'Tomat', variety: 'Sungold', seedCount: 20 })])
  tjek('to poser af samme sort lægges sammen (4 + 20 = 24 frø)', maengdeTekst(maengdeForSort(g)) === '24 frø')
  const [u] = grupperEfterSort([pose({ name: 'Salat' })])
  tjek("pose uden antal vises som 'Antal ukendt'", maengdeTekst(maengdeForSort(u)) === 'Antal ukendt')
  const [t] = grupperEfterSort([pose({ name: 'Agurk', seedCount: 5, seedsRemaining: 0 })])
  tjek("tom pose vises som '0 frø' — ikke ukendt", maengdeTekst(maengdeForSort(t)) === '0 frø')
  const [l] = grupperEfterSort([pose({ name: 'Hvidløg', primaryCategoryId: 'loeg', quantity: 12 })])
  tjek("løg uden frøantal bruger quantity ('12 stk')", maengdeTekst(maengdeForSort(l)) === '12 stk')
}

console.log('\n2. Beholdningssortering: færrest først, ukendt sidst')
{
  const sorteret = [null, 7, 0, null, 3].sort(sammenlignMaengde)
  tjek('0, 3, 7, ukendt, ukendt', JSON.stringify(sorteret) === JSON.stringify([0, 3, 7, null, null]))
  tjek('ukendt mod ukendt er uafgjort', sammenlignMaengde(null, null) === 0)
}

console.log('\n3. Alfabetisk på SORTSNAVN')
{
  const poser = [
    pose({ name: 'Tomat', variety: 'Sungold' }),
    pose({ name: 'Agurk', variety: 'Åkirke' }),
    pose({ name: 'Chili', variety: 'Ærø' }),
    pose({ name: 'Tomat', variety: 'Black Cherry' }),
    pose({ name: 'Dild' }),
  ]
  const az = [...poser].sort(sammenlignSortsnavn).map((p) => p.variety ?? p.name)
  tjek('A–Å følger dansk alfabet (Æ, Ø, Å til sidst)', JSON.stringify(az) === JSON.stringify(['Black Cherry', 'Dild', 'Sungold', 'Ærø', 'Åkirke']))
  const za = [...poser].sort((a, b) => sammenlignSortsnavn(b, a)).map((p) => p.variety ?? p.name)
  tjek('Å–A er den omvendte rækkefølge', JSON.stringify(za) === JSON.stringify([...az].reverse()))
  const std = [...poser].sort(sammenlignArtOgSort).map((p) => `${p.name} ${p.variety ?? ''}`.trim())
  tjek('standard: art A–Å, derefter sort', JSON.stringify(std) === JSON.stringify(['Agurk Åkirke', 'Chili Ærø', 'Dild', 'Tomat Black Cherry', 'Tomat Sungold']))
}

console.log('\n4. Udløb: UDLØBET er rådgivende og afledt')
{
  const alle = udloebForSort([{ expiryDate: '2024-12-31' }], idag)
  tjek("passeret dato → 'UDLØBET'", udloebMaerkat(alle) === 'UDLØBET')
  tjek("årstal vises: 'Bedst før 2024'", udloebTekst(alle) === 'Bedst før 2024')
  const nogle = udloebForSort([{ expiryDate: '2024-12-31' }, { expiryDate: '2028-12-31' }], idag)
  tjek("én af to poser passeret → '1 pose udløbet', ikke UDLØBET", udloebMaerkat(nogle) === '1 pose udløbet')
  tjek("flere årstal vises som interval", udloebTekst(nogle) === 'Bedst før 2024–2028')
  const blandet = udloebForSort([{ expiryDate: '2024-12-31' }, { expiryDate: null }], idag)
  tjek('en pose uden dato holder sorten ude af UDLØBET', udloebMaerkat(blandet) === '1 pose udløbet')
  const ingen = udloebForSort([{ expiryDate: null }], idag)
  tjek('ingen dato → ingen mærkat og intet årstal', udloebMaerkat(ingen) === null && udloebTekst(ingen) === null)
  const idagDato = udloebForSort([{ expiryDate: '2026-11-06' }], idag)
  tjek('en pose der udløber i dag er ikke udløbet endnu', udloebMaerkat(idagDato) === null)
}

console.log('\n5. Artsfilter bruger artsmodellen')
{
  const valg = artsValg([
    pose({ name: 'Tomat', variety: 'Sungold' }),
    pose({ name: 'Tomat', variety: 'Sungold' }),
    pose({ name: 'tomat', variety: 'Black Cherry' }),
    pose({ name: 'Skoleagurk', variety: 'Snack' }),
    pose({ name: 'Agurk', variety: 'Beit Alpha' }),
    pose({ name: 'Frøpose uden navn' }),
  ])
  const tomat = valg.find((v) => v.label === 'Tomat')
  tjek('to poser af samme sort tæller som ÉN sort (Tomat: 2 sorter)', tomat?.antalSorter === 2)
  tjek("'tomat' og 'Tomat' er samme art", valg.filter((v) => v.label.toLowerCase() === 'tomat').length === 1)
  const agurk = valg.find((v) => v.label === 'Agurk')
  tjek('Skoleagurk hører under Agurk (artsalias)', agurk?.antalSorter === 2 && !valg.some((v) => v.label === 'Skoleagurk'))
  tjek("foto-kladden 'Frøpose uden navn' er ikke en art", !valg.some((v) => v.label.startsWith('Frøpose')))
  tjek('arterne står A–Å', JSON.stringify(valg.map((v) => v.label)) === JSON.stringify(['Agurk', 'Tomat']))
}

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
