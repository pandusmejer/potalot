/**
 * Postnummeropslag — vagt om den lokale GeoNames-tabel (6/11 2026).
 *
 * DAWA er lukket (HTTP 410), og opslaget blev erstattet af en lokal,
 * versioneret tabel. Denne test holder fast i det, der ellers let går galt:
 *   1. tabellen passer til den committede kildefil (sha256) — ingen drift
 *   2. alle postnumre er firecifrede STRENGE; koordinater ligger i Danmark
 *   3. dækning: ALLE 589 geografiske postnumre i kontrolsættet (DAGI) findes
 *      med samme stednavn, og de vigtigste byer rammer rigtigt
 *   4. ikke-geografiske postnumre (0xxx m.fl.) giver IKKE en vejrudsigt
 *   5. ugyldigt input giver null
 *   6. fejlmeddelelserne er forskellige (ugyldigt ≠ teknisk fejl)
 *   7. tabellen havner aldrig i klient-bundlen; lookupPostnummer har uændret
 *      signatur, bruger hverken fetch eller Open-Meteo; vejrintegrationen er urørt
 */

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { findPostnummer } from '@/lib/postnummer'
import { POSTNUMRE_DK, POSTNUMRE_UDELADT, POSTNUMRE_KILDE } from '@/data/postnumre-dk.generated'
import { POSTNR_TEKNISK_FEJL } from '@/lib/postnummer-tekster'

let bestaaet = 0
let fejlet = 0

