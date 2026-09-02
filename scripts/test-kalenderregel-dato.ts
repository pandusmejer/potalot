/**
 * Kalenderreglernes datosemantik — vagt om produktreglen (Anna 2/9).
 *
 *   Det dokumenterede dyrkningsvindue bestemmer, hvornår en maskinafledt
 *   opgave må ligge. `relativeOffsetDays` er et legacy hint, ikke en
 *   autoritet: det placerer opgaven inden i vinduet og kan aldrig flytte
 *   den ud af det.
 *
 * Invarianten suiten findes for:
 *
 *   INGEN maskinafledt dato uden for sit dokumenterede vindue.
 *
 * Ligesom test-reminder-relevans.ts kører den mod den ÆGTE canonical data
 * (guide-facts-index.generated.ts), ikke mod fixtures. Ændrer et vindue sig
 * i biblioteket, skal testen sige det højt — det er hele pointen med at
 * datering og relevansvurdering nu slår samme vindue op.
 *
 * Fuld baggrund: Docs/product/kalenderregel-semantik-audit.md
 */

import {
  beregnRegelDato,
  generateTasksFromGuide,
  type RegelDatoGrund,
} from '@/lib/task-generation'
import {
  clampTilVindue,
  foersteDatoIVindue,
  resolveVindue,
  resolveCanoniskVindue,
  sidsteDagIMaaned,
  plusDage,
  idagKbh,
} from '@/lib/kalender/dyrkningsvindue'
import type { Guide, GuideCalendarRule, TaskType } from '@/lib/types'

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

/**
 * En regel + kontekst i ét kald. `idag` er ALTID eksplicit: en test der
 * afhænger af, hvornår den køres, er ikke en test.
 */
function dato(over: {
  taskType?: TaskType
  recommendedMonths?: number[]
  offset?: number | null
  trigger?: GuideCalendarRule['trigger']
  sowDate?: string
  plantName?: string
  variety?: string | null
  idag?: string
} = {}) {
  const rule: GuideCalendarRule = {
    taskType: over.taskType ?? 'plant_out',
    title: 'Testregel',
    priority: 'high',
    ...(over.recommendedMonths !== undefined ? { recommendedMonths: over.recommendedMonths } : {}),
    ...(over.offset != null ? { relativeOffsetDays: over.offset } : {}),
    trigger: over.trigger !== undefined ? over.trigger : 'sowingDate',
  }
  return beregnRegelDato({
    rule,
    opgavetype: rule.taskType,
    sowDate: over.sowDate ?? '2026-03-01',
    plantName: over.plantName ?? 'Chili',
    variety: over.variety !== undefined ? over.variety : 'Padron',
    idag: over.idag ?? '2026-01-01',
  })
}

/** Kort form: kun dato + grund, som de fleste assertions handler om. */
function kort(r: { dato: string | null; grund: RegelDatoGrund }) {
  return { dato: r.dato, grund: r.grund }
}

// ─────────────────────────────────────────────────────────────────────────
console.log('\n[Rene primitiver · dato-aritmetik i UTC]')

tjek('plusDage krydser månedsskifte', plusDage('2026-01-30', 5), '2026-02-04')
tjek('plusDage krydser årsskifte', plusDage('2026-12-30', 5), '2027-01-04')
tjek('plusDage regner UTC, ikke lokal tid (sommertid ville skride en dag)',
  plusDage('2026-06-01', 30), '2026-07-01')
