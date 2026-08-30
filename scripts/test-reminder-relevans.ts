/**
 * Reminder-relevans — vagt om produktreglen (Anna 30/8).
 *
 *   En BRUGEROPRETTET opgave kan fortsat være forsinket, indtil brugeren
 *   selv afslutter eller fjerner den. En MASKIN-AFLEDT sæsonopgave må kun
 *   være reminder-relevant, mens dens dokumenterede dyrkningsvindue stadig
 *   gør handlingen meningsfuld.
 *
 * Testen kører mod den ÆGTE canonical data (guide-facts-index.generated.ts),
 * ikke mod fixtures. Ændrer et vindue sig i biblioteket, skal denne test sige
 * det højt — det er hele pointen med at have én fortolker.
 *
 * Provenance-fælden der vagtes hårdest: `source = 'plant'` betyder BRUGERENS
 * opgave (opgavedialogen med en plante koblet på), ikke en maskinafledt.
 * En regel skrevet på intuition om feltnavnet ville slette Annas egne
 * opgaver — de tre 'plant'-rækker i produktion 30/8 var alle hendes egne.
 */

import {
  vurderReminderRelevans,
  ikkeRelevanteOpgaveIder,
  kalenderMaanedKbh,
  type ReminderKandidat,
} from '@/lib/kalender/reminder-relevans'

let bestaaet = 0
let fejlet = 0

function tjek(navn: string, faktisk: unknown, forventet: unknown) {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet)
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else {
    fejlet++
    console.error(`  ✗ ${navn}\n      forventet: ${JSON.stringify(forventet)}\n      faktisk:   ${JSON.stringify(faktisk)}`)
  }
}

function opgave(over: Partial<ReminderKandidat> = {}): ReminderKandidat {
  return {
    id: 't1',
    source: 'guide',
    taskType: 'plant_out',
    plantName: 'Chili',
    variety: 'Padron',
    ...over,
  }
}

const AUGUST = 8
const MAJ = 5

// ── Sagen der startede det hele ─────────────────────────────────────────
console.log('\n[Udplant chili · 13/04 — den konkrete sag]')
tjek(
  'Chili/Padrón plant_out i august, vindue [5,6] → IRRELEVANT',
  vurderReminderRelevans(opgave(), AUGUST),
  { relevant: false, grund: 'vindue_lukket', vindue: [5, 6] },
)
tjek(
  'samme opgave i maj → relevant (vinduet er åbent)',
  vurderReminderRelevans(opgave(), MAJ),
  { relevant: true, grund: 'vindue_aabent', vindue: [5, 6] },
)
tjek(
  'sortens stavemåde i DB ("Padron") rammer samme vindue som guidens ("Padrón")',
  vurderReminderRelevans(opgave({ variety: 'Padrón' }), AUGUST),
  vurderReminderRelevans(opgave({ variety: 'Padron' }), AUGUST),
)
tjek(
  'søsteropgaven: Chili harvest i august, vindue [7,8,9,10] → relevant',
  vurderReminderRelevans(opgave({ taskType: 'harvest' }), AUGUST),
  { relevant: true, grund: 'vindue_aabent', vindue: [7, 8, 9, 10] },
)

// ── Vinduet åbent / lukket ──────────────────────────────────────────────
console.log('\n[Guide-opgave · vinduet afgør]')
tjek('plant_out i juni (sidste måned i vinduet) → relevant',
  vurderReminderRelevans(opgave(), 6).relevant, true)
tjek('plant_out i april (FØR vinduet) → irrelevant',
  vurderReminderRelevans(opgave(), 4).relevant, false)
tjek('plant_out i juli (EFTER vinduet) → irrelevant',
  vurderReminderRelevans(opgave(), 7).relevant, false)
tjek('pre_sow i februar, Chili-vindue [1,2,3] → relevant',
  vurderReminderRelevans(opgave({ taskType: 'pre_sow' }), 2),
  { relevant: true, grund: 'vindue_aabent', vindue: [1, 2, 3] })
tjek('pre_sow i august → irrelevant',
  vurderReminderRelevans(opgave({ taskType: 'pre_sow' }), AUGUST).relevant, false)
tjek('sowing (direkte såning) på Chili → tavshed, arten har intet direkte-så-vindue',
  vurderReminderRelevans(opgave({ taskType: 'sowing' }), AUGUST),
  { relevant: true, grund: 'intet_dokumenteret_vindue', vindue: null })
tjek('Stangbønne "Cobra" plant_out i august, vindue [5,6] → irrelevant',
  vurderReminderRelevans(
    opgave({ plantName: 'Stangbønne', variety: 'Cobra' }), AUGUST),
  { relevant: false, grund: 'vindue_lukket', vindue: [5, 6] })

// ── Tavshed: intet dokumenteret vindue ──────────────────────────────────
console.log('\n[Guide-opgave uden dokumenteret vindue → eksisterende adfærd]')
tjek('Grønkål plant_out (arten har ingen vinduer i biblioteket) → relevant',
  vurderReminderRelevans(opgave({ plantName: 'Grønkål', variety: null }), AUGUST),
  { relevant: true, grund: 'intet_dokumenteret_vindue', vindue: null })
tjek('Grønkål harvest → relevant',
  vurderReminderRelevans(
    opgave({ plantName: 'Grønkål', variety: null, taskType: 'harvest' }), AUGUST),
  { relevant: true, grund: 'intet_dokumenteret_vindue', vindue: null })