function tjek(navn: string, ok: boolean, detalje = '') {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}${detalje ? `\n      ${detalje}` : ''}`) }
}

const KILDE_MAPPE = join('data', 'kilder', 'geonames-dk')
const kildeBuf = readFileSync(join(KILDE_MAPPE, 'DK.txt'))
const meta = JSON.parse(readFileSync(join(KILDE_MAPPE, 'KILDE.json'), 'utf8'))

console.log('\n[Kilde og versionering]')
{
  const hash = createHash('sha256').update(kildeBuf).digest('hex')
  tjek('KILDE.json sha256 = hash af den committede DK.txt', hash === meta.sha256, `${hash} ≠ ${meta.sha256}`)
  tjek('genereret fil bygger på samme sha256', POSTNUMRE_KILDE.sha256 === hash, `${POSTNUMRE_KILDE.sha256} ≠ ${hash}`)
  tjek('kildeangivelse, licens og dato er med', POSTNUMRE_KILDE.kilde === 'GeoNames' && POSTNUMRE_KILDE.licens === 'CC BY 4.0' && /^\d{4}-\d{2}-\d{2}$/.test(POSTNUMRE_KILDE.hentetDato))
  const kildeKoder = kildeBuf.toString('utf8').split('\n').filter(l => l.trim()).map(l => l.split('\t')[1])
  const iAlt = Object.keys(POSTNUMRE_DK).length + Object.keys(POSTNUMRE_UDELADT).length
  tjek('alle kilderækker er enten i tabellen eller bevidst udeladt', iAlt === kildeKoder.length && kildeKoder.length === POSTNUMRE_KILDE.rækker,
    `tabel+udeladt=${iAlt}, kilde=${kildeKoder.length}`)
  tjek('kilde-postnumre bevaret som firecifrede strenge (inkl. foranstillet nul)',
    kildeKoder.every(k => /^\d{4}$/.test(k)) && kildeKoder.some(k => k.startsWith('0')))
  tjek('hver kilderække findes i tabellen ELLER i udeladt (ingen forsvundet)',
    kildeKoder.every(k => Object.hasOwn(POSTNUMRE_DK, k) || Object.hasOwn(POSTNUMRE_UDELADT, k)))
}

console.log('\n[Tabellens form]')
{
  const poster = Object.entries(POSTNUMRE_DK)
  tjek('nøgler er firecifrede strenge', poster.every(([k]) => /^\d{4}$/.test(k)))
  tjek('mindst 1.100 postnumre', poster.length >= 1100, `fik ${poster.length}`)
  tjek('stednavne er ikke tomme', poster.every(([, [n]]) => typeof n === 'string' && n.trim().length > 0))
  tjek('koordinater er tal inden for Danmark',
    poster.every(([, [, la, lo]]) => Number.isFinite(la) && Number.isFinite(lo) && la > 54.5 && la < 57.8 && lo > 8.0 && lo < 15.2))
  tjek('ingen postnummer både i tabel og udeladt', Object.keys(POSTNUMRE_UDELADT).every(k => !Object.hasOwn(POSTNUMRE_DK, k)))
}

console.log('\n[Dækning mod kontrolsættet (DAGI-postnumre)]')
{
  const linjer = readFileSync(join('data', 'kilder', 'dagi-postnumre-reference.csv'), 'utf8').split('\n').slice(1).filter(l => l.trim())
  const reference = linjer.map(l => { const [k, ...n] = l.split(';'); return [k, n.join(';')] as const })
  tjek('kontrolsættet har 589 geografiske postnumre', reference.length === 589, `fik ${reference.length}`)
  const mangler = reference.filter(([k]) => !findPostnummer(k)).map(([k]) => k)
  tjek('ALLE kontrolsættets postnumre kan slås op', mangler.length === 0, `mangler: ${mangler.join(', ')}`)
  const forskelle = reference.filter(([k, n]) => { const h = findPostnummer(k); return h && h.name !== n }).map(([k, n]) => `${k}: ${findPostnummer(k)?.name} ≠ ${n}`)
  tjek('stednavnet er det samme som i kontrolsættet', forskelle.length === 0, forskelle.slice(0, 5).join(' | '))
}

console.log('\n[Vigtigste byer — navn og omtrentligt punkt]')
{
  // [postnr, navn, bredde, længde] — forventet punkt = byens centrum, tolerance ±0,1° (~7-11 km)
  const byer: [string, string, number, number][] = [
    ['8220', 'Brabrand', 56.15, 10.11],
    ['8000', 'Aarhus C', 56.16, 10.21],
    ['1050', 'København K', 55.68, 12.59],
    ['2100', 'København Ø', 55.71, 12.58],
    ['2300', 'København S', 55.65, 12.60],
    ['2000', 'Frederiksberg', 55.68, 12.53],
    ['5000', 'Odense C', 55.40, 10.39],
    ['9000', 'Aalborg', 57.05, 9.92],
    ['6700', 'Esbjerg', 55.47, 8.45],
    ['4000', 'Roskilde', 55.64, 12.08],
    ['2800', 'Kongens Lyngby', 55.77, 12.50],
    ['6000', 'Kolding', 55.49, 9.47],
    ['7100', 'Vejle', 55.71, 9.54],
    ['8700', 'Horsens', 55.86, 9.85],
    ['3700', 'Rønne', 55.10, 14.70],
    ['9990', 'Skagen', 57.72, 10.58],
    ['9900', 'Frederikshavn', 57.44, 10.53],
    ['7400', 'Herning', 56.14, 8.98],
    ['8800', 'Viborg', 56.45, 9.40],
    ['4700', 'Næstved', 55.23, 11.76],
  ]
  for (const [nr, navn, la, lo] of byer) {
    const h = findPostnummer(nr)
    const ok = !!h && h.name === navn && h.postnr === nr && Math.abs(h.latitude - la) < 0.1 && Math.abs(h.longitude - lo) < 0.1
    tjek(`${nr} → ${navn}`, ok, h ? `fik ${h.name} (${h.latitude}, ${h.longitude})` : 'ikke fundet')
  }
}

console.log('\n[Ikke-geografiske og særlige postnumre → intet lokalt vejr]')
{
  for (const nr of ['0800', '0900', '0917', '0960', '0999', '1513']) {
    tjek(`${nr} kan ikke slås op`, findPostnummer(nr) === null)
    tjek(`${nr} står som udeladt med begrundelse`, typeof POSTNUMRE_UDELADT[nr] === 'string' && POSTNUMRE_UDELADT[nr].length > 10)
  }
  tjek('ingen postnummer i tabellen starter med 0', Object.keys(POSTNUMRE_DK).every(k => !k.startsWith('0')))
  tjek('ingen "Udland"/"Pakkecent"/"Centraltastning" i tabellen',
    Object.values(POSTNUMRE_DK).every(([n]) => !/udland|pakkecent|centraltastning/i.test(n)))
  // Storkunde-/postbokskoder i København/Frederiksberg (10xx-19xx) ligger ALLE i Storkøbenhavn.
  const kbh = Object.entries(POSTNUMRE_DK).filter(([k]) => k >= '1000' && k <= '1999')
  tjek('10xx-19xx ligger alle i Storkøbenhavn',
    kbh.length > 0 && kbh.every(([, [, la, lo]]) => la > 55.6 && la < 55.75 && lo > 12.4 && lo < 12.7))
  // Samme stednavn må ikke ligge langt fra hinanden (fanger fejl som 0900 København C ved Aalborg).
  const pr: Record<string, [number, number][]> = {}
  for (const [, [n, la, lo]] of Object.entries(POSTNUMRE_DK)) (pr[n] ??= []).push([la, lo])
  const spredte = Object.entries(pr).filter(([, v]) => v.length > 1 && (Math.max(...v.map(x => x[0])) - Math.min(...v.map(x => x[0])) > 0.35 || Math.max(...v.map(x => x[1])) - Math.min(...v.map(x => x[1])) > 0.6)).map(([n]) => n)
  tjek('samme stednavn ligger aldrig langt fra hinanden', spredte.length === 0, spredte.join(', '))
}

console.log('\n[Ugyldigt input]')
{
  for (const x of ['', '   ', 'abcd', '822', '82200', '8 220', '9999', '0000', '-8220', '8220.0', 'constructor', '__proto__', 'toString']) {
    tjek(`"${x}" → null`, findPostnummer(x) === null)
  }
  tjek('mellemrum omkring trimmes (" 8220 " → 8220)', findPostnummer(' 8220 ')?.postnr === '8220')
  tjek('tal (ikke streng) giver null i stedet for at kaste', findPostnummer(8220 as unknown as string) === null)
}

console.log('\n[Fejlmeddelelser: ugyldigt postnummer ≠ teknisk fejl]')
{
  const lokation = readFileSync('src/components/profil/location-setting.tsx', 'utf8')
  const onboarding = readFileSync('src/components/onboarding/onboarding-wizard.tsx', 'utf8')
  const formatTekst = 'Indtast et gyldigt dansk postnummer (4 cifre).'
  const ikkeFundetIndst = /Kunne ikke finde postnummer \$\{nr\}/
  const ikkeFundetOnb = 'Kunne ikke finde det postnummer.'
  tjek('teknisk fejl-tekst er ikke tom', POSTNR_TEKNISK_FEJL.trim().length > 20)
  tjek('teknisk fejl ligner ikke "ikke fundet"/"ugyldigt"', !/kunne ikke finde|gyldigt|tjek/i.test(POSTNR_TEKNISK_FEJL))
  tjek('Indstillinger: tre forskellige tekster (format / ikke fundet / teknisk)',
    lokation.includes(formatTekst) && ikkeFundetIndst.test(lokation) && lokation.includes('POSTNR_TEKNISK_FEJL'))
  tjek('Onboarding: tre forskellige tekster (format / ikke fundet / teknisk)',
    onboarding.includes(formatTekst) && onboarding.includes(ikkeFundetOnb) && onboarding.includes('POSTNR_TEKNISK_FEJL'))
  tjek('Indstillinger: serverkaldet er i try/catch', /try\s*\{\s*hit = await lookupPostnummer\(nr\)\s*\}\s*catch/.test(lokation))
  tjek('Onboarding: serverkaldet er i try/catch', /try\s*\{\s*hit = await lookupPostnummer\(postnr\.trim\(\)\)\s*\}\s*catch/.test(onboarding))
  tjek('begge steder vises kreditering af GeoNames', lokation.includes('<PostnrKreditering') && onboarding.includes('<PostnrKreditering'))
  tjek('privatlivssiden krediterer GeoNames', readFileSync('src/app/privatliv/page.tsx', 'utf8').includes('<PostnrKreditering'))
  const kred = readFileSync('src/components/profil/postnr-kreditering.tsx', 'utf8')
  tjek('krediteringen nævner GeoNames, CC BY 4.0, licenslink og ændringer',
    kred.includes('GeoNames') && kred.includes('CC BY 4.0') && kred.includes('creativecommons.org/licenses/by/4.0') && /tilpasset/.test(kred))
}

console.log('\n[Arkitektur: signatur, ingen netværk, ikke i klient-bundlen, vejr urørt]')
{
  const weather = readFileSync('src/actions/weather.ts', 'utf8')
  tjek('lookupPostnummer har uændret signatur',
    /export async function lookupPostnummer\(postnr: string\): Promise<LocationHit \| null>/.test(weather))
  const start = weather.indexOf('export async function lookupPostnummer')
  const krop = weather.slice(start, weather.indexOf('\n}\n', start))
  tjek('lookupPostnummer bruger hverken fetch, DAWA eller Open-Meteo', !/fetch\(|dataforsyningen|open-meteo|geocoding/i.test(krop), krop)
  tjek('DAWA nævnes ikke længere som kilde i koden', !/api\.dataforsyningen\.dk/.test(weather))
  tjek('LocationHit-interfacet er uændret',
    /export interface LocationHit \{\s*name: string\s*latitude: number\s*longitude: number\s*\/\*\* Postnummer \(4 cifre\) \*\/\s*postnr: string\s*\}/.test(weather))
  tjek('vejr-integrationen (Open-Meteo) er stadig i weather.ts', /api\.open-meteo\.com/.test(weather))

  function srcFiler(dir = 'src'): string[] {
    const ud: string[] = []
    for (const navn of readdirSync(dir)) {
      const sti = join(dir, navn)
      if (statSync(sti).isDirectory()) { ud.push(...srcFiler(sti)) }
      else if (/\.tsx?$/.test(navn)) ud.push(sti)
    }
    return ud
  }
  const klientSomImportererTabel = srcFiler().filter(f => {
    const t = readFileSync(f, 'utf8')
    return /^\s*['"]use client['"]/.test(t) && /postnumre-dk\.generated|@\/lib\/postnummer['"]/.test(t)
  })
  tjek('ingen \'use client\'-fil importerer tabellen eller @/lib/postnummer', klientSomImportererTabel.length === 0, klientSomImportererTabel.join(', '))
  const importer = srcFiler().filter(f => /postnumre-dk\.generated/.test(readFileSync(f, 'utf8')) && !f.endsWith('postnumre-dk.generated.ts'))
  tjek('kun src/lib/postnummer.ts importerer tabellen', importer.length === 1 && importer[0].endsWith(join('lib', 'postnummer.ts')), importer.join(', '))
}

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