tjek('februar i skudår', sidsteDagIMaaned(2028, 2), 29)
tjek('februar i almindeligt år', sidsteDagIMaaned(2026, 2), 28)
tjek('idagKbh giver YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(idagKbh()), true)
tjek('idagKbh er dansk tid: 1/1 kl. 00:30 dansk = 31/12 23:30 UTC',
  idagKbh(new Date('2026-12-31T23:30:00Z')), '2027-01-01')

// ─────────────────────────────────────────────────────────────────────────
console.log('\n[Clamp · Annas tre kant-eksempler (2/9)]')

tjek('ønsket 13/4, vindue [5,6] → 1/5 (før vinduet → første dag)',
  clampTilVindue('2026-04-13', [5, 6]), { dato: '2026-05-01', retning: 'frem' })
tjek('ønsket 2/7, vindue [8,9,10] → 1/8',
  clampTilVindue('2026-07-02', [8, 9, 10]), { dato: '2026-08-01', retning: 'frem' })
tjek('ønsket 20/11, vindue [8,9,10] → 31/10 (efter vinduet → sidste dag)',
  clampTilVindue('2026-11-20', [8, 9, 10]), { dato: '2026-10-31', retning: 'tilbage' })
tjek('dagen fra offsettet bevares IKKE — kun kanten',
  clampTilVindue('2026-04-17', [5, 6]).dato, '2026-05-01')
tjek('ønsket dato allerede i vinduet står helt stille',
  clampTilVindue('2026-05-23', [5, 6]), { dato: '2026-05-23', retning: 'i_vindue' })

console.log('\n[Clamp · diskontinuert vindue er medlemskab, ikke interval]')
tjek('vindue [4,5,6,9,10], ønsket 20/7 → 30/6 (hullet er IKKE en del af vinduet)',
  clampTilVindue('2026-07-20', [4, 5, 6, 9, 10]), { dato: '2026-06-30', retning: 'tilbage' })
tjek('vindue [4,5,6,9,10], ønsket 20/8 → 1/9 (nærmeste kant er fremad)',
  clampTilVindue('2026-08-20', [4, 5, 6, 9, 10]), { dato: '2026-09-01', retning: 'frem' })
tjek('vindue [4,5,6,9,10], ønsket 15/9 ligger I hullets modsatte side → uændret',
  clampTilVindue('2026-09-15', [4, 5, 6, 9, 10]).retning, 'i_vindue')

console.log('\n[Clamp · vindue over årsskifte]')
tjek('vindue [11,12,1,2], ønsket 10/3 → 28/2 samme år, ikke 1/11 otte mdr. senere',
  clampTilVindue('2026-03-10', [11, 12, 1, 2]), { dato: '2026-02-28', retning: 'tilbage' })
tjek('vindue [11,12,1,2], ønsket 15/9 → 1/11 samme år',
  clampTilVindue('2026-09-15', [11, 12, 1, 2]), { dato: '2026-11-01', retning: 'frem' })
tjek('vindue [11,12,1,2], ønsket 20/10 → 1/11 (fremad er nærmest)',
  clampTilVindue('2026-10-20', [11, 12, 1, 2]), { dato: '2026-11-01', retning: 'frem' })
tjek('vindue [12], ønsket 5/1 → 31/12 ÅRET FØR, hvis intet spærrer',
  clampTilVindue('2026-01-05', [12]), { dato: '2025-12-31', retning: 'tilbage' })
tjek('… men `tidligst` spærrer bagud: samme ønske, sået 2/1 → 1/12 samme år',
  clampTilVindue('2026-01-05', [12], '2026-01-02'), { dato: '2026-12-01', retning: 'frem' })
tjek('skudår: clamp bagud til februar rammer den 29.',
  clampTilVindue('2028-03-10', [2]), { dato: '2028-02-29', retning: 'tilbage' })

console.log('\n[Clamp · tomt vindue rører ikke datoen]')
tjek('ingen måneder → ønsket dato uændret',
  clampTilVindue('2026-04-13', []), { dato: '2026-04-13', retning: 'i_vindue' })

// ─────────────────────────────────────────────────────────────────────────
console.log('\n[Vinduets åbning · regler uden offset]')
tjek('sået i marts, vindue [5,6] → 1/5 samme år',
  foersteDatoIVindue([5, 6], '2026-03-01'), '2026-05-01')
tjek('sået i juli, vindue [5,6] → 1/5 året efter',
  foersteDatoIVindue([5, 6], '2026-07-01'), '2027-05-01')
tjek('sået i selve vinduets måned → den 1. i samme måned',
  foersteDatoIVindue([5, 6], '2026-05-20'), '2026-05-01')
tjek('tomt vindue → ingen dato', foersteDatoIVindue([], '2026-03-01'), null)

// ─────────────────────────────────────────────────────────────────────────
console.log('\n[Vindue-kilden · canonical vinder over reglens egen liste]')

tjek('Chili/Padrón plant_out er canonical [5,6]',
  resolveCanoniskVindue('plant_out', 'Chili', 'Padron'), [5, 6])
tjek('Chili/Padrón harvest er canonical [7,8,9,10] (reglen siger [8,9,10])',
  resolveCanoniskVindue('harvest', 'Chili', 'Padron'), [7, 8, 9, 10])
tjek('en type uden vindue-mapping har intet canonical vindue',
  resolveCanoniskVindue('watering', 'Chili', 'Padron'), null)
tjek('ukendt art → guiderne tier',
  resolveCanoniskVindue('plant_out', 'Akshindebæger', null), null)

// ── Præcedensen (Anna 2/9, revideret) ──────────────────────────────────
// Canonical er den YDRE grænse. Reglen må indsnævre den, aldrig udvide den.
// Det effektive vindue er fællesmængden — ét udtryk, der dækker identisk,
// ægte delmængde og delvist overlap, og efterlader præcis én fejlklasse.
console.log('\n[Præcedens · reglen må indsnævre canonical, aldrig udvide det]')

tjek('identiske vinduer → canonical, ingen indsnævring at melde',
  resolveVindue('harvest', 'Chili', 'Padron', [7, 8, 9, 10]),
  { maaneder: [7, 8, 9, 10], kilde: 'canonical', canonical: [7, 8, 9, 10], regel: [7, 8, 9, 10] })
tjek('reglen er ÆGTE delmængde → reglen vinder som præcisering',
  resolveVindue('harvest', 'Chili', 'Padron', [9, 10]),
  { maaneder: [9, 10], kilde: 'canonical_indsnaevret', canonical: [7, 8, 9, 10], regel: [9, 10] })
tjek('DELVIST overlap → fællesmængden, ikke den ene liste',
  resolveVindue('harvest', 'Chili', 'Padron', [10, 11]),
  { maaneder: [10], kilde: 'canonical_indsnaevret', canonical: [7, 8, 9, 10], regel: [10, 11] })
tjek('reglen prøver at UDVIDE canonical → kun det, canonical dækker',
  resolveVindue('harvest', 'Chili', 'Padron', [6, 7, 8, 9, 10, 11, 12]).maaneder, [7, 8, 9, 10])
tjek('NUL overlap → canonical vinder, og konflikten bæres med ud',
  resolveVindue('harvest', 'Tomat', 'Ananas', [10]),
  { maaneder: [7, 8, 9], kilde: 'canonical_konflikt', canonical: [7, 8, 9], regel: [10] })
tjek('DISKONTINUERT canonical: fællesmængden respekterer hullet',
  // Hvidløgs udplantning er [2,3,10,11,12]. Reglen [3,4,5,6,10] overlapper
  // i marts og oktober — ikke i det, der ligner et interval imellem.
  resolveVindue('plant_out', 'Hvidløg', null, [3, 4, 5, 6, 10]),
  { maaneder: [3, 10], kilde: 'canonical_indsnaevret',
    canonical: [2, 3, 10, 11, 12], regel: [3, 4, 5, 6, 10] })
tjek('ÅRSSKIFTE: fællesmængden er medlemskab, ikke fra-til',
  resolveVindue('plant_out', 'Hvidløg', null, [11, 12, 1]),
  // Reglens liste sorteres på vej ind ([11,12,1] → [1,11,12]); januar
  // falder ud, fordi den ikke er medlem af canonical. Ingen fra-til.
  { maaneder: [11, 12], kilde: 'canonical_indsnaevret',
    canonical: [2, 3, 10, 11, 12], regel: [1, 11, 12] })
tjek('… og et årsskifte-vindue helt uden overlap er stadig en konflikt',
  resolveVindue('plant_out', 'Hvidløg', null, [6, 7, 8]).kilde, 'canonical_konflikt')

console.log('\n[Præcedens · når kun den ene kilde findes]')
tjek('canonical mangler → reglens recommendedMonths som legacy fallback',
  resolveVindue('plant_out', 'Akshindebæger', null, [6, 7]),
  { maaneder: [6, 7], kilde: 'regel', canonical: null, regel: [6, 7] })
tjek('reglen mangler → canonical alene',
  resolveVindue('plant_out', 'Chili', 'Padron', null),
  { maaneder: [5, 6], kilde: 'canonical', canonical: [5, 6], regel: null })
tjek('begge mangler → intet vindue',
  resolveVindue('plant_out', 'Akshindebæger', null, []),
  { maaneder: [], kilde: 'intet', canonical: null, regel: null })
tjek('legacy fallback sorteres, så clamp aldrig ser en rodet liste',
  resolveVindue('plant_out', 'Akshindebæger', null, [7, 3, 5]).maaneder, [3, 5, 7])
tjek('dubletter i reglens liste påvirker ikke resultatet',
  resolveVindue('plant_out', 'Akshindebæger', null, [5, 5, 6]).maaneder, [5, 6])

// ─────────────────────────────────────────────────────────────────────────
console.log('\n[beregnRegelDato · offsettets tre udfald]')

tjek('offsetdato INDEN FOR vinduet beholdes med dag og det hele',
  kort(dato({ offset: 80, sowDate: '2026-03-01' })),   // 20/5, vindue [5,6]
  { dato: '2026-05-20', grund: 'offset_i_vindue' })
tjek('offsetdato FØR vinduet clampes frem til vinduets første dag',
  kort(dato({ offset: 30, sowDate: '2026-03-01' })),   // 31/3, vindue [5,6]
  { dato: '2026-05-01', grund: 'offset_clampet_frem' })
tjek('offsetdato EFTER vinduet clampes tilbage til vinduets sidste dag',
  kort(dato({ offset: 150, sowDate: '2026-03-01' })),  // 29/7, vindue [5,6]
  { dato: '2026-06-30', grund: 'offset_clampet_tilbage' })
tjek('den rå ønskedato bevares i resultatet, så clampen kan revideres',
  dato({ offset: 30, sowDate: '2026-03-01' }).oensket, '2026-03-31')

console.log('\n[beregnRegelDato · offsettet kan ALDRIG forlade vinduet]')
{
  // Invarianten, brute-force: samme regel, hver dag i et helt såvindue.
  const udenfor: string[] = []
  for (let d = 1; d <= 28; d++) {
    for (const m of [1, 2, 3]) {
      const sow = `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const r = dato({ offset: 70, sowDate: sow, idag: '2026-01-01' })
      if (r.dato && ![5, 6].includes(Number(r.dato.slice(5, 7)))) udenfor.push(`${sow}→${r.dato}`)
    }
  }
  tjek('84 så-datoer × offset 70 → ingen dato uden for [5,6]', udenfor, [])
}

console.log('\n[beregnRegelDato · ingen offset]')
tjek('uden offset dateres reglen til vinduets åbning',
  kort(dato({ offset: null, sowDate: '2026-03-01' })),
  { dato: '2026-05-01', grund: 'vinduets_aabning' })
tjek('offset på en ANDEN trigger er fortsat dødt — vi kender ikke den dato',
  kort(dato({ offset: 90, trigger: 'plantingOutDate', sowDate: '2026-03-01' })),
  { dato: '2026-05-01', grund: 'vinduets_aabning' })

console.log('\n[beregnRegelDato · legacy fallback og fuldstændig tavshed]')
tjek('ukendt art + reglens eget vindue → clampes mod reglen',
  dato({ plantName: 'Akshindebæger', variety: null, recommendedMonths: [6, 7], offset: 30 }),
  { dato: '2026-06-01', grund: 'offset_clampet_frem', vindue: [6, 7], vindueKilde: 'regel', oensket: '2026-03-31' })
tjek('intet vindue nogen steder + offset → gammel adfærd bevares (rå offsetdato)',
  kort(dato({ plantName: 'Akshindebæger', variety: null, recommendedMonths: [], offset: 30 })),
  { dato: '2026-03-31', grund: 'offset_uden_vindue' })
tjek('intet vindue og intet offset → ingen opgave (som før)',
  kort(dato({ plantName: 'Akshindebæger', variety: null, recommendedMonths: [], offset: null })),
  { dato: null, grund: 'ingen_dato' })
tjek('en pleje-type uden vindue-mapping falder tilbage på reglens egen liste',
  kort(dato({ taskType: 'watering', recommendedMonths: [6, 7], offset: null })),
  { dato: '2026-06-01', grund: 'vinduets_aabning' })

// ─────────────────────────────────────────────────────────────────────────
console.log('\n[Tilbagevirkende registrering · vinduet afgør, ikke datoen]')

tjek('beregnet dato i fortiden, men vinduet stadig åbent → omdateres til i dag',
  kort(dato({ offset: 42, sowDate: '2026-03-20', idag: '2026-06-01' })),
  // 1/5 clampet i vindue [5,6]; 1/6 ligger stadig i vinduet
  { dato: '2026-06-01', grund: 'omdateret_til_idag' })
tjek('beregnet dato i fortiden og vinduet lukket → opgaven oprettes ikke',
  kort(dato({ offset: 42, sowDate: '2026-03-20', idag: '2026-09-02' })),
  { dato: null, grund: 'droppet_vindue_lukket' })
tjek('fortidsdato uden noget vindue → droppes som hidtil',
  kort(dato({ plantName: 'Akshindebæger', variety: null, recommendedMonths: [], offset: 5,
    sowDate: '2026-03-01', idag: '2026-06-01' })),
  { dato: null, grund: 'droppet_fortid_uden_vindue' })
tjek('en fremtidig dato røres ikke af registreringsdagen',
  kort(dato({ offset: 80, sowDate: '2026-03-01', idag: '2026-03-01' })),
  { dato: '2026-05-20', grund: 'offset_i_vindue' })
tjek('registreret PRÆCIS på den beregnede dag → beholdes, ikke omdateres',
  kort(dato({ offset: 80, sowDate: '2026-03-01', idag: '2026-05-20' })),
  { dato: '2026-05-20', grund: 'offset_i_vindue' })
tjek('den tabte opgave fra auditten §6: sået 20/3, registreret 1/6 — overlever nu',
  dato({ offset: 42, sowDate: '2026-03-20', idag: '2026-06-01' }).dato !== null, true)

// ─────────────────────────────────────────────────────────────────────────
console.log('\n[Regressionstest · Chili/Padrón, sagen der startede det hele]')
{
  // Annas eksempel: sået 2. februar. Offset +70 gav 13/04 — fire uger før
  // udplantningsvinduet åbner.
  const udplant = dato({
    taskType: 'plant_out', recommendedMonths: [5, 6], offset: 70,
    sowDate: '2026-02-02', idag: '2026-02-02',
  })
  tjek('Udplant chili: 13/04 bliver 1/5, ikke 13/4',
    kort(udplant), { dato: '2026-05-01', grund: 'offset_clampet_frem' })
  tjek('… og vinduet er canonical, ikke reglens egen liste',
    { vindue: udplant.vindue, kilde: udplant.vindueKilde },
    { vindue: [5, 6], kilde: 'canonical' })

  // Sået sent i vinduet: her PASSEDE offsettet allerede.
  tjek('sået 20/3 → 29/5 ligger i vinduet og står uændret',
    kort(dato({ taskType: 'plant_out', recommendedMonths: [5, 6], offset: 70,
      sowDate: '2026-03-20', idag: '2026-03-20' })),
    { dato: '2026-05-29', grund: 'offset_i_vindue' })

  // Høst: reglen siger [8,9,10], canonical siger [7,8,9,10]. Reglen er en
  // ægte delmængde — altså en præcisering — så det effektive vindue er
  // [8,9,10]. Offset +150 fra 2/2 giver 2/7, som falder uden for og
  // clampes til 1/8. Canonical er grænsen; reglen er skarpheden.
  const hoest = dato({
    taskType: 'harvest', recommendedMonths: [8, 9, 10], offset: 150,
    sowDate: '2026-02-02', idag: '2026-02-02',
  })
  tjek('Høst Padrón: 2/7 clampes til 1/8 — reglen indsnævrer canonical',
    kort(hoest), { dato: '2026-08-01', grund: 'offset_clampet_frem' })
  tjek('… vinduet er fællesmængden, og kilden siger det',
    { vindue: hoest.vindue, kilde: hoest.vindueKilde },
    { vindue: [8, 9, 10], kilde: 'canonical_indsnaevret' })
  tjek('… uden reglens præcisering ville juli være tilladt (kontrolprøve)',
    clampTilVindue('2026-07-02', [7, 8, 9, 10], '2026-02-02').retning, 'i_vindue')
  tjek('sået 20/3 → høst 17/8 ligger i vinduet og står uændret',
    kort(dato({ taskType: 'harvest', recommendedMonths: [8, 9, 10], offset: 150,
      sowDate: '2026-03-20', idag: '2026-03-20' })),
    { dato: '2026-08-17', grund: 'offset_i_vindue' })

  // De tre fund fra effektmålingen — uden en eneste specialcase.
  tjek('"Grav dahlia-knolde op før frost": [10,11] ∩ [7,8,9,10] = [10] → 1/10, ikke 1/7',
    kort(dato({ plantName: 'Dahlia', variety: 'Night Silence', taskType: 'harvest',
      recommendedMonths: [10, 11], offset: null, sowDate: '2026-04-10', idag: '2026-04-10' })),
    { dato: '2026-10-01', grund: 'vinduets_aabning' })
  tjek('"Høst alle frugter før frost" på tomat: [10] ∩ [7,8,9] er TOM → konflikt',
    dato({ plantName: 'Tomat', variety: 'Lucky Tiger', taskType: 'harvest',
      recommendedMonths: [10], offset: null, sowDate: '2026-03-10', idag: '2026-03-10' }).vindueKilde,
    'canonical_konflikt')
  tjek('… og konflikten dateres på canonical, ikke på den afviste regel',
    kort(dato({ plantName: 'Tomat', variety: 'Lucky Tiger', taskType: 'harvest',
      recommendedMonths: [10], offset: null, sowDate: '2026-03-10', idag: '2026-03-10' })),
    { dato: '2026-07-01', grund: 'vinduets_aabning' })
}

console.log('\n[Regressionstest · ægte diskontinuert canonical vindue (hvidløg)]')
{
  // Hvidløg har plantingOutMonths [2,3,10,11,12] i biblioteket — både
  // diskontinuert OG over årsskiftet. Ingen fixture, ægte data.
  tjek('canonical hvidløg-udplantning er [2,3,10,11,12]',
    resolveCanoniskVindue('plant_out', 'Hvidløg', null), [2, 3, 10, 11, 12])
  tjek('sået 5/1, ønsket 20/6 → 31/3 (bagud er nærmest, og efter såningen)',
    kort(dato({ plantName: 'Hvidløg', variety: null, taskType: 'plant_out',
      offset: 166, sowDate: '2026-01-05', idag: '2026-01-01' })),
    { dato: '2026-03-31', grund: 'offset_clampet_tilbage' })
  tjek('sået 21/4, samme ønskedato 20/6 → 1/10: 31/3 lå FØR såningen',
    kort(dato({ plantName: 'Hvidløg', variety: null, taskType: 'plant_out',
      offset: 60, sowDate: '2026-04-21', idag: '2026-01-01' })),
    { dato: '2026-10-01', grund: 'offset_clampet_frem' })
  tjek('ønsket 18/8 clampes til 1/10 (nærmeste kant den anden vej)',
    kort(dato({ plantName: 'Hvidløg', variety: null, taskType: 'plant_out',
      offset: 60, sowDate: '2026-06-19', idag: '2026-01-01' })),
    { dato: '2026-10-01', grund: 'offset_clampet_frem' })
}

// ─────────────────────────────────────────────────────────────────────────
console.log('\n[Hele vejen · generateTasksFromGuide]')
{
  function guide(regler: GuideCalendarRule[]): Guide {
    return {
      id: 'g1', plantName: 'Chili', variety: 'Padron', calendarRules: regler,
    } as unknown as Guide
  }
  const regler: GuideCalendarRule[] = [
    { taskType: 'plant_out', title: 'Udplant chili', recommendedMonths: [5, 6], trigger: 'sowingDate', relativeOffsetDays: 70, priority: 'high' },
    { taskType: 'harvest', title: 'Høst Padrón', recommendedMonths: [8, 9, 10], trigger: 'sowingDate', relativeOffsetDays: 150, priority: 'medium' },
    { taskType: 'watering', title: 'Vand jævnligt', recommendedMonths: [6, 7], priority: 'low' },
  ]

  const tidligt = generateTasksFromGuide({
    guide: guide(regler), sowDate: '2026-02-02', plantId: 'p1', inventoryItemId: 'i1',
    plantName: 'Chili', variety: 'Padron', idag: '2026-02-02',
  })
  tjek('alle tre regler bliver til opgaver',
    // Høsten: reglens [8,9,10] indsnævrer canonical [7,8,9,10] → 2/7 clampes til 1/8.
    tidligt.map(t => t.date), ['2026-05-01', '2026-08-01', '2026-06-01'])
  tjek('typerne er stadig normaliseret undervejs',
    tidligt.map(t => t.taskType), ['plant_out', 'harvest', 'watering'])

  // Samme guide, men registreret i september: udplantning er lukket,
  // høsten er stadig åben, og vandingen falder på reglens eget vindue.
  const sent = generateTasksFromGuide({
    guide: guide(regler), sowDate: '2026-02-02', plantId: 'p1', inventoryItemId: 'i1',
    plantName: 'Chili', variety: 'Padron', idag: '2026-09-02',
  })
  tjek('tilbagevirkende i september: kun de opgaver hvis vindue stadig er åbent',
    sent.map(t => `${t.taskType}@${t.date}`), ['harvest@2026-09-02'])

  // Plantens navn er opslagsnøglen — ikke guidens. De to kan divergere,
  // og det er plantens navn, relevansmotoren senere bruger.
  const ukendt = generateTasksFromGuide({
    guide: guide([regler[0]]), sowDate: '2026-02-02', plantId: 'p1', inventoryItemId: 'i1',
    plantName: 'Akshindebæger', variety: null, idag: '2026-02-02',
  })
  tjek('ukendt art falder tilbage på reglens [5,6] og clampes stadig',
    ukendt.map(t => t.date), ['2026-05-01'])
}

console.log('\n[Invariant · ingen maskinafledt dato uden for sit vindue]')
{
  // Den brede vagt: alle vindue-bærende typer × ægte canonical arter ×
  // et helt års så-datoer × et spænd af offsets.
  const arter: [string, string | null][] = [
    ['Chili', 'Padron'], ['Tomat', 'Ananas'], ['Agurk', 'Beit Alpha'],
    ['Salat', null], ['Hvidløg', null],
  ]
  const typer: TaskType[] = ['pre_sow', 'sowing', 'plant_out', 'harvest']
  const brud: string[] = []
  let daekket = 0
  for (const [navn, sort] of arter) {
    for (const t of typer) {
      const canonical = resolveCanoniskVindue(t, navn, sort)
      if (!canonical) continue
      for (let m = 1; m <= 12; m++) {
        for (const offset of [0, 21, 45, 70, 120, 200, 365]) {
          const sow = `2026-${String(m).padStart(2, '0')}-15`
          const r = beregnRegelDato({
            rule: { taskType: t, title: 'x', priority: 'high', trigger: 'sowingDate', relativeOffsetDays: offset },
            opgavetype: t, sowDate: sow, plantName: navn, variety: sort, idag: '2026-01-01',
          })
          if (!r.dato) continue
          daekket++
          if (!canonical.includes(Number(r.dato.slice(5, 7)))) {
            brud.push(`${navn}/${t} sået ${sow} +${offset} → ${r.dato} ∉ ${JSON.stringify(canonical)}`)
          }
        }
      }
    }
  }
  tjek(`${daekket} datoer beregnet — ingen uden for sit canonical vindue`, brud, [])
  tjek('… og dækningen er reel, ikke nul', daekket > 500, true)
}

console.log(`\n${fejlet === 0 ? '✅' : '❌'}  i alt: ${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
