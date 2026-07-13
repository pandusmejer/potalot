/**
 * Node-test for "Prøv næste år"-motoren (lib/havebog-proev-naeste-aar.ts).
 *
 * Kør:  npx tsx scripts/test-proev-naeste-aar.ts
 *
 * Beviser Annas prioritering: forlæng > hul > frøavl > robusthed > køkken
 * > fallback, og at forslagene bygger på brugerens egne sorter.
 */

import {
  byggProevNaesteAar,
  type KatalogSort,
  type ProevInput,
} from '@/lib/havebog-proev-naeste-aar'

const KAT: KatalogSort[] = [
  { art: 'Tomat', variety: 'San Marzano', tags: ['pasta', 'sen', 'kødfuld'], harvestMonths: [8, 9, 10], difficulty: 'medium', billede: '/img/sanmarzano.png' },
  { art: 'Tomat', variety: 'Stupice', tags: ['tidlig', 'salat'], harvestMonths: [6, 7, 8], difficulty: 'easy', billede: '/img/stupice.png' },
  { art: 'Tomat', variety: 'Sungold', tags: ['cherry', 'tidlig', 'snack'], harvestMonths: [7, 8, 9], difficulty: 'easy', billede: '/img/sungold.png' },
  { art: 'Jordbær', variety: 'Korona', tags: ['tidlig'], harvestMonths: [6, 7], difficulty: 'easy', billede: null },
  { art: 'Jordbær', variety: 'Malwina', tags: ['sen'], harvestMonths: [7, 8], difficulty: 'medium', billede: '/img/malwina.png' },
  { art: 'Chili', variety: 'Habanero', tags: ['stærk'], harvestMonths: [9, 10], difficulty: 'hard', billede: null },
  { art: 'Chili', variety: 'Jalapeño', tags: ['robust', 'mild'], harvestMonths: [8, 9], difficulty: 'easy', billede: '/img/jalapeno.png' },
]

function base(over: Partial<ProevInput> = {}): ProevInput {
  return { dyrkede: [], katalog: KAT, hoestPrArt: {}, ...over }
}

let ok = 0, fejl = 0
function tjek(navn: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✅' : '❌'} ${navn}${cond ? '' : '  ' + extra}`)
  cond ? ok++ : fejl++
}

// 1 · Forlæng — dyrker sen tomat (San Marzano) → foreslå tidlig søskende.
{
  const r = byggProevNaesteAar(base({ dyrkede: [{ art: 'Tomat', variety: 'San Marzano' }] }))
  tjek('Forlæng: sen tomat → tidligere sort som lead',
    !!r && /Tidligere tomat/.test(r.navn), JSON.stringify(r))
  console.log(`     lead: "${r?.navn}" — ${r?.begrundelse}`)
}

// 2 · Hul — dyrker kun pasta-tomat → foreslå anden type (cherry/salat).
//     (San Marzano er sen, MEN begge tidlige søskende findes, så forlæng
//     vinder som lead; hul bør så være sekundært.)
{
  const r = byggProevNaesteAar(base({ dyrkede: [{ art: 'Tomat', variety: 'San Marzano' }] }))
  const harHul = r?.sekundaer && /Prøv en (cherry|salat)/.test(r.sekundaer.titel)
  tjek('Hul: anden tomattype som sekundært forslag', !!harHul, JSON.stringify(r?.sekundaer))
}

// 3 · Frøavl — dyrker tomat, ingen sen/hul-kandidat udløst isoleret.
{
  // Dyrker BEGGE tidlige+typer, så forlæng/hul ikke fyrer → frøavl bliver lead.
  const r = byggProevNaesteAar(base({
    dyrkede: [
      { art: 'Tomat', variety: 'Stupice' },
      { art: 'Tomat', variety: 'Sungold' },
      { art: 'Tomat', variety: 'San Marzano' },
    ],
  }))
  tjek('Frøavl: lead når ingen sort-kandidat er relevant', !!r && r.navn === 'Prøv frøavl', JSON.stringify(r))
  console.log(`     lead: "${r?.navn}" — ${r?.begrundelse}`)
}

