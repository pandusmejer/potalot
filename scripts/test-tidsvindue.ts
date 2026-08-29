/**
 * Tidsvindue-fortolkning — regressionstest mod de FAKTISKE værdier i
 * general_garden_tasks (aflæst mod produktion 26/8 2026).
 *
 * Reglen der testes (ANNA-LÅST): time_window må kun påvirke planner-gruppen,
 * når vinduet kan fortolkes deterministisk ud fra datoen. Betingede
 * formuleringer kvalificerer aldrig automatisk til "Gør nu". Ukendte former
 * giver 'ukendt' → gruppen påvirkes ikke (tavshed, ikke gæt).
 */

import { tolkTidsvindue, vinduetErAabent, type Tidsvindue } from '@/lib/kalender/tidsvindue'

let bestaaet = 0
let fejlet = 0

function tjek(navn: string, faktisk: unknown, forventet: unknown) {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet)
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}\n      forventet: ${JSON.stringify(forventet)}\n      faktisk:   ${JSON.stringify(faktisk)}`) }
}

function slags(tw: string | null): Tidsvindue['slags'] {
  return tolkTidsvindue(tw).slags
}

console.log('\n[Hele måneden] — ingen delvindue')
for (const tw of ['august', 'hele august', 'fra august', 'Hele januar', 'november', 'marts til april', null, '']) {
  tjek(`"${tw ?? '(null)'}"`, slags(tw), 'hele_maaneden')
}

console.log('\n[Dato-fortolkelige] — de 23 delvinduer i bunke 1')
const datoer: Array<[string, number]> = [
  ['fra midt august', 11],
  ['fra slut august', 21],
  ['slut august', 21],
  ['fra slut februar', 21],
  ['slut februar til marts', 21],
  ['slut marts', 21],
  ['fra slut april', 21],
  ['fra slut maj', 21],
  ['slut maj', 21],
  ['medio til slut maj', 11],   // intervallets START vinder
  ['slut juni', 21],
  ['fra slut juli', 21],
  ['slut juli', 21],
  ['fra slut september', 21],
  ['slut september', 21],
  ['fra slut oktober', 21],
  ['slut oktober', 21],
  ['midt til slut oktober', 11],
  // Samme semantik, uden for de 24 — men lige så deterministisk:
  ['primo oktober', 1],
  ['primo marts', 1],
  ['fra medio maj', 11],
  ['primo til medio maj', 1],
  ['ultimo januar', 21],
]
for (const [tw, dag] of datoer) {
  tjek(`"${tw}" → dag ${dag}`, tolkTidsvindue(tw), { slags: 'fra_dag', dag })
}

console.log('\n[Betingede] — må ALDRIG kvalificere til "Gør nu"')
for (const tw of [
  'efter høst', 'efter blomstring', 'efter første lette frost',
  'Efter snefald', 'Efter storm og blæst',
  'når bærrene begynder at modne', 'når forsythia blomstrer',
]) {
  tjek(`"${tw}"`, slags(tw), 'betinget')
}

console.log('\n[Tredje semantik — vejr/kadence] — IKKE klassificeret endnu → ukendt')
for (const tw of [
  'Milde dage', 'Milde frostfri dage', 'milde perioder uden frost',
  'tørre frostfrie dage', 'frostfri perioder', 'ved tørke',
  'ved frostperioder', 'Ved varsling om hård frost', 'hver 1-2 uge',
  'fra marts ved frostfri jord', 'frostfri dage i januar',
]) {
  tjek(`"${tw}"`, slags(tw), 'ukendt')
}

console.log('\n[Åbent/lukket] — dag-sammenligning kun i den aktuelle måned')
const d5aug = new Date(2026, 7, 5)
const d26aug = new Date(2026, 7, 26)
tjek('"fra midt august" · 5/8 · august',  vinduetErAabent(tolkTidsvindue('fra midt august'), 8, d5aug), false)
tjek('"fra midt august" · 26/8 · august', vinduetErAabent(tolkTidsvindue('fra midt august'), 8, d26aug), true)
tjek('"slut august" · 26/8 · august',     vinduetErAabent(tolkTidsvindue('slut august'), 8, d26aug), true)
tjek('"slut august" · 5/8 · august',      vinduetErAabent(tolkTidsvindue('slut august'), 8, d5aug), false)
tjek('"hele august" · 5/8 · august',      vinduetErAabent(tolkTidsvindue('hele august'), 8, d5aug), true)
tjek('"efter høst" · 26/8 · august',      vinduetErAabent(tolkTidsvindue('efter høst'), 8, d26aug), false)
tjek('"ved tørke" · 26/8 · august (ukendt → gruppen røres ikke)',
  vinduetErAabent(tolkTidsvindue('ved tørke'), 8, d26aug), null)
tjek('"slut september" · 26/8 · SEPTEMBER (anden måned → senere)',
  vinduetErAabent(tolkTidsvindue('slut september'), 9, d26aug), false)
tjek('"hele september" · 26/8 · SEPTEMBER',
  vinduetErAabent(tolkTidsvindue('hele september'), 9, d26aug), true)

// ─────────────────────────────────────────────────────────────────────
// Gruppe-reglen mod det FAKTISKE august-datasæt (aflæst mod produktion).
// Basisgruppen er den kategori/prioritets-udledning planneren allerede
// lavede; her testes KUN hvad tidsvinduet gør ved den.
// ─────────────────────────────────────────────────────────────────────
import { effektivPlannerGruppe, opgaveDatoForGoeremaal, type PlannerGruppe } from '@/lib/kalender/tidsvindue'

const AUGUST: Array<{ titel: string; basis: PlannerGruppe; tw: string | null }> = [
  { titel: 'Høst løg og kartofler',       basis: 'goer_nu',         tw: 'august' },
  { titel: 'Høst tomater løbende',        basis: 'goer_nu',         tw: 'hele august' },
  { titel: 'Plant efterårssalat i drivhus', basis: 'goer_nu',       tw: 'fra august' },
  { titel: 'Så spinat til vinterdyrkning', basis: 'goer_nu',        tw: 'fra midt august' },
  { titel: 'Giv plænen lidt luft',         basis: 'hvis_du_har_tid', tw: 'fra slut august' },
  { titel: 'Reparér bare pletter i plænen', basis: 'hvis_du_har_tid', tw: 'slut august' },
  { titel: 'Beskær hindbær efter høst',    basis: 'goer_nu',         tw: 'efter høst' },
  { titel: 'Saml frø til næste år',        basis: 'hvis_du_har_tid', tw: null },
]

function grupper(idag: Date) {
  const ud: Record<string, string[]> = {}
  for (const t of AUGUST) {
    const g = effektivPlannerGruppe(t.basis, t.tw, 8, idag)
    ;(ud[g] ??= []).push(t.titel)
  }
  return ud
}

console.log('\n[Gruppe-reglen · 5. august — midt/slut-vinduer er IKKE åbnet]')
const g5 = grupper(new Date(2026, 7, 5))
tjek('Gør nu', g5.goer_nu, ['Høst løg og kartofler', 'Høst tomater løbende', 'Plant efterårssalat i drivhus'])
tjek('Senere på måneden', g5.senere_paa_maaneden, ['Så spinat til vinterdyrkning'])
tjek('"efter høst" ude af topgrupperne', g5.hvis_du_har_tid?.includes('Beskær hindbær efter høst'), true)

console.log('\n[Gruppe-reglen · 26. august — midt/slut-vinduer ER åbnet]')
const g26 = grupper(new Date(2026, 7, 26))
tjek('Gør nu rummer nu også midt-august-såningen',
  g26.goer_nu?.includes('Så spinat til vinterdyrkning'), true)
tjek('Ingen "Senere på måneden" tilbage', g26.senere_paa_maaneden, undefined)
tjek('"efter høst" stadig ude af topgrupperne',
  g26.hvis_du_har_tid?.includes('Beskær hindbær efter høst'), true)
tjek('Lavprioritets-gøremål flyttes ALDRIG af vinduet',
  g26.hvis_du_har_tid?.includes('Giv plænen lidt luft'), true)

// ─────────────────────────────────────────────────────────────────────
// KAL-0114: "+" på et gøremål skal datere opgaven i den VISTE måned.
// ─────────────────────────────────────────────────────────────────────
const IDAG = new Date(2026, 7, 26) // 26. august 2026

console.log('\n[Opgavedato · fremtidig måned — måned OG år følger visningen]')
tjek('januar 2027, hele måneden → 1/1-2027',
  opgaveDatoForGoeremaal('januar', 1, 2027, IDAG), '2027-01-01')
tjek('september 2026, "slut september" → 21/9',
  opgaveDatoForGoeremaal('slut september', 9, 2026, IDAG), '2026-09-21')
tjek('september 2026, "primo september" → 1/9',
  opgaveDatoForGoeremaal('primo september', 9, 2026, IDAG), '2026-09-01')

console.log('\n[Opgavedato · indeværende måned — aldrig i fortiden]')
tjek('august, hele måneden (den 1. er passeret) → i dag',
  opgaveDatoForGoeremaal('hele august', 8, 2026, IDAG), '2026-08-26')
tjek('august, "fra midt august" (den 11. er passeret) → i dag',
  opgaveDatoForGoeremaal('fra midt august', 8, 2026, IDAG), '2026-08-26')
tjek('august, "slut august" set den 5. → den 21.',
  opgaveDatoForGoeremaal('slut august', 8, 2026, new Date(2026, 7, 5)), '2026-08-21')

console.log('\n[Opgavedato · bladret TILBAGE — ingen opgave født forsinket]')
tjek('marts 2026 (fortid) → i dag',
  opgaveDatoForGoeremaal('marts', 3, 2026, IDAG), '2026-08-26')
tjek('december 2025 (fortid, andet år) → i dag',
  opgaveDatoForGoeremaal('december', 12, 2025, IDAG), '2026-08-26')

console.log(`\n${fejlet === 0 ? '✅' : '❌'}  i alt: ${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
