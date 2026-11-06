/**
 * Gartnerens personlige kontekst og dagsloft — vagt om MVP 1.0, fase 4 (6/11 2026).
 *
 * Reglerne (Anna 6/11) er:
 *   1. samtykke læses af serveren; alt andet end præcis `true` = fra (fail closed)
 *   2. uden samtykke sendes INTET personligt — uanset hvad der gives ind
 *   3. med samtykke: kun frø/planter/stednavn/vejr — aldrig koordinater m.m.
 *   4. dagsloftet (30) fejler ALDRIG åbent: DB-fejl, manglende funktion, ukendt
 *      svarform → afvis (503); grænsen nået → 429
 *   5. routen kalder kvoten FØR leverandøren, læser samtykket fra DB (ikke fra
 *      klienten), gemmer kun logbundne samtaler og sætter X-Gartner-Kontekst
 *
 * Tests af selve databasefunktionerne (samtidighed, døgnskifte, RLS) kører mod en
 * Supabase-branch FØR migration B/D anvendes — de er beskrevet i
 * Docs/product/fase4-migrationer/ og kører ikke her.
 */

import { readFileSync } from 'node:fs'
import {
  afgoerKvote, bygPersonligKontekst, dagligtLoft, harSamtykke,
  kontekstBrugtTekst, kontekstHeader, kvoteBeskedLoftNaaet,
  KVOTE_BESKED_UTILGAENGELIG, MAKS_FROE_LINJER, MAKS_PLANTE_LINJER,
  SAMTYKKE_TEKST, STANDARD_DAGLIGT_LOFT,
} from '@/lib/gartner-kontekst'

