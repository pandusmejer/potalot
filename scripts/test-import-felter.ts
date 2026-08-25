/**
 * Permanent test af Excel-importens felt-udfyldning. Køres af `npm test`.
 *
 * To ting testes: at en kolonne der FINDES i filen faktisk bliver læst,
 * og at en tvetydig celle IKKE bliver gættet. Præcisionsreglen fra
 * sådybde gælder alle felter: hellere tomt end forkert.
 */
import {
  parseMaaneder,
  parseJaNej,
  parseLys,
  parseVand,
  parseSowingDepth,
  berigImportRaekke,
  type ImportRow,
  detectColumn,
  kortlaegKolonner,
  laesImportRaekke,
  byggImportPreview,
  type ImportRowData,
} from '@/lib/inventory-import-merge'
import { COLUMNS } from '@/app/api/inventory/template/route'
import { parseFieldsFromJson } from '@/lib/seed-packet-fields'

let bestået = 0
let fejlet = 0
function tjek(navn: string, ok: boolean, detalje?: string) {
  if (ok) {
    bestået++
    console.log(`  ✓ ${navn}`)
  } else {
    fejlet++
    console.log(`  ✗ ${navn}${detalje ? ` — ${detalje}` : ''}`)
  }
}
const J = (o: unknown) => JSON.stringify(o)

function raekke(data: ImportRowData): ImportRow {
  return { rowNumber: 2, status: 'ready', warnings: [], errors: [], data }
}