// 4 · Robusthed — dyrker krævende chili (Habanero, hard) → hårdfør søskende.
{
  const r = byggProevNaesteAar(base({ dyrkede: [{ art: 'Chili', variety: 'Habanero' }] }))
  // Chili er frøavls-art, så frøavl kan blive lead; robusthed skal i det mindste findes.
  const tekst = [r?.navn, r?.begrundelse, r?.sekundaer?.titel, r?.sekundaer?.tekst].join(' ')
  tjek('Robusthed: hårdfør chili optræder (lead eller sekundært)', /hårdfør chili|Jalapeño/.test(tekst), JSON.stringify(r))
}

// 5 · Køkken — meget tomat-høst, dyrker ikke basilikum → foreslå basilikum.
{
  const r = byggProevNaesteAar(base({
    dyrkede: [{ art: 'Tomat', variety: 'Stupice' }, { art: 'Tomat', variety: 'Sungold' }, { art: 'Tomat', variety: 'San Marzano' }],
    hoestPrArt: { Tomat: 12 },
  }))
  const tekst = [r?.navn, r?.begrundelse, r?.sekundaer?.titel, r?.sekundaer?.tekst].join(' ')
  tjek('Køkken: basilikum-makker ved stor tomat-høst', /Basilikum/.test(tekst), JSON.stringify(r))
}

// 6 · Fallback — dyrker intet motoren kender → null.
{
  const r = byggProevNaesteAar(base({ dyrkede: [{ art: 'Pastinak', variety: 'Halvlang' }] }))
  tjek('Fallback: ukendt/tomt grundlag → null (skjul)', r === null, JSON.stringify(r))
}

// Ingen døde links — billede peger kun på en katalog-sort.
{
  const r = byggProevNaesteAar(base({ dyrkede: [{ art: 'Tomat', variety: 'San Marzano' }] }))
  tjek('Billede peger på en ægte katalog-sort', !r?.billede || KAT.some(k => k.billede === r?.billede), r?.billede ?? '')
}

// Rotation — ≥2 lead-egnede (foto) kandidater → knappen kan vises.
{
  const r = byggProevNaesteAar(base({
    dyrkede: [{ art: 'Tomat', variety: 'San Marzano' }, { art: 'Chili', variety: 'Habanero' }],
  }))
  const k = r?.kandidater ?? []
  tjek('Rotation: mindst 2 lead-egnede kandidater', k.length >= 2, JSON.stringify(k.map(x => x.titel)))
  tjek('Rotation: alle kandidater har foto', k.every(x => !!x.billede), JSON.stringify(k))
  tjek('Rotation: ingen dublet-sort', new Set(k.map(x => `${x.titel}|${x.billede}`)).size === k.length, JSON.stringify(k.map(x => x.titel)))
  tjek('Rotation: href er ægte rute (guide eller frøbank)',
    k.every(x => x.href.startsWith('/guides/') || x.href === '/froebank'), JSON.stringify(k.map(x => x.href)))
  console.log(`     kandidater: ${k.map(x => x.titel).join(' · ')}`)
}

// Én kandidat → knappen skal skjules (kun 1 lead-egnet sort).
{
  // Dyrker kun San Marzano: forlæng+hul peger begge på Stupice (dedup→1),
  // frøavl har intet foto. Resultat: præcis 1 lead-egnet kandidat.
  const r = byggProevNaesteAar(base({ dyrkede: [{ art: 'Tomat', variety: 'San Marzano' }] }))
  const k = r?.kandidater ?? []
  tjek('Én kandidat → knap-skjul (kandidater.length === 1)', k.length === 1, JSON.stringify(k.map(x => x.titel)))
  tjek('Kandidat-liste er aldrig tom-array (undefined når 0)', r === null || r.kandidater === undefined || r.kandidater.length > 0, JSON.stringify(r?.kandidater))
}

console.log(`\n${ok} bestået, ${fejl} fejlet.`)
if (fejl > 0) process.exit(1)
