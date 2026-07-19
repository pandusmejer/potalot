/**
 * guides:intake — ét greb fra dropzone til live Potalot-guides.
 *
 *   npm run guides:intake             (kør hele den sikre kæde)
 *   npm run guides:intake -- --dry-run   (vis hvad der ville ske, skriv intet)
 *   npm run guides:intake -- --update tomat   (tillad OGSÅ at røre én live guide)
 *
 * Læg guide-JSON (eller en .zip) i _guide-indbakke/ og fotos i _foto-indbakke/
 * (navngivet efter guiden). Så gør intake resten:
 *
 *   1. udpakker evt. zip, samler JSON, klassificerer NEW vs UPDATE
 *      → KUN NEW behandles som standard (UPDATE springes over med advarsel;
 *        kræver eksplicit --update <slug>). Dræber kalibrerings-fælden.
 *   2. build → guard-tjekket promote → validate → import → mark imported
 *   3. matcher fotos til guides og placerer dem efter NIVEAU
 *      (art → arts/ · sort → plantekort/) med guidens EGEN slug
 *   4. master-sync → DB (så guiderne auto-kobles ved oprettelse)
 *   5. arkiverer placerede foto-originaler (→ _foto-arkiv/, slettes ALDRIG),
 *      rydder guide-indbakken, og rapporterer: oprettet / sprunget over / fotos / fejl
 *
 * Reglen "folder = guidens niveau" + "slug = guidens egen slug" fjerner de tre
 * manuelle foto-fælder (apostrof, fejlnavn, forkert mappe) én gang for alle.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, renameSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { execSync } from 'node:child_process'
import sharp from 'sharp'
import {
  normalizeName, folderForLevel, classify, matchPhotoToGuide, promoteOrder,
  type GuideMeta,
} from './intake-core'

const GUIDE_INBOX = '_guide-indbakke'
const PHOTO_INBOX = '_foto-indbakke'
const PHOTO_ARCHIVE = '_foto-arkiv'
const GENERATED = 'content/guide-production/generated'
const LIVE = 'content/guides'
const IMG_ROOT = 'public/images'
const MAXDIM = 1800
const JPG_Q = 82

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const updateSlugs = new Set(
  args.flatMap((a, i) => (a === '--update' ? [args[i + 1]] : [])).filter(Boolean),
)

const log = (s = '') => console.log(s)
function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

// ── indsamling ────────────────────────────────────────────────────

function collectJsonFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.json')) out.push(p)
    }
  }
  if (existsSync(dir)) walk(dir)
  return out
}

function readMeta(path: string): GuideMeta | null {
  try {
    const d = JSON.parse(readFileSync(path, 'utf8'))
    if (!d.slug || !d.guideLevel || !d.plantName) return null
    return {
      slug: d.slug, guideLevel: d.guideLevel, parentSlug: d.parentSlug ?? null,
      plantName: d.plantName, variety: d.variety ?? null,
    }
  } catch {
    return null
  }
}

function liveSlugSet(): Set<string> {
  if (!existsSync(LIVE)) return new Set()
  return new Set(readdirSync(LIVE).filter(f => f.endsWith('.md')).map(f => basename(f, '.md')))
}

// ── foto-placering (bruger guidens EGEN slug — ingen slug-gæt) ─────

async function placePhoto(src: string, folder: 'arts' | 'plantekort', slug: string): Promise<string> {
  const img = sharp(src, { failOn: 'none' }).rotate()
  const meta = await img.metadata()
  let pipe = img
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0)
  if (longest > MAXDIM) {
    pipe = pipe.resize({
      width: (meta.width ?? 0) >= (meta.height ?? 0) ? MAXDIM : undefined,
      height: (meta.height ?? 0) > (meta.width ?? 0) ? MAXDIM : undefined,
      withoutEnlargement: true,
    })
  }
  const dir = join(IMG_ROOT, folder)
  mkdirSync(dir, { recursive: true })
  const target = join(dir, `${slug}.jpg`)
  const buf = await pipe.flatten({ background: '#ffffff' }).jpeg({ quality: JPG_Q, mozjpeg: true }).toBuffer()
  writeFileSync(target, buf)
  return `/images/${folder}/${slug}.jpg`
}

function inboxPhotos(): string[] {
  if (!existsSync(PHOTO_INBOX)) return []
  return readdirSync(PHOTO_INBOX)
    .filter(f => /\.(jpe?g|png|heic|webp)$/i.test(f))
    .map(f => join(PHOTO_INBOX, f))
}

// ── main ──────────────────────────────────────────────────────────

async function main() {
  mkdirSync(GUIDE_INBOX, { recursive: true })

  // 1. udpak zip'er i guide-indbakken
  if (!dryRun) {
    for (const f of readdirSync(GUIDE_INBOX).filter(f => f.endsWith('.zip'))) {
      const zip = join(GUIDE_INBOX, f)
      try { run(`unzip -o -q "${zip}" -d "${GUIDE_INBOX}"`); rmSync(zip) }
      catch (e) { log(`⚠ kunne ikke udpakke ${f}: ${e instanceof Error ? e.message : e}`) }
    }
  }

  // 2. saml + klassificér
  const files = collectJsonFiles(GUIDE_INBOX)
  const metas: Array<{ meta: GuideMeta; path: string }> = []
  const seen = new Set<string>()
  for (const p of files) {
    const m = readMeta(p)
    if (!m) { log(`⚠ ugyldig JSON sprunget over: ${p}`); continue }
    if (seen.has(m.slug)) continue
    seen.add(m.slug)
    metas.push({ meta: m, path: p })
  }

  if (metas.length === 0) {
    log(`\nIngen guide-JSON i ${GUIDE_INBOX}/ — læg filer (eller en .zip) der først.\n`)
    return
  }

  const live = liveSlugSet()
  const toProcess: GuideMeta[] = []
  const skipped: GuideMeta[] = []
  for (const { meta } of metas) {
    const cls = classify(meta.slug, live)
    if (cls === 'new' || updateSlugs.has(meta.slug)) toProcess.push(meta)
    else skipped.push(meta)
  }

  log(`\n🌱 guides:intake${dryRun ? ' (DRY-RUN — skriver intet)' : ''}`)
  log(`   fundet: ${metas.length} guide(s) i ${GUIDE_INBOX}/`)
  log(`   behandles (NEW${updateSlugs.size ? ' + valgte UPDATE' : ''}): ${toProcess.map(g => g.slug).join(', ') || '—'}`)
  if (skipped.length) log(`   ⏭️  sprunget over (UPDATE af godkendt guide): ${skipped.map(g => g.slug).join(', ')}  (brug --update <slug> for at røre en)`)

  // 3. foto-matchning (rapporteres altid; placeres kun i rigtig kørsel)
  const photos = inboxPhotos()
  const photoPlan: Array<{ src: string; guide: GuideMeta; folder: 'arts' | 'plantekort' }> = []
  const photoUnmatched: string[] = []
  const photoAmbiguous: string[] = []
  for (const src of photos) {
    const m = matchPhotoToGuide(basename(src), toProcess)
    if (m.kind === 'match') photoPlan.push({ src, guide: m.guide, folder: folderForLevel(m.guide.guideLevel) })
    else if (m.kind === 'ambiguous') photoAmbiguous.push(`${basename(src)} → ${m.guides.map(g => g.slug).join(' / ')}`)
    else photoUnmatched.push(basename(src))
  }
  if (photos.length) {
    log(`\n📷 fotos i ${PHOTO_INBOX}/:`)
    for (const p of photoPlan) log(`   ✓ ${basename(p.src)} → ${IMG_ROOT}/${p.folder}/${p.guide.slug}.jpg`)
    for (const a of photoAmbiguous) log(`   ⚠ FLERTYDIG (placeres ikke): ${a}`)
    for (const u of photoUnmatched) log(`   ⚠ UMATCHET (bliver i indbakken): ${u}`)
  }

  if (dryRun) {
    log(`\n👉 Dry-run. Kør uden --dry-run for at anvende.\n`)
    return
  }

  if (toProcess.length === 0) {
    log(`\nIntet at behandle (alt var UPDATE). Ingen ændringer.\n`)
    return
  }

  // 4. JSON → generated/ (kun det der behandles)
  for (const g of toProcess) {
    const srcPath = metas.find(m => m.meta.slug === g.slug)!.path
    writeFileSync(join(GENERATED, `${g.slug}.json`), readFileSync(srcPath, 'utf8'))
  }

  // 5. build → promote (guard) i forælder-før-barn-orden
  run('npm run guides:build')
  const created: string[] = []
  const blocked: string[] = []
  for (const g of promoteOrder(toProcess)) {
    try {
      run(`npm run guides:promote ${g.slug}`)
      created.push(g.slug)
    } catch {
      blocked.push(g.slug) // guarden blokerede (kun muligt ved --update med tab)
    }
  }

  // 6. placér fotos (guidens slug, niveau-bestemt mappe) — kun for promoveret
  const placed: string[] = []
  for (const p of photoPlan) {
    if (!created.includes(p.guide.slug)) continue
    await placePhoto(p.src, p.folder, p.guide.slug)
    // Arkivér originalen (flyt, slet ALDRIG) — den komprimerede jpg i
    // public/images/ er det appen bruger; høj-opløst master bevares her.
    mkdirSync(PHOTO_ARCHIVE, { recursive: true })
    renameSync(p.src, join(PHOTO_ARCHIVE, basename(p.src)))
    placed.push(`${p.guide.slug} (${p.folder})`)
  }
  if (placed.length) run('npm run scan:images')

  // 7. validate → import → mark → sync
  run('npm run guides:validate')
  run('npm run import:guides')
  for (const slug of created) run(`npm run guides:mark ${slug} imported`)
  const syncOut = run('npm run guides:sync-master')

  // 8. ryd behandlede JSON fra guide-indbakken (skipped/umatchede bliver)
  for (const g of toProcess) {
    const p = metas.find(m => m.meta.slug === g.slug)!.path
    if (existsSync(p) && p.startsWith(GUIDE_INBOX)) rmSync(p)
  }

  // 9. rapport
  log(`\n${'─'.repeat(52)}`)
  log(`✅ intake færdig`)
  log(`   oprettet:        ${created.length}  ${created.join(', ')}`)
  if (blocked.length) log(`   ⛔ blokeret:      ${blocked.length}  ${blocked.join(', ')}  (regressions-guard)`)
  if (skipped.length) log(`   ⏭️  sprunget over:  ${skipped.length}  ${skipped.map(g => g.slug).join(', ')}`)
  log(`   fotos placeret:  ${placed.length}  ${placed.join(', ')}${placed.length ? `  (originaler → ${PHOTO_ARCHIVE}/)` : ''}`)
  if (photoUnmatched.length) log(`   📷 uden match:    ${photoUnmatched.join(', ')}  (bliver i ${PHOTO_INBOX}/)`)
  const syncLine = syncOut.split('\n').find(l => l.includes('create:')) ?? ''
  if (syncLine) log(`   master-sync:    ${syncLine.trim()}`)
  log(`${'─'.repeat(52)}`)
  log(`Næste: gennemse i preview, så push + PR mod main.\n`)
}

main().catch(e => { console.error(`\n❌ ${e instanceof Error ? e.message : e}\n`); process.exit(1) })
