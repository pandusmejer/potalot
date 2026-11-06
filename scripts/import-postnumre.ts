/**
 * Potalot postnummer-importer (GeoNames → lokal, versioneret tabel).
 *
 *   Læser   data/kilder/geonames-dk/DK.txt        (committet kildefil)
 *   Skriver src/data/postnumre-dk.generated.ts    (AUTO-GENERERET)
 *
 * Kør med:
 *   npx tsx scripts/import-postnumre.ts            # byg tabellen af den committede kildefil
 *   npx tsx scripts/import-postnumre.ts --hent     # hent NY version fra GeoNames, opdatér
 *                                                  # kildefil + KILDE.json, byg derefter
 *   npx tsx scripts/import-postnumre.ts --lav-reference <postnumre.geojson>
 *                                                  # byg data/kilder/dagi-postnumre-reference.csv
 *                                                  # (kontrolsæt til dækningstesten; se README)
 *
 * Hvorfor lokal tabel: DAWA er lukket (HTTP 410), og alternativerne kræver
 * nøgle, kvote eller har ikke-kommercielle vilkår. Tabellen har ingen
 * kørselsafhængighed — se data/kilder/geonames-dk/README.md.
 *
 * Reproducerbart: kildefilens sha256 står i KILDE.json OG i den genererede
 * fil, og scripts/test-postnummer.ts fejler hvis de ikke passer til hinanden.
 *
 * Ingen eksterne deps. --hent bruger curl + unzip (findes på macOS/Linux).
 * Den genererede fil må ALDRIG merges på tværs af branches — regenerér.
 */

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const KILDE_MAPPE = join('data', 'kilder', 'geonames-dk')
const KILDE_TXT = join(KILDE_MAPPE, 'DK.txt')
const KILDE_README = join(KILDE_MAPPE, 'readme.txt')
const KILDE_META = join(KILDE_MAPPE, 'KILDE.json')
const REFERENCE_CSV = join('data', 'kilder', 'dagi-postnumre-reference.csv')
const UD = join('src', 'data', 'postnumre-dk.generated.ts')
const GEONAMES_URL = 'https://download.geonames.org/export/zip/DK.zip'

/** Grov afgrænsning af Danmark (inkl. Bornholm og Anholt). Alt udenfor er en datafejl. */
const DK_BBOX = { latMin: 54.5, latMax: 57.8, lonMin: 8.0, lonMax: 15.2 }

type Udeladt = { grund: string }

/**
 * Postnumre der IKKE må give en lokal vejrudsigt. De er enten interne
 * postkoder uden bopæl, eller (verificeret 6/11 2026) har koordinater der
 * ikke passer til navnet: 0900 "København C" ligger ved Aalborg, 0999
 * "København C" ved Frederikshavn og 0960 "Udland" i Midtjylland.
 */
function erIkkeGeografisk(kode: string, navn: string): Udeladt | null {
  if (kode.startsWith('0')) return { grund: 'Intern postkode (0xxx) uden bopæl — koordinaten svarer ikke til stedet' }
  if (/^udland$/i.test(navn)) return { grund: 'Udland — intet sted i Danmark' }
  if (/pakkecent/i.test(navn)) return { grund: 'Pakkecenter — ikke et sted at bo' }
  if (/centraltastning/i.test(navn)) return { grund: 'Centraltastning — postens dataindtastning, ikke en bopælsadresse' }
  return null
}

function sha256(buf: Buffer | string): string {
  return createHash('sha256').update(buf).digest('hex')
}

