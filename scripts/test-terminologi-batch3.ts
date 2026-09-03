/**
 * Terminologisk integritet — vagt om korrektur-batch 3 (3/9 2026).
 *
 * Batch 3 målte hvert begreb mod datamodel og live-DB, før et ord blev
 * rettet (Docs/content/batch-3-terminologi-beslutningsrapport.md). Denne
 * test findes, fordi netop de her par realistisk driver igen: en ny
 * komponent laver sin egen lille label-tabel, en prompt interpolerer en
 * enum råt, en import-review får sit eget ord for et felt, skabelonen
 * allerede har navngivet.
 *
 * Fire slags tjek:
 *   1. de låste labels i de centrale tabeller (Forkultivér, Plant ud,
 *      Ønskeliste, Købsår)
 *   2. ingen lokale label-tabeller eller rå enums dér, hvor batchen fjernede dem
 *   3. modelgrænser, der ikke må skride: repot-opgaven logger aldrig som
 *      `repotting`; guide-faktaboksen kalder ikke forkultiveringsvinduet "Såning"
 *   4. artsalias Georgine → Dahlia (genfinding uden dataændring)
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { TASK_TYPE_META, PRIMARY_CATEGORIES, LIGHT_META } from '@/lib/constants'
import { KODEORD_MATCHER_IKKE } from '@/lib/kodeord'
import { kanoniskArtsNavn, kanoniskArtsSlug, soegeArter } from '@/lib/arts-model'

let bestaaet = 0
let fejlet = 0

function tjek(navn: string, ok: boolean, detalje = '') {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}${detalje ? `\n      ${detalje}` : ''}`) }
}

function laes(sti: string): string {
  return readFileSync(sti, 'utf-8')
}

/** Alle .ts/.tsx-filer under en mappe, undtagen auto-genererede datasæt. */
function filer(dir: string): string[] {
  const ud: string[] = []
  for (const navn of readdirSync(dir)) {
    const sti = join(dir, navn)
    if (statSync(sti).isDirectory()) {
      if (navn === 'node_modules') continue
      ud.push(...filer(sti))
    } else if (/\.tsx?$/.test(navn) && !/\.generated\.ts$/.test(navn)) {
      ud.push(sti)
    }
  }
  return ud
}

/** Fjerner blok- og linjekommentarer, så udviklernoter ikke tæller som copy. */
function udenKommentarer(kilde: string): string {
  return kilde
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, (_, pre) => pre)
}

console.log('\n1. Låste labels i de centrale tabeller')
tjek("TASK_TYPE_META.pre_sow hedder 'Forkultivér' (standard 11/8: forkultivering)",
  TASK_TYPE_META.pre_sow.label === 'Forkultivér', `fandt '${TASK_TYPE_META.pre_sow.label}'`)
tjek("TASK_TYPE_META.plant_out hedder 'Plant ud' (Batch 3: 12 mod 2)",
  TASK_TYPE_META.plant_out.label === 'Plant ud', `fandt '${TASK_TYPE_META.plant_out.label}'`)
tjek("TASK_TYPE_META.repot hedder stadig 'Prikl om' (låst 2/9)",
  TASK_TYPE_META.repot.label === 'Prikl om')
tjek("kategorien indkoebsliste hedder 'Ønskeliste' i brugerfladen — id'et er uændret",
  PRIMARY_CATEGORIES.indkoebsliste.name === 'Ønskeliste' && PRIMARY_CATEGORIES.indkoebsliste.id === 'indkoebsliste')
tjek("LIGHT_META.full_sun hedder 'Fuld sol'", LIGHT_META.full_sun.label === 'Fuld sol')
tjek('kodeords-mismatch har én kilde', KODEORD_MATCHER_IKKE.length > 0)

const importMerge = laes('src/lib/inventory-import-merge.ts')
tjek("import-review kalder purchase_year 'Købsår' — ikke 'Årgang'",
  importMerge.includes("purchaseYear: 'Købsår'") && !importMerge.includes("purchaseYear: 'Årgang'"))
tjek("import-review bruger skabelonens egne kolonnenavne ('Sås', 'Plant ud')",
  !importMerge.includes("'Såmåneder'") && !importMerge.includes("plantingOutMonths: 'Udplantning'"))
tjek("import-review siger 'regelmæssig' om water=regular, som resten af appen",
  !importMerge.includes("return 'jævnt'"))
tjek("import-header-aliaset 'årgang' er bevaret (brugerens regneark må stadig sige det)",
  /purchaseYear:\s*\[[^\]]*'årgang'/.test(importMerge))

console.log('\n2. Ingen lokale label-tabeller eller rå enums, hvor batchen fjernede dem')
tjek('inventory-card har ikke sin egen LIGHT_LABEL',
  !laes('src/components/froebank/inventory-card.tsx').includes('const LIGHT_LABEL'))