let bestaaet = 0
let fejlet = 0
function tjek(navn: string, ok: boolean, detalje = '') {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}${detalje ? `\n      ${detalje}` : ''}`) }
}

console.log('\n[Samtykke — fail closed]')
tjek('true → samtykke', harSamtykke({ ai_personlig_kontekst: true }))
for (const [navn, v] of [
  ['false', { ai_personlig_kontekst: false }],
  ['null', { ai_personlig_kontekst: null }],
  ['"true" (streng)', { ai_personlig_kontekst: 'true' }],
  ['1', { ai_personlig_kontekst: 1 }],
  ['kolonnen mangler (migration ikke kørt)', {}],
  ['ingen række (null)', null],
  ['undefined', undefined],
  ['en streng', 'true'],
  ['et tal', 1],
  ['en liste', [{ ai_personlig_kontekst: true }]],
] as const) {
  tjek(`${navn} → intet samtykke`, !harSamtykke(v))
}

console.log('\n[Dagsloft — konfiguration]')
tjek('standard er 30', STANDARD_DAGLIGT_LOFT === 30 && dagligtLoft(undefined) === 30)
tjek('"5" → 5', dagligtLoft('5') === 5)
tjek('" 12 " → 12 (trimmet)', dagligtLoft(' 12 ') === 12)
for (const v of ['', 'abc', '0', '-3', '2.5', '1e3', ' ', 'NaN', '99999999999999999999', null]) {
  tjek(`ugyldig ${JSON.stringify(v)} → 30`, dagligtLoft(v as string | null) === 30)
}

console.log('\n[Dagsloft — afgørelsen må aldrig fejle åbent]')
{
  const ok = afgoerKvote({ data: [{ tilladt: true, brugt: 7 }], error: null }, 30)
  tjek('tilladt → ok med antal', ok.ok && ok.brugt === 7)
  const naaet = afgoerKvote({ data: [{ tilladt: false, brugt: 30 }], error: null }, 30)
  tjek('grænsen nået → 429 med forståelig besked', !naaet.ok && naaet.status === 429 && naaet.besked === 'Du har stillet 30 spørgsmål i dag. Prøv igen i morgen.', JSON.stringify(naaet))
  tjek('tallet i beskeden følger konfigurationen', kvoteBeskedLoftNaaet(5) === 'Du har stillet 5 spørgsmål i dag. Prøv igen i morgen.')
  const fejlCases: [string, Parameters<typeof afgoerKvote>[0]][] = [
    ['databasefejl', { data: null, error: { message: 'boom' } }],
    ['funktion/tabel mangler', { data: null, error: { code: '42883', message: 'function does not exist' } }],
    ['ingen svar (null)', null],
    ['undefined', undefined],
    ['tom liste', { data: [], error: null }],
    ['data null uden fejl', { data: null, error: null }],
    ['ukendt svarform (streng)', { data: 'ok', error: null }],
    ['tilladt mangler', { data: [{ brugt: 3 }], error: null }],
    ['tilladt som streng "true"', { data: [{ tilladt: 'true', brugt: 3 }], error: null }],
    ['tilladt som tal 1', { data: [{ tilladt: 1 }], error: null }],
    ['tilladt null', { data: [{ tilladt: null }], error: null }],
  ]
  for (const [navn, svar] of fejlCases) {
    const u = afgoerKvote(svar, 30)
    tjek(`${navn} → afvist med 503 (aldrig åbent)`, !u.ok && u.status === 503 && u.besked === KVOTE_BESKED_UTILGAENGELIG, JSON.stringify(u))
  }
  tjek('fejl vinder over tilladt:true', (() => {
    const u = afgoerKvote({ data: [{ tilladt: true, brugt: 1 }], error: { message: 'x' } }, 30)
    return !u.ok && u.status === 503
  })())
  tjek('også et enkelt objekt (ikke liste) forstås', (() => {
    const u = afgoerKvote({ data: { tilladt: true, brugt: 2 }, error: null }, 30)
    return u.ok && u.brugt === 2
  })())
}

console.log('\n[Personlig kontekst — uden samtykke sendes intet]')
{
  const fuld = {
    froe: [{ navn: 'Tomat', sort: 'Sungold', antal: 20 }],
    planter: [{ navn: 'Dahlia', status: 'Spiret', saaedato: '2026-03-01' }],
    stednavn: '8220 Brabrand',
    vejr: { tempC: 8.4, beskrivelse: 'Let regn' },
  }
  const uden = bygPersonligKontekst({ samtykke: false, ...fuld })
  tjek('samtykke:false → tom tekst og intet brugt', uden.tekst === '' && uden.brugt.length === 0)
  const ukendt = bygPersonligKontekst({ samtykke: 'true' as unknown as boolean, ...fuld })
  tjek('samtykke som streng "true" → tom (kun true tæller)', ukendt.tekst === '' && ukendt.brugt.length === 0)
  const udenAlt = bygPersonligKontekst({ samtykke: undefined as unknown as boolean, ...fuld })
  tjek('samtykke mangler → tom', udenAlt.tekst === '')
}

console.log('\n[Personlig kontekst — med samtykke]')
{
  const k = bygPersonligKontekst({
    samtykke: true,
    froe: [
      { navn: 'Tomat', sort: 'Sungold', antal: 20 },
      { navn: 'Tomat', sort: 'Sungold', antal: 10 },
      { navn: 'Basilikum', sort: null, antal: null },
    ],
    planter: [
      { navn: 'Dahlia', sort: 'Café au Lait', status: 'Spiret', saaedato: '2026-03-01' },
      { navn: 'Salat', status: null, saaedato: 'i går' },
    ],
    stednavn: '8220 Brabrand',
    vejr: { tempC: 8.4, beskrivelse: 'Let regn' },
  })
  tjek('alle fire områder brugt', k.brugt.join(',') === 'frobank,planter,sted,vejr', k.brugt.join(','))
  tjek('samme art+sort slås sammen (2 poser, 30 frø)', /Tomat 'Sungold': 2 poser, 30 frø/.test(k.tekst), k.tekst)
  tjek('ukendt antal siges som ukendt (ikke 0)', /Basilikum: 1 pose, antal ukendt/.test(k.tekst))
  tjek('plante med status og sådato', /Dahlia 'Café au Lait' · status: Spiret · sået 2026-03-01/.test(k.tekst))
  tjek('ugyldig sådato udelades', !/i går/.test(k.tekst))
  tjek('stednavn med', k.tekst.includes('Havens sted: 8220 Brabrand.'))
  tjek('vejret nu, afrundet', k.tekst.includes('8 °C, Let regn'))
  tjek('aktuelt vejr skelnes fra generelle dyrkningsperioder', /AKTUELT vejr/.test(k.tekst) && /Danmark som helhed/.test(k.tekst))
  tjek('ingen regionale dyrkningsvinduer lovet', /ikke fremstilles som regionale/.test(k.tekst))
}

console.log('\n[Dataminimering]')
{
  // Felter, der IKKE må sive med, selv hvis kaldestedet fejlagtigt sender dem.
  const snavset = {
    samtykke: true,
    froe: [{ navn: 'Tomat', sort: 'Sungold', antal: 5, supplier: 'Bakker', notes: 'hemmelig note', latitude: 56.15, email: 'a@b.dk' }],
    planter: [{ navn: 'Dahlia', status: 'Spiret', saaedato: '2026-03-01', location: 'Højbed 2', notes: 'privat', imageUrl: 'x.jpg' }],
    stednavn: '8220 Brabrand',
    vejr: { tempC: 5, beskrivelse: 'Skyet', latitude: 56.15, longitude: 10.1 },
    latitude: 56.1531, longitude: 10.1057, email: 'anna@example.dk', adresse: 'Vej 1',
  } as unknown as Parameters<typeof bygPersonligKontekst>[0]
  const t = bygPersonligKontekst(snavset).tekst
  for (const forbudt of ['Bakker', 'hemmelig note', '56.15', '10.1057', 'a@b.dk', 'anna@example.dk', 'Højbed', 'privat', 'x.jpg', 'Vej 1']) {
    tjek(`"${forbudt}" sendes aldrig`, !t.includes(forbudt))
  }
  tjek('ingen koordinat-mønster (to decimaltal med punktum) i teksten', !/\b\d{1,2}\.\d{3,}\b/.test(t), t)
  tjek('ingen @ (e-mail) i teksten', !t.includes('@'))

  // Lange/notelignende værdier afkortes og bliver til én linje.
  const lang = 'x'.repeat(500) + '\nny linje med en note'
  const l = bygPersonligKontekst({ samtykke: true, froe: [{ navn: lang }] }).tekst
  tjek('lange værdier afkortes til 60 tegn og én linje', !l.includes('\nny linje') && !/x{61}/.test(l))

  // Lister begrænses.
  const mange = Array.from({ length: 200 }, (_, i) => ({ navn: `Art${String(i).padStart(3, '0')}`, antal: 1 }))
  const m = bygPersonligKontekst({ samtykke: true, froe: mange, planter: mange }).tekst
  tjek(`højst ${MAKS_FROE_LINJER} frø-linjer og ${MAKS_PLANTE_LINJER} plante-linjer`,
    (m.match(/pose, /g) ?? []).length <= MAKS_FROE_LINJER && (m.match(/^- Art\d{3}$/gm) ?? []).length <= MAKS_PLANTE_LINJER)

  // Tomme områder giver intet mærke.
  const tom = bygPersonligKontekst({ samtykke: true, froe: [], planter: [], stednavn: '  ', vejr: null })
  tjek('tomme områder → intet sendt, intet mærket', tom.tekst === '' && tom.brugt.length === 0)
  const uvejr = bygPersonligKontekst({ samtykke: true, vejr: { tempC: NaN, beskrivelse: 'x' } })
  tjek('ugyldigt vejr (NaN) udelades', uvejr.tekst === '')
}

console.log('\n[Gennemsigtighed: header og brugertekst]')
tjek('ingen mærker → "ingen"', kontekstHeader([]) === 'ingen')
tjek('mærker listes uden indhold', kontekstHeader(['frobank', 'vejr']) === 'frobank,vejr')
tjek('"ingen" giver ingen tekst', kontekstBrugtTekst('ingen') === null && kontekstBrugtTekst(null) === null && kontekstBrugtTekst('') === null)
tjek('læsbar tekst', kontekstBrugtTekst('frobank,planter,sted,vejr') === 'Gartneren brugte: dine frø, dine planter, havens sted, vejret lige nu.', String(kontekstBrugtTekst('frobank,planter,sted,vejr')))
tjek('plante/guide-kontekst vises også', kontekstBrugtTekst('plante,guide') === 'Gartneren brugte: den valgte plante, guiden du står på.')
tjek('ukendte værdier ignoreres', kontekstBrugtTekst('hemmeligt,frobank') === 'Gartneren brugte: dine frø.')
tjek('samtykketeksten er den godkendte (B-spec §5)',
  SAMTYKKE_TEKST.includes('Slået fra som standard') && SAMTYKKE_TEKST.includes('aldrig koordinater, adresse, e-mail, dine noter, fotos eller leverandør') && SAMTYKKE_TEKST.includes('Anthropic'))

console.log('\n[Routen: rækkefølge, samtykke fra DB, kun logbundne samtaler]')
{
  const r = readFileSync('src/app/api/ai/gartner/route.ts', 'utf8')
  const post = r.slice(r.indexOf('export async function POST'))
  const iKvote = post.indexOf("reserver_gartner_spoergsmaal")
  const iKlient = post.indexOf('getAnthropicClient()')
  const iKontekst = post.indexOf('bygPersonligKontekstFraDb(')
  tjek('kvoten reserveres FØR leverandørklienten oprettes', iKvote > 0 && iKlient > iKvote)
  tjek('kvoten reserveres før personlig kontekst hentes', iKvote > 0 && iKontekst > iKvote)
  tjek('en afvist kvote returnerer før leverandøren (return NextResponse.json …)', /if \(!kvote\.ok\)[\s\S]*?return NextResponse\.json/.test(post))
  tjek('grænsen kommer fra dagligtLoft(env), ikke fra klienten', /dagligtLoft\(process\.env\.GARTNER_DAGLIGT_LOFT\)/.test(post) && !/body\.(loft|graense|limit)/i.test(post))
  tjek('samtykket læses fra profiles med brugerens eget id', /from\('profiles'\)[\s\S]{0,120}select\('ai_personlig_kontekst'\)[\s\S]{0,60}eq\('id', userId\)/.test(r))
  tjek('samtykke afgøres af harSamtykke() (kun true)', /harSamtykke\(data\)/.test(r))
  const iface = r.slice(r.indexOf('interface GartnerRequest {'), r.indexOf('\n}\n', r.indexOf('interface GartnerRequest {')))
  tjek('klienten kan ikke sende samtykke (ikke i GartnerRequest, aldrig læst fra body)', iface.length > 50 && !/samtykke|consent|personlig/i.test(iface) && !/body\.[a-z_]*(samtykke|consent|personlig)/i.test(r))
  tjek('frie samtaler gemmes ikke: insert kun efter "if (!body.logId) return"', /if \(!body\.logId\) return\s*\n\s*try \{\s*\n\s*await supabase\.from\('ai_conversations'\)\.insert/.test(r))
  tjek('X-Gartner-Kontekst sættes på svaret', /\[KONTEKST_HEADER\]: kontekstHeader\(maerker\)/.test(r))
  tjek('koordinater hentes aldrig til AI (ingen latitude/longitude i routen)', !/latitude|longitude/.test(r))
  tjek('e-mail/noter/leverandør hentes aldrig til AI', !/\.email|supplier|\.notes/.test(r))
  tjek('et eksisterende log-svar returneres FØR kvoten (intet AI-kald = intet forbrug)',
    post.indexOf("from('ai_conversations')") > 0 && post.indexOf("from('ai_conversations')") < iKvote)
}

console.log('\n[Samtykke-handlingen]')
{
  const a = readFileSync('src/actions/ai-samtykke.ts', 'utf8')
  tjek('skriver kun kolonnen ai_personlig_kontekst', (a.match(/\.update\(\{[^}]*\}\)/g) ?? []).every(u => /^\.update\(\{ ai_personlig_kontekst: til === true \}\)$/.test(u)) && /\.update\(/.test(a))
  tjek('kun den indloggede brugers egen række (eq id = requireUser)', /requireUser\(\)/.test(a) && /\.eq\('id', userId\)/.test(a))
  tjek('tidsstemplet skrives aldrig fra koden', !/_aendret/.test(a.replace(/\/\*[\s\S]*?\*\//g, '')))
  tjek('rå fejl vises aldrig (ingen error.message ud)', !/error:\s*error\.message|error:\s*err\.message/.test(a))
  tjek('"use server"-fil eksporterer kun async funktioner (+ typer)', !/export (const|let|var|class|function (?!async))/.test(a.replace(/export type[^\n]*/g, '')))
}

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
