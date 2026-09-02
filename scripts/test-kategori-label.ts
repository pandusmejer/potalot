/**
 * Gøremåls-kategori-formatteren — permanent vagt om den ANNA-LÅSTE
 * tre-lags regel (Docs/content/potalot-terminologi.md, 2/9 2026).
 *
 * Testdataene er de 56 FAKTISKE værdier i `general_garden_tasks.category`
 * aflæst mod produktion 2/9 2026 (265 rækker). Pointen med de tal:
 * kun 6 rækker har ASCII-problemet, men 118 rækker har en kategori der er
 * et sted, en plantetype eller en anledning. En streng "ukendt → Andet"
 * ville rette 6 og ødelægge 118. Det er dét, testen vogter.
 */

import {
  formatKategori, kategoriLabel, CATEGORY_LABELS,
  kategorierTilOprydning, nulstilKategoriRegister,
} from '@/lib/kalender/kategori-label'

let bestaaet = 0
let fejlet = 0

function tjek(navn: string, faktisk: unknown, forventet: unknown) {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet)
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}\n      forventet: ${JSON.stringify(forventet)}\n      faktisk:   ${JSON.stringify(faktisk)}`) }
}

/** De 56 værdier i produktion 2/9 2026, med antal rækker. */
const PROD: Array<[string, number]> = [
  ['drivhus', 19], ['høst', 15], ['såning', 14], ['blomster', 13],
  ['græsplæne', 13], ['planlægning', 13], ['biodiversitet', 12],
  ['jordforbedring', 12], ['beskæring', 11], ['dyreliv', 10],
  ['forspiring', 9], ['stauder', 9], ['vinterdyrkning', 9],
  ['køkkenhave', 8], ['løgplanter', 7], ['ukrudt', 6], ['frø', 5],
  ['frugt og bær', 5], ['halloween', 5], ['plantning', 5],
  ['vedligeholdelse', 5], ['udplantning', 4], ['vinterbeskyttelse', 4],
  ['Beskæring', 3], ['juledekorationer', 3], ['klargøring', 3],
  ['krukker', 3], ['vanding', 3], ['Vedligeholdelse', 3], ['Dyreliv', 2],
  ['formering', 2], ['Forspiring', 2], ['jorddække', 2], ['Klargøring', 2],
  ['Opbevaring', 2], ['oprydning', 2], ['Drivhus', 1], ['froesamling', 1],
  ['frugttræer', 1], ['gødning', 1], ['hoest', 1], ['indendørs have', 1],
  ['klargoering', 1], ['kompost', 1], ['Kompost', 1], ['krydderurter', 1],
  ['planlaegning', 1], ['Planlægning', 1], ['roser', 1], ['saaning', 1],
  ['stueplanter', 1], ['Ukrudt', 1], ['vedligehold', 1],
  ['Vinterbeskyttelse', 1], ['vintergrønt', 1], ['vinterklargoering', 1],
]

console.log('\n[Lag 1] — canonical nøgler bruger CATEGORY_LABELS')
for (const [n, l] of Object.entries(CATEGORY_LABELS)) {
  const v = formatKategori(n)
  tjek(`"${n}" → "${l}" (lag 1)`, [v.label, v.lag], [l, 1])
}

console.log('\n[Lag 1] — dokumenteret alias er samme ORD, anden stavemåde')
for (const [n, l] of [['såning', 'Såning'], ['høst', 'Høst'], ['planlægning', 'Plan']] as const) {
  const v = formatKategori(n)
  tjek(`"${n}" → "${l}" (lag 1)`, [v.label, v.lag], [l, 1])
}
tjek('versal-variant rammer samme alias', formatKategori('Planlægning').label, 'Plan')

console.log('\n[Lag 2] — ASCII får bogstaverne tilbage, ikke en ny betydning')
for (const [n, l] of [
  ['klargoering', 'Klargøring'],
  ['vinterklargoering', 'Vinterklargøring'],
  ['froesamling', 'Frøsamling'],
] as const) {
  const v = formatKategori(n)
  tjek(`"${n}" → "${l}" (lag 2)`, [v.label, v.lag], [l, 2])
}
tjek('"vinterklargoering" gættes IKKE ind i en canonical kategori',
  Object.values(CATEGORY_LABELS).includes(formatKategori('vinterklargoering').label), false)
tjek('"beskæring" bliver IKKE til Pleje', formatKategori('beskæring').label, 'Beskæring')
tjek('"beskæring" er lag 2, ikke lag 1', formatKategori('beskæring').lag, 2)

console.log('\n[Lag 2] — sted/plantetype/anledning overlever')
for (const [n, l] of [
  ['drivhus', 'Drivhus'], ['græsplæne', 'Græsplæne'], ['stauder', 'Stauder'],
  ['halloween', 'Halloween'], ['frugt og bær', 'Frugt og bær'],
  ['indendørs have', 'Indendørs have'], ['roser', 'Roser'],
] as const) {
  const v = formatKategori(n)
  tjek(`"${n}" → "${l}" (lag 2)`, [v.label, v.lag], [l, 2])
}

console.log('\n[Lag 2] — versal-varianter kollapser til samme label')
for (const n of ['Drivhus', 'Dyreliv', 'Kompost', 'Ukrudt', 'Vedligeholdelse']) {
  tjek(`"${n}" = "${n.toLowerCase()}"`, formatKategori(n).label, formatKategori(n.toLowerCase()).label)
}

console.log('\n[Lag 3] — slug-/kodeagtig værdi bliver "Andet"')
for (const n of ['vinter_klargoering', 'task-42', 'CATEGORY_X', '', '   ', '2026']) {
  const v = formatKategori(n)
  tjek(`"${n}" → Andet (lag 3)`, [v.label, v.lag], ['Andet', 3])
}

console.log('\n[Produktion] — ingen af de 56 værdier vises råt, og de 118 overlever')
{
  let somAndet = 0
  let raa = 0
  const rakkerSomAndet: string[] = []
  for (const [v, n] of PROD) {
    const { label, lag } = formatKategori(v)
    if (lag === 3) { somAndet += n; rakkerSomAndet.push(v) }
    if (label === v && /[a-zæøå]/.test(v.charAt(0))) raa++
  }
  tjek('ingen prod-værdi renderes med lille begyndelsesbogstav', raa, 0)
  tjek('nul rækker falder til "Andet"', [somAndet, rakkerSomAndet], [0, []])
}

console.log('\n[Data] — formatteren skriver aldrig tilbage')
tjek('noegle returneres uændret', formatKategori('  Klargoering ').noegle, '  Klargoering ')
tjek('kategoriLabel er samme svar', kategoriLabel('saaning'), formatKategori('saaning').label)

console.log('\n[Registrering] — alt uden verificeret label kan hentes')
{
  nulstilKategoriRegister()
  formatKategori('saaning'); formatKategori('halloween'); formatKategori('task-42')
  const reg = kategorierTilOprydning()
  tjek('lag 1 registreres ikke', reg.some(r => r.noegle === 'saaning'), false)
  tjek('lag 2 registreres', reg.find(r => r.noegle === 'halloween')?.lag, 2)
  tjek('lag 3 registreres', reg.find(r => r.noegle === 'task-42')?.lag, 3)
  nulstilKategoriRegister()
}

console.log(`\n${fejlet === 0 ? '✅' : '❌'}  i alt: ${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