tjek('helt ukendt art → relevant (hul i biblioteket sletter aldrig en påmindelse)',
  vurderReminderRelevans(
    opgave({ plantName: 'Blomkålsvampe fra Mars', variety: null }), AUGUST),
  { relevant: true, grund: 'intet_dokumenteret_vindue', vindue: null })
tjek('tomt plantenavn → relevant',
  vurderReminderRelevans(opgave({ plantName: '', variety: null }), AUGUST).relevant, true)

console.log('\n[Opgavetyper uden timing-semantik → aldrig filtreret]')
for (const t of ['watering', 'fertilizing', 'pruning', 'pest_check', 'weeding',
                 'repot', 'maintenance', 'planning', 'custom']) {
  tjek(`${t} → relevant`,
    vurderReminderRelevans(opgave({ taskType: t }), AUGUST),
    { relevant: true, grund: 'ingen_vindue_mapping', vindue: null })
}

// ── Provenance: kun 'guide' må udløbe ───────────────────────────────────
console.log('\n[Provenance · brugeropgaver forbliver brugerens]')
for (const kilde of ['manual', 'plant', 'general', 'inventory']) {
  tjek(`source='${kilde}' med lukket vindue → STADIG relevant`,
    vurderReminderRelevans(opgave({ source: kilde }), AUGUST),
    { relevant: true, grund: 'ikke_maskinafledt', vindue: null })
}
tjek("ukendt fremtidig kilde er ikke bevist maskinel → relevant",
  vurderReminderRelevans(opgave({ source: 'ai_gartner' }), AUGUST).relevant, true)

// ── Årsskifte ───────────────────────────────────────────────────────────
// Palmekål høstes [1,2,8,9,10,11,12] — et ægte vindue der krydser nytår.
// Medlemskab i månedslisten håndterer det uden interval-fortolkning: hver
// måned er enten i listen eller ikke. Artsguiden (Kål) har [6..12] UDEN
// januar, så testen beviser samtidig sort-før-art-præcedensen.
console.log('\n[Årsskifte · vinduer der krydser december/januar]')
const palmekaal = opgave({ plantName: 'Kål', variety: 'Palmekål', taskType: 'harvest' })
tjek('Palmekål harvest i december → relevant',
  vurderReminderRelevans(palmekaal, 12).relevant, true)
tjek('Palmekål harvest i januar (efter årsskiftet) → relevant',
  vurderReminderRelevans(palmekaal, 1).relevant, true)
tjek('Palmekål harvest i februar (vinduets sidste måned) → relevant',
  vurderReminderRelevans(palmekaal, 2).relevant, true)
tjek('Palmekål harvest i marts (uden for vinduet) → irrelevant',
  vurderReminderRelevans(palmekaal, 3),
  { relevant: false, grund: 'vindue_lukket', vindue: [1, 2, 8, 9, 10, 11, 12] })
tjek('Palmekål harvest i maj (midt i "hullet") → irrelevant',
  vurderReminderRelevans(palmekaal, 5).relevant, false)
tjek('Kål UDEN sort: januar er ikke i artens høstvindue → irrelevant',
  vurderReminderRelevans(
    opgave({ plantName: 'Kål', variety: null, taskType: 'harvest' }), 1),
  { relevant: false, grund: 'vindue_lukket', vindue: [6, 7, 8, 9, 10, 11, 12] })

// ── Bloklisten ──────────────────────────────────────────────────────────
console.log('\n[Blokliste · kun de fagligt udløbne ryger med]')
const blanding: ReminderKandidat[] = [
  opgave({ id: 'guide-udloebet', source: 'guide' }),
  opgave({ id: 'guide-hoest', source: 'guide', taskType: 'harvest' }),
  opgave({ id: 'guide-uden-vindue', source: 'guide', plantName: 'Grønkål', variety: null }),
  opgave({ id: 'bruger-plant', source: 'plant' }),
  opgave({ id: 'bruger-manual', source: 'manual' }),
  opgave({ id: 'bruger-general', source: 'general' }),
]
tjek('kun guide-opgaven med lukket vindue',
  ikkeRelevanteOpgaveIder(blanding, AUGUST), ['guide-udloebet'])
// I maj vender billedet: udplantning er åben, men høst ([7,8,9,10]) er
// endnu ikke. Bloklisten er altså ikke "gamle opgaver" — den er ét opslag
// pr. opgave i dens EGET vindue.
tjek('i maj er udplantningen relevant, mens høsten endnu ikke er det',
  ikkeRelevanteOpgaveIder(blanding, MAJ), ['guide-hoest'])
tjek('tom liste ind → tom liste ud', ikkeRelevanteOpgaveIder([], AUGUST), [])

// ── Måneden skal matche SQL'ens v_today ─────────────────────────────────
console.log('\n[Måned · Europe/Copenhagen, som i SQL]')
tjek('1. januar kl. 00:30 dansk tid (= 31/12 23:30 UTC) → januar, ikke december',
  kalenderMaanedKbh(new Date('2026-12-31T23:30:00Z')), 1)
tjek('1. august kl. 01:30 dansk sommertid (= 31/7 23:30 UTC) → august',
  kalenderMaanedKbh(new Date('2026-07-31T23:30:00Z')), 8)
tjek('midt på dagen er der ingen tvivl',
  kalenderMaanedKbh(new Date('2026-08-30T12:00:00Z')), 8)

console.log(`\n${fejlet === 0 ? '✅' : '❌'}  i alt: ${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