function fejl(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

// ─────────────────────────────────────────────────────────────────
// --hent: hent ny GeoNames-version
// ─────────────────────────────────────────────────────────────────

function hent() {
  mkdirSync(KILDE_MAPPE, { recursive: true })
  const tmp = join(KILDE_MAPPE, '.hent-tmp')
  rmSync(tmp, { recursive: true, force: true })
  mkdirSync(tmp, { recursive: true })
  const zip = join(tmp, 'DK.zip')

  const head = execFileSync('curl', ['-sIL', '-m', '30', GEONAMES_URL], { encoding: 'utf8' })
  const lm = head.match(/^last-modified:\s*(.+)$/im)?.[1]?.trim() ?? null

  execFileSync('curl', ['-sSf', '-m', '60', '-o', zip, GEONAMES_URL])
  execFileSync('unzip', ['-o', '-q', zip, 'DK.txt', 'readme.txt', '-d', tmp])

  const txt = readFileSync(join(tmp, 'DK.txt'))
  const readme = readFileSync(join(tmp, 'readme.txt'))
  writeFileSync(KILDE_TXT, txt)
  writeFileSync(KILDE_README, readme)
  const meta = {
    kilde: 'GeoNames postal codes — Danmark',
    url: GEONAMES_URL,
    licens: 'Creative Commons Attribution 4.0 (CC BY 4.0)',
    licensUrl: 'https://creativecommons.org/licenses/by/4.0/',
    hentetDato: new Date().toISOString().slice(0, 10),
    serverLastModified: lm,
    sha256: sha256(txt),
    rækker: txt.toString('utf8').split('\n').filter(l => l.trim()).length,
  }
  writeFileSync(KILDE_META, JSON.stringify(meta, null, 2) + '\n')
  rmSync(tmp, { recursive: true, force: true })
  console.log(`↓ Hentet ${GEONAMES_URL} (last-modified: ${lm ?? 'ukendt'}) → ${KILDE_TXT}`)
}

// ─────────────────────────────────────────────────────────────────
// --lav-reference: kontrolsæt fra DAGI-polygoner (tredjeparts-kopi)
// ─────────────────────────────────────────────────────────────────

function lavReference(geojsonSti: string) {
  if (!existsSync(geojsonSti)) fejl(`Findes ikke: ${geojsonSti}`)
  const raw = readFileSync(geojsonSti)
  const d = JSON.parse(raw.toString('utf8')) as {
    features: { properties: { POSTNR_TXT: string; POSTBYNAVN: string } }[]
  }
  const map = new Map<string, string>()
  for (const f of d.features) {
    const kode = f.properties.POSTNR_TXT
    if (!/^\d{4}$/.test(kode)) continue // intervaller som "1000-1499" er ikke koder
    map.set(kode, f.properties.POSTBYNAVN)
  }
  const linjer = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, n]) => `${k};${n}`)
  writeFileSync(REFERENCE_CSV, 'postnr;navn\n' + linjer.join('\n') + '\n')
  console.log(`✓ ${linjer.length} geografiske postnumre → ${REFERENCE_CSV}  (kilde-sha256 ${sha256(raw)})`)
}

// ─────────────────────────────────────────────────────────────────
// Byg tabellen
// ─────────────────────────────────────────────────────────────────