function main() {
  console.log('\n[Måneder] lister og intervaller læses, resten gættes ikke')
  {
    tjek('tal-liste "3, 4, 5"', J(parseMaaneder('3, 4, 5').months) === J([3, 4, 5]))
    tjek('navne "mar, apr"', J(parseMaaneder('mar, apr').months) === J([3, 4]))
    tjek('fulde navne "Marts/April"', J(parseMaaneder('Marts/April').months) === J([3, 4]))
    tjek('interval "3-5"', J(parseMaaneder('3-5').months) === J([3, 4, 5]))
    tjek('interval "mar–maj" (tankestreg)', J(parseMaaneder('mar–maj').months) === J([3, 4, 5]))
    tjek('interval "marts til juni"', J(parseMaaneder('marts til juni').months) === J([3, 4, 5, 6]))
    tjek('"maj og juni"', J(parseMaaneder('maj og juni').months) === J([5, 6]))
    tjek('enkelt tal 7', J(parseMaaneder(7).months) === J([7]))
    tjek('punktum-forkortelse "sep."', J(parseMaaneder('sep.').months) === J([9]))

    // Årsskiftet: nov-feb er stadig en entydig række måneder.
    tjek('"nov-feb" vender om årsskiftet', J(parseMaaneder('nov-feb').months) === J([1, 2, 11, 12]))

    // Det vi IKKE gætter på.
    tjek('"forår" → uklar, ikke et gæt', parseMaaneder('forår').months === null && parseMaaneder('forår').uklar)
    tjek('"13" er ikke en måned', parseMaaneder('13').months === null && parseMaaneder('13').uklar)
    tjek('"tidligt på sæsonen" → uklar', parseMaaneder('tidligt på sæsonen').uklar)
    tjek('tom celle → hverken værdi eller advarsel',
      parseMaaneder('').months === null && !parseMaaneder('').uklar)
  }

  console.log('\n[Ja/nej] forkultivering — et "nej" er data, ikke fravær')
  {
    tjek('"Ja" → true', parseJaNej('Ja') === true)
    tjek('"nej" → false (ikke null)', parseJaNej('nej') === false)
    tjek('"Forkultiveres" → true', parseJaNej('Forkultiveres') === true)
    tjek('"Sås direkte" → false', parseJaNej('Sås direkte') === false)
    tjek('boolean passerer igennem', parseJaNej(false) === false)
    tjek('"måske" → null (ukendt)', parseJaNej('måske') === null)
    tjek('tom celle → null', parseJaNej('') === null)
  }

  console.log('\n[Lys og vand] Potalots egne etiketter')
  {
    tjek('"Fuld sol" → full_sun', parseLys('Fuld sol') === 'full_sun')
    tjek('"halvskygge" → partial_shade', parseLys('halvskygge') === 'partial_shade')
    tjek('"Skygge" → shade', parseLys('Skygge') === 'shade')
    tjek('enum-værdien selv virker', parseLys('full_sun') === 'full_sun')
    tjek('"morgensol" → null (vi gætter ikke)', parseLys('morgensol') === null)

    tjek('"Regelmæssig" → regular', parseVand('Regelmæssig') === 'regular')
    tjek('"lidt" → low', parseVand('lidt') === 'low')
    tjek('"Meget" → high', parseVand('Meget') === 'high')
    tjek('"efter behov" → null', parseVand('efter behov') === null)
  }

  console.log('\n[Sådybde] uændret præcisionsregel')
  {
    tjek('"5 mm" → 5', parseSowingDepth('5 mm').mm === 5)
    tjek('"1 cm" → 10', parseSowingDepth('1 cm').mm === 10)
    tjek('"2-5 mm" er interval → tomt', parseSowingDepth('2-5 mm').mm === null && parseSowingDepth('2-5 mm').interval)
    tjek('0 er en gyldig værdi (overfladesåning)', parseSowingDepth('0').mm === 0)
  }

  console.log('\n[Merge] filens dyrkningsfakta vinder over guiderne')
  {
    // Tomat har en artsguide med egne værdier. Skriver brugeren selv
    // noget i regnearket, er det brugerens tal der gælder.
    const medEgne = berigImportRaekke(
      raekke({ name: 'Tomat', variety: 'Gardener’s Delight', sowingMonths: [1], light: 'shade' }),
      null,
    )
    tjek('Excel-såmåneder slår guiden', J(medEgne.values.sowingMonths) === J([1]))
    tjek('kilden er markeret som excel', medEgne.fieldSources.sowingMonths === 'excel')
    tjek('Excel-lys slår guiden', medEgne.values.light === 'shade' && medEgne.fieldSources.light === 'excel')

    // Uden Excel-værdier fylder guiden op — og markerer kilden.
    const kunGuide = berigImportRaekke(raekke({ name: 'Tomat', variety: 'Gardener’s Delight' }), null)
    tjek('uden egne tal fylder artsguiden op',
      (kunGuide.values.sowingMonths?.length ?? 0) > 0 && kunGuide.fieldSources.sowingMonths === 'art')

    // Et eksplicit "nej" må ikke forsvinde til fordel for guidens "ja".
    const nejTilForkultivering = berigImportRaekke(
      raekke({ name: 'Tomat', preCultivation: false }),
      null,
    )
    tjek('eksplicit "nej" til forkultivering overlever guiden',
      nejTilForkultivering.values.preCultivation === false &&
      nejTilForkultivering.fieldSources.preCultivation === 'excel')
  }

  console.log('\n[Merge] fritekst-felter bæres ordret videre')
  {
    const r = berigImportRaekke(
      raekke({
        name: 'Hirse', soil: 'Let, sandet jord', germinationDays: '10-14 dage',
        germinationTemperature: '18-22 °C', plantSpacing: '25 cm', rowSpacing: '40 cm',
      }),
      null,
    )
    tjek('jord', r.values.soil === 'Let, sandet jord')
    tjek('spiretid', r.values.germinationDays === '10-14 dage')
    tjek('spiretemperatur', r.values.germinationTemperature === '18-22 °C')
    tjek('planteafstand', r.values.plantSpacing === '25 cm')
    tjek('rækkeafstand', r.values.rowSpacing === '40 cm')
  }

  console.log('\n[Antal] frø tælles i frø, løg i stk')
  {
    const froe = berigImportRaekke(raekke({ name: 'Tomat', seedCount: 12 }), null)
    tjek('frø beholder seedCount', froe.values.seedCount === 12 && froe.values.quantity === undefined)

    // Linket siger "loeg" → den ene Antal-kolonne hører til stk, ikke frø.
    const loeg = berigImportRaekke(
      raekke({ name: 'Tulipan', seedCount: 10 }),
      { ok: true, fields: { primaryCategoryId: 'loeg' }, primaryImageUrl: null, sourceUrl: 'x' },
    )
    tjek('løg flyttes til stk', loeg.values.quantity === 10 && loeg.values.seedCount === undefined)
    tjek('kilden følger med', loeg.fieldSources.quantity === 'excel')

    // Egen stk-kolonne røres ikke.
    const begge = berigImportRaekke(
      raekke({ name: 'Dahlia', seedCount: 3, quantity: 5 }),
      { ok: true, fields: { primaryCategoryId: 'knolde' }, primaryImageUrl: null, sourceUrl: 'x' },
    )
    tjek('eksplicit stk-kolonne vinder', begge.values.quantity === 5)
  }

  console.log('\n[Pose] købsdato og bedst før kommer med')
  {
    const r = berigImportRaekke(
      raekke({ name: 'Ært', purchaseDate: '2025-03-14', expiryDate: '2028-12-31' }),
      null,
    )
    tjek('købsdato', r.values.purchaseDate === '2025-03-14')
    tjek('bedst før', r.values.expiryDate === '2028-12-31')
  }

  console.log('\n[Hele vejen] en udfyldt skabelon-række ender som felter')
  {
    // Præcis den række skabelonen selv leverer som eksempel.
    const raw = Object.fromEntries(COLUMNS.map(([h, v]) => [h, v]))
    const { headerToKey, unmapped } = kortlaegKolonner(Object.keys(raw))
    tjek('alle 21 kolonner blev genkendt', unmapped.length === 0, unmapped.join(', '))

    const r = laesImportRaekke(raw, headerToKey, 2)
    tjek('rækken er klar uden advarsler', r.status === 'ready' && r.warnings.length === 0,
      r.warnings.join(' | '))

    const beriget = byggImportPreview([r], {})[0]
    const v = beriget.values
    const forventet: [string, boolean][] = [
      ['art', v.name === 'Tomat'],
      ['latinsk navn', v.latinName === 'Solanum lycopersicum'],
      ['sort', v.variety === 'Black Cherry'],
      ['antal frø', v.seedCount === 50],
      ['købsår', v.purchaseYear === 2026],
      ['bedst før', v.expiryDate === '2028-12-31'],
      ['leverandør', v.supplier === 'Nelson Garden'],
      ['link', v.purchaseUrl === 'https://example.com'],
      ['noter', v.notes === 'God spiring sidste år'],
      ['sås', J(v.sowingMonths) === J([3, 4])],
      ['sådybde', v.sowingDepthMm === 5],
      ['forkultivering', v.preCultivation === true],
      ['plant ud', J(v.plantingOutMonths) === J([5, 6])],
      ['høst', J(v.harvestMonths) === J([7, 8, 9])],
      ['lys', v.light === 'full_sun'],
      ['vand', v.water === 'regular'],
      ['jord', v.soil === 'Næringsrig, veldrænet'],
      ['spiretid', v.germinationDays === '7-14 dage'],
      ['spiretemperatur', v.germinationTemperature === '18-22 °C'],
      ['planteafstand', v.plantSpacing === '50 cm'],
      ['rækkeafstand', v.rowSpacing === '70 cm'],
    ]
    const manglende = forventet.filter(([, ok]) => !ok).map(([n]) => n)
    tjek(`alle ${forventet.length} felter nåede frem`, manglende.length === 0, `mangler: ${manglende.join(', ')}`)
    tjek('alle felter er markeret som brugerens egen fil',
      forventet.every(([, ok]) => ok) &&
      (['sowingMonths', 'light', 'soil'] as const).every(k => beriget.fieldSources[k] === 'excel'))
  }

  console.log('\n[Hele vejen] ukendte kolonner tabes ikke i stilhed')
  {
    const raw = { 'Dansk navn': 'Ært', 'Min egen kolonne': 'noget', 'Hylde': 'B3' }
    const { headerToKey, unmapped } = kortlaegKolonner(Object.keys(raw))
    tjek('ukendte kolonner rapporteres', J(unmapped) === J(['Min egen kolonne', 'Hylde']))
    tjek('den kendte kolonne læses stadig',
      laesImportRaekke(raw, headerToKey, 2).data.name === 'Ært')
  }

  console.log('\n[Hele vejen] tvetydige celler advarer i stedet for at gætte')
  {
    const raw = { 'Dansk navn': 'Ært', 'Sås': 'forår', 'Sådybde': '2-5 mm', 'Lys': 'morgensol' }
    const { headerToKey } = kortlaegKolonner(Object.keys(raw))
    const r = laesImportRaekke(raw, headerToKey, 2)
    tjek('tre advarsler, ingen opdigtede værdier', r.warnings.length === 3, J(r.warnings))
    tjek('felterne står tomme',
      r.data.sowingMonths === undefined && r.data.sowingDepthMm === undefined && r.data.light === undefined)
    tjek('rækken er ikke en fejl — den kan stadig importeres', r.status === 'warning')
  }

  console.log('\n[Jord fra linket] produktsiden må sige det, den faktisk siger')
  {
    // Jord fundet: siden angiver jordkrav → feltet bæres ordret videre.
    const fundet = parseFieldsFromJson({ name: 'Ært', soil: 'Fugtighedsbevarende, veldrænet jord' })
    tjek('jord fundet bæres ordret videre', fundet.soil === 'Fugtighedsbevarende, veldrænet jord')

    // Jord mangler: intet felt, forkert type eller tom streng er ALT SAMMEN
    // tavshed. Der opfindes aldrig en jordbeskrivelse.
    tjek('jord mangler → feltet sættes ikke', parseFieldsFromJson({ name: 'Ært' }).soil === undefined)
    tjek('jord = null → feltet sættes ikke', parseFieldsFromJson({ soil: null }).soil === undefined)
    tjek('jord = tom streng → feltet sættes ikke', parseFieldsFromJson({ soil: '   ' }).soil === undefined)
    tjek('jord af forkert type → feltet sættes ikke', parseFieldsFromJson({ soil: 42 }).soil === undefined)

    const link = (soil?: string) => ({
      ok: true as const,
      fields: soil ? { soil } : {},
      primaryImageUrl: null,
      sourceUrl: 'https://eksempel.dk',
    })

    // Linket udfylder KUN et tomt felt.
    const fraLink = berigImportRaekke(
      raekke({ name: 'Hirse', purchaseUrl: 'https://eksempel.dk' }),
      link('Let, sandet jord'),
    )
    tjek('tomt jord-felt udfyldes af linket',
      fraLink.values.soil === 'Let, sandet jord' && fraLink.fieldSources.soil === 'link')

    // Excel vinder over linket — og uenigheden vises i reviewet.
    const excelVinder = berigImportRaekke(
      raekke({ name: 'Hirse', soil: 'Min egen muld', purchaseUrl: 'https://eksempel.dk' }),
      link('Let, sandet jord'),
    )
    tjek('Excel-værdi vinder over linket',
      excelVinder.values.soil === 'Min egen muld' && excelVinder.fieldSources.soil === 'excel')
    tjek('uenigheden vises som konflikt',
      excelVinder.konflikter.some(k => k.felt === 'soil' && k.label === 'Jord'))

    // Og guiden fylder først op, når hverken fil eller link har talt.
    const kunGuide = berigImportRaekke(raekke({ name: 'Tomat' }), link())
    tjek('uden fil og link falder jord tilbage til guiden',
      !!kunGuide.values.soil && kunGuide.fieldSources.soil === 'art')

    const linkSlaarGuiden = berigImportRaekke(
      raekke({ name: 'Tomat', purchaseUrl: 'https://eksempel.dk' }),
      link('Sur, tørveblandet jord'),
    )
    tjek('linket slår guiden',
      linkSlaarGuiden.values.soil === 'Sur, tørveblandet jord' &&
      linkSlaarGuiden.fieldSources.soil === 'link')
  }

  console.log('\n[Skabelon] hver kolonne i skabelonen bliver faktisk læst')
  {
    // Skabelonen ER dokumentationen. Driver den fra aliasserne, lover vi
    // brugeren en kolonne vi ikke læser — og så lander deres arbejde
    // stiltiende i "Kolonner uden match".
    const ukendte = COLUMNS.filter(([h]) => detectColumn(h) === null).map(([h]) => h)
    tjek('ingen skabelon-overskrift er ukendt for importen',
      ukendte.length === 0, ukendte.join(', '))

    const noegler = COLUMNS.map(([h]) => detectColumn(h))
    const dubletter = noegler.filter((k, i) => k != null && noegler.indexOf(k) !== i)
    tjek('to skabelon-kolonner peger ikke på samme felt', dubletter.length === 0, dubletter.join(', '))

    // Og omvendt: eksempelværdierne skal kunne læses af deres egen parser.
    tjek('eksempel "mar-apr" læses', J(parseMaaneder('mar-apr').months) === J([3, 4]))
    tjek('eksempel "jul, aug, sep" læses', J(parseMaaneder('jul, aug, sep').months) === J([7, 8, 9]))
    tjek('eksempel "maj-jun" læses', J(parseMaaneder('maj-jun').months) === J([5, 6]))
    tjek('eksempel "Fuld sol" læses', parseLys('Fuld sol') === 'full_sun')
    tjek('eksempel "Regelmæssig" læses', parseVand('Regelmæssig') === 'regular')
    tjek('eksempel "Ja" læses', parseJaNej('Ja') === true)
    tjek('eksempel "5 mm" læses', parseSowingDepth('5 mm').mm === 5)
  }

  console.log(`\n${fejlet === 0 ? '✅' : '❌'}  import-felter: ${bestået} bestået, ${fejlet} fejlet\n`)
  if (fejlet > 0) process.exit(1)
}

main()
