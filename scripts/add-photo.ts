/**
 * add:photo — læg et nyt plante-/frøbanks-/artsbillede ind i appen på én gang.
 *
 * Den:
 *   1. danner filnavnet ("slug") ud fra art (+ sort) med de danske regler
 *   2. nedskalerer + komprimerer billedet (≤1800px, q82) — så intet 6MB-foto
 *      slipper ind
 *   3. lægger det i den rigtige mappe (plantekort / frokort / arts)
 *   4. regenererer billede-manifestet, så resolveren kan bruge filen
 *
 * Brug:
 *   npm run add:photo <fil> <plantekort|frokort|arts> "<Art>" ["<Sort>"]
 *
 * Eksempler:
 *   npm run add:photo ~/Desktop/tomat.jpg plantekort "Tomat" "San Marzano"
 *   npm run add:photo ~/Desktop/chili.png frokort   "Chili" "Jalapeño"
 *   npm run add:photo ~/Desktop/aert.jpg  arts      "Ært"
 */

import sharp from 'sharp'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const MAXDIM = 1800
const JPG_Q = 82
const KINDS = ['plantekort', 'frokort', 'arts'] as const
type Kind = (typeof KINDS)[number]

/** Samme slug-regler som appen (resolvePotalotImage / plant-card). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n`)
  process.exit(1)
}

const USAGE = `Brug:  npm run add:photo <fil> <plantekort|frokort|arts> "<Art>" ["<Sort>"]

  plantekort  → foto af planten (Mine planter / plantekort-hero)
  frokort     → frøbanks-/frøkort-billede
  arts        → billede af hele arten (kun art-navn, ingen sort)

Eksempler:
  npm run add:photo ~/Desktop/tomat.jpg plantekort "Tomat" "San Marzano"
  npm run add:photo ~/Desktop/chili.png frokort   "Chili" "Jalapeño"
  npm run add:photo ~/Desktop/aert.jpg  arts      "Ært"`

const [, , src, kind, name, variety] = process.argv

if (!src || !kind || !name) fail(USAGE)
if (!KINDS.includes(kind as Kind)) fail(`Ukendt type "${kind}".\n${USAGE}`)
if (!existsSync(src)) fail(`Filen findes ikke: ${src}`)

const slug = kind === 'arts'
  ? slugify(name)
  : slugify(variety ? `${name}-${variety}` : name)
if (!slug) fail('Kunne ikke danne et gyldigt slug af navnet.')

async function run() {
  const img = sharp(src, { failOn: 'none' }).rotate() // bag EXIF-orientering ind
  const meta = await img.metadata()
  if (!meta.width || !meta.height) fail('Kunne ikke læse billedets dimensioner — er det et gyldigt billede?')

  // Ægte transparens? (alpha-kanal der faktisk bruges). Kun frøkort beholder PNG.
  const stats = await sharp(src, { failOn: 'none' }).stats().catch(() => null)
  const realAlpha = !!meta.hasAlpha && !(stats?.isOpaque ?? true)
  const usePng = kind === 'frokort' && realAlpha
  const ext = usePng ? '.png' : '.jpg'

  let pipe = img
  const longest = Math.max(meta.width, meta.height)
  if (longest > MAXDIM) {
    pipe = pipe.resize({
      width: meta.width >= meta.height ? MAXDIM : undefined,
      height: meta.height > meta.width ? MAXDIM : undefined,
      withoutEnlargement: true,
    })
  }
  pipe = usePng
    ? pipe.png({ compressionLevel: 9, effort: 10 })
    : pipe.flatten({ background: '#ffffff' }).jpeg({ quality: JPG_Q, mozjpeg: true })

  const dir = join('public', 'images', kind)
  mkdirSync(dir, { recursive: true })
  const target = join(dir, `${slug}${ext}`)
  const existed = existsSync(target)

  const buf = await pipe.toBuffer()
  writeFileSync(target, buf)

  const origKB = Math.round(statSync(src).size / 1024)
  console.log(`\n✓ ${existed ? 'Erstattet' : 'Lagt ind'}: /images/${kind}/${slug}${ext}`)
  console.log(`  ${origKB} KB → ${Math.round(buf.length / 1024)} KB   (${meta.width}×${meta.height}px → maks ${MAXDIM}px, ${usePng ? 'png m. transparens' : 'jpg'})`)

  console.log('\n→ regenererer billede-manifest…')
  execSync('npx tsx scripts/scan-images.ts', { stdio: 'inherit' })

  console.log(`\nFærdig ✅  slug: "${slug}"`)
  console.log('Husk: git add -A && commit + push + merge for at få det live.\n')
}

run().catch(e => fail(e instanceof Error ? e.message : String(e)))