const gartner = laes('src/app/api/ai/gartner/route.ts')
tjek('Gartner-prompten interpolerer ikke plant.status råt',
  !gartner.includes('`status: ${plant.status}`') && gartner.includes('PLANT_STATUS_META'))
const dinDyrkning = laes('src/components/havekalender/din-dyrkning.tsx')
tjek("Kalenderens vækstlinje har 'i_vaekst' som eget trin (aldrig 'Spirer' for en plante i vækst)",
  /const stages: PlantStatus\[\] = \[[^\]]*'i_vaekst'/.test(dinDyrkning) && !dinDyrkning.includes("? 1\n"))
tjek('Kalenderens vækstlinje henter labels fra STAGE_SHORT_LABEL, ikke en egen liste',
  dinDyrkning.includes('STAGE_SHORT_LABEL') && !dinDyrkning.includes("const labels = ['Sået'"))

console.log('\n3. Modelgrænser')
const havekalender = laes('src/actions/havekalender.ts')
tjek("en fuldført repot-opgave (prikling) logger ALDRIG som 'repotting' (ompotning)",
  !/case 'repot':\s*return 'repotting'/.test(havekalender))
tjek("en fuldført repot-opgave får overskriften 'Priklet om' i Plantens historie",
  havekalender.includes("'Priklet om'"))
tjek("Kalenderens spirer-stadie siger 'Skal prikles om', ikke 'Skal ompottes'",
  dinDyrkning.includes("'Skal prikles om'") && !dinDyrkning.includes("'Skal ompottes'"))
const quickFacts = laes('src/components/guides/quick-facts.tsx')
tjek("guide-faktaboksen kalder ikke forkultiveringsvinduet (sowingMonths) 'Såning'",
  !quickFacts.includes('label="Såning"') && !quickFacts.includes("label: 'Såning'"))
const guideCard = laes('src/components/guides/guide-card.tsx')
tjek("guide-kortets chip skelner 'Sås' (direkte) fra 'Forkultiveres' (pre_sow)",
  guideCard.includes('Forkultiveres') && !guideCard.includes('Sås {sowingPeriod}'))
const extractPrompt = laes('src/actions/seed-packet-extract.ts')
tjek('frøpose-udtrækket må ikke fortolke pakke-/sæsonår som købsår',
  /purchaseYear: KØBSÅRET/.test(extractPrompt) && /IKKE købsår/.test(extractPrompt) && !/pakket til \/ sæsonmærket med som heltal/.test(extractPrompt))

console.log('\n4. Artsalias Georgine → Dahlia')
tjek("'Georgine' er arten Dahlia", kanoniskArtsNavn('Georgine') === 'Dahlia')
tjek("'georginer' får slug 'dahlia'", kanoniskArtsSlug('georginer') === 'dahlia')
tjek("søgning på 'georg' finder Dahlia", soegeArter('georg').includes('Dahlia'))
tjek("søgning på 'skole' finder Agurk (Skoleagurk-aliaset)", soegeArter('skole').includes('Agurk'))
tjek('for korte søgninger matcher ingenting', soegeArter('ge').length === 0)
tjek("'Dahlia' er fortsat sit eget kanoniske navn", kanoniskArtsNavn('Dahlia') === 'Dahlia')

console.log('\n5. Statisk scanning af brugerrettet copy i src/')
const FORBUDT: Array<{ moenster: RegExp; hvorfor: string; kun?: RegExp }> = [
  { moenster: /Indkøbs- og ønskeliste/, hvorfor: "kategorien hedder 'Ønskeliste' (Batch 3, D8)" },
  { moenster: /label="Årgang"|'Årgang'/, hvorfor: "feltet hedder 'Købsår' (Batch 3, D2)" },
  { moenster: /Plant not found|Item not found/, hvorfor: 'engelsk fejltekst — brug fejllagets danske form (D3)' },
  { moenster: /error: '[^']*(?: ikke fundet| findes ikke)'/, hvorfor: "findes-ikke-skabelonen er 'Vi kunne ikke finde X. Måske er den allerede slettet.' (D3)", kun: /^src\/actions\// },
  { moenster: /'De to kodeord matcher ikke'/, hvorfor: 'kodeords-mismatch har én kilde i src/lib/kodeord.ts', kun: /^src\/components\// },
  { moenster: /'Skal ompottes'/, hvorfor: "spirer-stadiet prikles om — ompotning er en anden handling (D1)" },
  { moenster: /\? 'guide' : 'guider'/, hvorfor: "flertal er 'guides' (standard 11/8)" },
]
const ALLE = filer('src')
for (const f of FORBUDT) {
  const ramte: string[] = []
  for (const sti of ALLE) {
    if (f.kun && !f.kun.test(sti)) continue
    const kilde = udenKommentarer(laes(sti))
    if (f.moenster.test(kilde)) ramte.push(sti)
  }
  tjek(`ingen forekomst af ${f.moenster} — ${f.hvorfor}`, ramte.length === 0, ramte.join(', '))
}

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
