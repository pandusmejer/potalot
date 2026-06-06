/**
 * check-images — audit af image-pipelinen.
 *
 * Kør med:
 *   npm run check:images
 *
 * Steps:
 *   1. Regenerér image-manifest.generated.ts (sandhed om disken)
 *   2. Indlæs IMPORTED_GUIDES + GUIDE_IMAGES_BY_ID
 *   3. Rapportér:
 *      A. Guides uden primaryImageId
 *      B. Sortsguider hvor frokort/plantekort/asset-convention mangler
 *      C. guide-images.ts entries der peger på filer der ikke findes
 *      D. Billedfiler på disken der ikke matches af nogen guide
 *
 * Exit-kode 1 hvis nogen kategori har issues (gør den brugbar i CI).
 */

import { scanImages, writeManifest } from './scan-images'

async function main() {
  // ── Step 1: regenerér manifest ──────────────────────────────
  const allPaths = scanImages()
  writeManifest(allPaths)
  const manifest = new Set(allPaths)
  console.log(`✓ Scannet ${allPaths.length} billeder under public/images/`)
  console.log('')

  // ── Step 2: indlæs guide-data (dynamisk så manifest-genereringen
  //    sker først; også for at undgå Next.js' tsx-pipeline) ──────
  const guidesImported = await import('../src/data/guides-imported')
  const guideImages = await import('../src/data/guide-images')

  const IMPORTED_GUIDES = guidesImported.IMPORTED_GUIDES as Array<{
    id: string
    plantName: string
    variety?: string | null
    guideLevel: 'species' | 'variety'
    primaryImageId?: string | null
  }>
  const GUIDE_IMAGES_BY_ID = guideImages.GUIDE_IMAGES_BY_ID as Record<
    string,
    { hero?: string; seedCard?: string; macro?: Array<{ src: string }> }
  >

  let totalIssues = 0
  const usedPaths = new Set<string>()

  // ── A. Guides uden primaryImageId ───────────────────────────
  console.log('A. Guides uden primaryImageId')
  const missingPrimary = IMPORTED_GUIDES.filter((g) => !g.primaryImageId)
  if (missingPrimary.length === 0) {
    console.log('   ✓ alle guides har primaryImageId')
  } else {
    for (const g of missingPrimary) {
      const role = g.guideLevel === 'species' ? 'arts' : 'plantekort'
      console.log(`   ⚠ ${g.id} (mangler ${role}/${g.id}.{jpg,png})`)
      totalIssues++
    }
  }
  for (const g of IMPORTED_GUIDES) {
    if (g.primaryImageId) usedPaths.add(g.primaryImageId)
  }
  console.log('')

  // ── B. Sortsguider hvor frokort/plantekort mangler ──────────
  console.log('B. Sortsguider: assets pr. asset-convention')
  const sortsguider = IMPORTED_GUIDES.filter((g) => g.guideLevel === 'variety')
  for (const g of sortsguider) {
    const frokort = [
      `/images/frokort/${g.id}.png`,
      `/images/frokort/${g.id}.jpg`,
    ]
    const plantekort = [
      `/images/plantekort/${g.id}.jpg`,
      `/images/plantekort/${g.id}.png`,
    ]
    const hasFro = frokort.some((p) => manifest.has(p))
    const hasPlante = plantekort.some((p) => manifest.has(p))
    if (!hasFro || !hasPlante) {
      console.log(
        `   ⚠ ${g.id}: ${[
          !hasFro && 'frokort mangler',
          !hasPlante && 'plantekort mangler',
        ]
          .filter(Boolean)
          .join(', ')}`,
      )
      totalIssues++
    }
    // Spor de fundne
    for (const p of [...frokort, ...plantekort]) {
      if (manifest.has(p)) usedPaths.add(p)
    }
  }
  if (totalIssues === 0) console.log('   ✓ alle sortsguider har frokort + plantekort')
  console.log('')

  // ── C. guide-images.ts peger på ikke-eksisterende filer ─────
  console.log('C. guide-images.ts entries med brudte filer')
  let brokenInImages = 0
  for (const [guideId, entry] of Object.entries(GUIDE_IMAGES_BY_ID)) {
    if (entry.hero) {
      if (manifest.has(entry.hero)) usedPaths.add(entry.hero)
      else {
        console.log(`   ⚠ ${guideId} hero → ${entry.hero}`)
        brokenInImages++
      }
    }
    if (entry.seedCard) {
      if (manifest.has(entry.seedCard)) usedPaths.add(entry.seedCard)
      else {
        console.log(`   ⚠ ${guideId} seedCard → ${entry.seedCard}`)
        brokenInImages++
      }
    }
    if (entry.macro) {
      for (const m of entry.macro) {
        if (manifest.has(m.src)) usedPaths.add(m.src)
        else {
          console.log(`   ⚠ ${guideId} macro → ${m.src}`)
          brokenInImages++
        }
      }
    }
  }
  if (brokenInImages === 0) console.log('   ✓ ingen brudte referencer')
  totalIssues += brokenInImages
  console.log('')

  // ── D. Filer på disken der ikke bruges af nogen guide ───────
  console.log('D. Ubrugte billedfiler (kun arts/plantekort/frokort/makro)')
  const tracked = allPaths.filter(
    (p) =>
      p.startsWith('/images/arts/') ||
      p.startsWith('/images/plantekort/') ||
      p.startsWith('/images/frokort/') ||
      p.startsWith('/images/makro/'),
  )
  const unused = tracked.filter((p) => !usedPaths.has(p))
  if (unused.length === 0) {
    console.log('   ✓ ingen ubrugte filer i disse mapper')
  } else {
    for (const p of unused) console.log(`   ⚠ ${p}`)
    // Ubrugte er info, ikke fejl — tæller ikke som issues
  }
  console.log('')

  // ── Summary ─────────────────────────────────────────────────
  console.log('─────────────────────────────────────────')
  if (totalIssues === 0) {
    console.log('✓ Image-pipeline er ren')
  } else {
    console.log(`✗ ${totalIssues} issue(s) fundet i kategori A–C`)
  }
  if (unused.length > 0) {
    console.log(`ℹ ${unused.length} ubrugte fil(er) i tracked mapper (kun info)`)
  }
  process.exit(totalIssues > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('check-images failed:', err)
  process.exit(2)
})