function byg() {
  if (!existsSync(KILDE_TXT) || !existsSync(KILDE_META)) {
    fejl(`Mangler ${KILDE_TXT} / ${KILDE_META}. Kør med --hent.`)
  }
  const buf = readFileSync(KILDE_TXT)
  const meta = JSON.parse(readFileSync(KILDE_META, 'utf8')) as {
    hentetDato: string; serverLastModified: string | null; sha256: string; url: string
  }
  const hash = sha256(buf)
  if (hash !== meta.sha256) fejl(`KILDE.json passer ikke til DK.txt (sha256 ${hash} ≠ ${meta.sha256}). Kør med --hent.`)

  const poster = new Map<string, [string, number, number]>()
  const udeladt = new Map<string, string>()
  const linjer = buf.toString('utf8').split('\n').filter(l => l.trim())

  for (const [i, l] of linjer.entries()) {
    const c = l.split('\t')
    const nr = i + 1
    if (c.length < 11) fejl(`Linje ${nr}: forventede mindst 11 kolonner, fik ${c.length}`)
    if (c[0] !== 'DK') fejl(`Linje ${nr}: landekode ${c[0]} ≠ DK`)
    const kode = c[1]
    const navn = c[2].trim()
    // Postnummer er ALTID en firecifret STRENG — "0800" må aldrig blive til tallet 800.
    if (!/^\d{4}$/.test(kode)) fejl(`Linje ${nr}: ugyldigt postnummer "${kode}"`)
    if (!navn) fejl(`Linje ${nr}: tomt stednavn for ${kode}`)
    const lat = Number(c[9])
    const lon = Number(c[10])
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) fejl(`Linje ${nr}: koordinater er ikke tal (${c[9]}, ${c[10]})`)
    if (lat < DK_BBOX.latMin || lat > DK_BBOX.latMax || lon < DK_BBOX.lonMin || lon > DK_BBOX.lonMax) {
      fejl(`Linje ${nr}: ${kode} ${navn} ligger udenfor Danmark (${lat}, ${lon})`)
    }
    if (poster.has(kode) || udeladt.has(kode)) fejl(`Linje ${nr}: dublet af ${kode}`)

    const ud = erIkkeGeografisk(kode, navn)
    if (ud) { udeladt.set(kode, `${navn} — ${ud.grund}`); continue }
    poster.set(kode, [navn, lat, lon])
  }

  const sorteret = [...poster.entries()].sort(([a], [b]) => a.localeCompare(b))
  const udSorteret = [...udeladt.entries()].sort(([a], [b]) => a.localeCompare(b))

  const tabel = sorteret
    .map(([k, [n, la, lo]]) => `  ${JSON.stringify(k)}: [${JSON.stringify(n)}, ${la}, ${lo}],`)
    .join('\n')
  const udTabel = udSorteret.map(([k, g]) => `  ${JSON.stringify(k)}: ${JSON.stringify(g)},`).join('\n')

  const ts = `/**
 * AUTO-GENERERET — rør ikke direkte.
 *
 * Genereret af scripts/import-postnumre.ts fra data/kilder/geonames-dk/DK.txt.
 * Regenerér med 'npx tsx scripts/import-postnumre.ts' (eller '--hent' for ny
 * version fra GeoNames). Merges ALDRIG på tværs af branches.
 *
 * KILDE:   GeoNames postal codes — Danmark (https://www.geonames.org/)
 * LICENS:  Creative Commons Attribution 4.0 (CC BY 4.0)
 *          https://creativecommons.org/licenses/by/4.0/
 * ÆNDRET:  udvalgt (kun DK-postnumre), omformateret til [navn, bredde, længde],
 *          og ${udSorteret.length} ikke-geografiske postnumre er udeladt (se POSTNUMRE_UDELADT).
 * HENTET:  ${meta.hentetDato}  (GeoNames last-modified: ${meta.serverLastModified ?? 'ukendt'})
 * SHA-256: ${meta.sha256}  (af DK.txt)
 * ANTAL:   ${sorteret.length} postnumre i tabellen + ${udSorteret.length} udeladt = ${linjer.length} kilderækker
 *
 * ⚠️ SERVER-ONLY. Filen er ~${Math.round(tabel.length / 1024)} kB — importér den ALDRIG fra klientkode
 * (kun via src/lib/postnummer.ts fra en server action).
 *
 * Nøglerne er firecifrede STRENGE ("0800" ≠ 800). Værdi: [stednavn, bredde, længde].
 */

export type PostnummerRække = readonly [navn: string, latitude: number, longitude: number]

export const POSTNUMRE_KILDE = {
  kilde: 'GeoNames',
  url: ${JSON.stringify(meta.url)},
  licens: 'CC BY 4.0',
  hentetDato: ${JSON.stringify(meta.hentetDato)},
  serverLastModified: ${JSON.stringify(meta.serverLastModified)},
  sha256: ${JSON.stringify(meta.sha256)},
  rækker: ${linjer.length},
} as const

export const POSTNUMRE_DK: Readonly<Record<string, PostnummerRække>> = {
${tabel}
}

/**
 * Postnumre der med vilje IKKE kan slås op, fordi de ikke svarer til et sted
 * man har en have — og fordi nogle af dem har koordinater, der ville give en
 * vejrudsigt for en helt anden landsdel.
 */
export const POSTNUMRE_UDELADT: Readonly<Record<string, string>> = {
${udTabel}
}
`
  writeFileSync(UD, ts)
  console.log(`✓ ${sorteret.length} postnumre + ${udSorteret.length} udeladt (${linjer.length} kilderækker, sha256 ${meta.sha256.slice(0, 12)}…) → ${UD}`)
  for (const [k, g] of udSorteret) console.log(`  udeladt ${k}: ${g}`)
}

// ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const refIdx = args.indexOf('--lav-reference')
if (refIdx >= 0) {
  const sti = args[refIdx + 1]
  if (!sti) fejl('--lav-reference kræver en sti til postnumre.geojson')
  lavReference(sti)
} else {
  if (args.includes('--hent')) hent()
  byg()
}
