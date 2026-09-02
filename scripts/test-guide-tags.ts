/**
 * Guide-tag-formatteren — permanent vagt om den ANNA-LÅSTE lagdeling
 * (Docs/content/potalot-terminologi.md, 2/9 2026).
 *
 * Testen måler IKKE label-dækning. Vokabularet er åbent og AI-genereret;
 * en test der kræver en komplet tabel ville blokere hver ny guide.
 * Testet er kontrakten:
 *   · ingen render-vej viser inputstrengen råt
 *   · kendte nøgler får deres verificerede label
 *   · lag 2 er KUN versalisering — aldrig ae→æ/oe→ø/aa→å
 *   · usikker struktur giver ingen label
 *   · nye ukendte tags kan lande uden kodeændring
 *   · formatteren muterer aldrig tagværdien
 */

import {
  formatGuideTag, guideTagLabels, GUIDE_TAG_LABELS,
  tagsTilOprydning, nulstilTagRegister,
} from '@/lib/guide-tags'
import { IMPORTED_GUIDES } from '@/data/guides-imported'

let bestaaet = 0
let fejlet = 0

function tjek(navn: string, faktisk: unknown, forventet: unknown) {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet)
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}\n      forventet: ${JSON.stringify(forventet)}\n      faktisk:   ${JSON.stringify(faktisk)}`) }
}

console.log('\n[Lag 1] — verificeret label')
for (const [noegle, label] of [
  ['varmekraevende', 'Varmekrævende'],
  ['koedfuld', 'Kødfuld'],
  ['koekkenhave', 'Køkkenhave'],
  ['prydgraes', 'Prydgræs'],
  ['sproed', 'Sprød'],
  ['toerketolerant', 'Tørketolerant'],
  ['toerring', 'Tørring'],
  ['aert', 'Ært'],
  ['saaning', 'Såning'],
] as const) {
  const v = formatGuideTag(noegle)
  tjek(`"${noegle}" → "${label}" (lag 1)`, [v.label, v.lag], [label, 1])
}

console.log('\n[Lag 1] — sammensatte nøgler får mellemrum, ikke bindestreg')
tjek('"hurtig-vaekst"', formatGuideTag('hurtig-vaekst').label, 'Hurtig vækst')
tjek('"sol-eller-halvskygge"', formatGuideTag('sol-eller-halvskygge').label, 'Sol eller halvskygge')
tjek('"capsicum-annuum"', formatGuideTag('capsicum-annuum').label, 'Capsicum annuum')
tjek('"direkte såning" (fri tekst med mellemrum)', formatGuideTag('direkte såning').label, 'Direkte såning')

console.log('\n[Lag 2] — KUN versalisering')
for (const [noegle, label] of [
  ['grundstamme', 'Grundstamme'],
  ['drivhus', 'Drivhus'],
  ['blommetomat', 'Blommetomat'],
  ['sommerkrudt', 'Sommerkrudt'],   // redaktionelt skrald — men typografisk sikkert
] as const) {
  const v = formatGuideTag(noegle)
  tjek(`"${noegle}" → "${label}" (lag 2)`, [v.label, v.lag], [label, 2])
}

console.log('\n[Lag 2] — bogstavsubstitution er FORBUDT')
// Reglen der forhindrer at et ukendt ASCII-tag stille bliver et nyt dansk ord.
for (const noegle of ['ukendtvaerdi', 'noegetoerret', 'braamboer']) {
  const v = formatGuideTag(noegle)
  const substitueret = /æ|ø|å/.test(v.label ?? '')
  tjek(`"${noegle}" får ingen æ/ø/å`, substitueret, false)
  tjek(`"${noegle}" er kun versaliseret`, v.label, noegle.charAt(0).toUpperCase() + noegle.slice(1))
}

console.log('\n[Lag 3] — usikker struktur giver ingen label')
for (const noegle of ['ny-ukendt-noegle', 'AI_Generated_Tag', 'tag med Versal', 'sort-42', '']) {
  const v = formatGuideTag(noegle)
  tjek(`"${noegle}" → ingen label (lag 3)`, [v.label, v.lag], [null, 3])
}

console.log('\n[Ingen råt input] — hele det målte vokabular')
{
  const alle = new Set<string>()
  // IMPORTED_GUIDES er flad: arts- og sortsguider ligger side om side.
  for (const g of IMPORTED_GUIDES) for (const t of g.tags) alle.add(t)
  const raa: string[] = []
  for (const t of alle) {
    const { label } = formatGuideTag(t)
    // Et lag 2-tag er allerede korrekt dansk og adskiller sig kun ved versalen.
    // Rå visning = label identisk med nøglen inkl. lille begyndelsesbogstav.
    if (label !== null && label === t) raa.push(t)
  }
  tjek(`ingen af de ${alle.size} repo-tags renderes råt`, raa, [])
}

console.log('\n[Data] — formatteren muterer aldrig tagværdien')
{
  const tags = ['varmekraevende', 'grundstamme', 'ny-ukendt-noegle']
  const foer = [...tags]
  guideTagLabels(tags)
  for (const t of foer) formatGuideTag(t)
  tjek('input-arrayet er urørt', tags, foer)
  tjek('noegle returneres uændret', formatGuideTag('varmekraevende').noegle, 'varmekraevende')
  tjek('label-tabellen mapper ikke nøglen til sig selv', Object.entries(GUIDE_TAG_LABELS).filter(([k, v]) => k === v), [])
}

console.log('\n[guideTagLabels] — lag 3 falder bort, dubletter kollapser')
tjek('blandet liste',
  guideTagLabels(['varmekraevende', 'ny-ukendt-noegle', 'grundstamme']),
  ['Varmekrævende', 'Grundstamme'])
tjek('to nøgler med samme label vises én gang',
  guideTagLabels(['loebende-hoest', 'løbende høst']),
  ['Løbende høst'])
tjek('rækkefølgen bevares',
  guideTagLabels(['drivhus', 'aert']),
  ['Drivhus', 'Ært'])

console.log('\n[Registrering] — alt der ikke rammer lag 1 kan hentes til oprydning')
{
  nulstilTagRegister()
  guideTagLabels(['varmekraevende', 'sommerkrudt', 'ny-ukendt-noegle'])
  const reg = tagsTilOprydning()
  tjek('lag 1 registreres ikke', reg.some(r => r.noegle === 'varmekraevende'), false)
  tjek('lag 2 registreres (typografisk sikkert ≠ redaktionelt godt)',
    reg.find(r => r.noegle === 'sommerkrudt')?.lag, 2)
  tjek('lag 3 registreres', reg.find(r => r.noegle === 'ny-ukendt-noegle')?.lag, 3)
  nulstilTagRegister()
}

console.log(`\n${fejlet === 0 ? '✅' : '❌'}  i alt: ${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
