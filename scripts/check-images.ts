/**
 * check-images — audit af image-pipelinen.
 *
 * Kør med:
 *   npm run check:images
 *
 * Steps:
 *   1. Regenerér image-manifest.generated.ts (sandhed om disken)
 *   2. Indlæs IMPORTED_GUIDES + POTALOT_IMAGE_SETS_BY_ID
 *   3. Rapportér pr. PotalotImageSet-felt:
 *      A. Imported guides uden primaryImageId
 *      B. Sortsguider hvor seedCard eller plantCard-asset mangler
 *      C. POTALOT_IMAGE_SETS_BY_ID entries der peger på ikke-eksisterende
 *         filer (seedCard/plantCard/speciesHero/varietyHero/macro)
 *      D. Sortsguider uden mindst én atmosphere-makro (visuel progression
 *         låses som regel C i Docs/design-system/guides.md sektion -2)
 *      E. Ubrugte billedfiler i tracked mapper
 *
 * Exit-kode 1 hvis nogen kategori har issues (gør den brugbar i CI).
 *
 * Spec: Annas image-pipeline-instruktion, juni 2026.
 */

import { scanImages, writeManifest } from './scan-images'

async function main() {
  // ── Step 1: regenerér manifest ──────────────────────────────
  const allPaths = scanImages()
  writeManifest(allPaths)
  const manifest = new Set(allPaths)
  console.log(`✓ Scannet ${allPaths.length} billeder under public/images/`)
  console.log('')

  // ── Step 2: indlæs guide-data dynamisk ──────────────────────
  const guidesImported = await import('../src/data/guides-imported')
  const imageSets = await import('../src/data/potalot-image-sets')

  type ImportedGuide = {
    id: string
    plantName: string
    variety?: string | null
    guideLevel: 'species' | 'variety'
    primaryImageId?: string | null
  }
  type Asset = { src: string; alt: string }
  type Macro = Asset & { role: string; focalPoint?: string }
  type Set = {
    seedCard?: Asset
    plantCard?: Asset
    speciesHero?: Asset
    varietyHero?: Asset
    macro: Macro[]
  }

  const IMPORTED_GUIDES = guidesImported.IMPORTED_GUIDES as ImportedGuide[]
  const POTALOT_IMAGE_SETS_BY_ID = imageSets.POTALOT_IMAGE_SETS_BY_ID as Record<
    string,
    Set
  >

  let totalIssues = 0
  const usedPaths = new globalThis.Set<string>()

  // ── A. Imported guides uden primaryImageId ──────────────────
  console.log('A. Imported guides uden primaryImageId')
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

  // ── B. Sortsguider: asset-coverage ──────────────────────────
  console.log('B. Sortsguider: seedCard + plantCard via asset-convention')
  const sortsguider = IMPORTED_GUIDES.filter((g) => g.guideLevel === 'variety')
  let bIssues = 0
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
          !hasFro && 'seedCard mangler (frokort)',
          !hasPlante && 'plantCard mangler (plantekort)',
        ]
          .filter(Boolean)
          .join(', ')}`,
      )
      bIssues++
    }
    for (const p of [...frokort, ...plantekort]) {
      if (manifest.has(p)) usedPaths.add(p)
    }
  }
  if (bIssues === 0) console.log('   ✓ alle sortsguider har seedCard + plantCard')
  totalIssues += bIssues
  console.log('')

  // ── C. PotalotImageSet entries med brudte filer ─────────────
  console.log('C. POTALOT_IMAGE_SETS_BY_ID: brudte fil-referencer')
  let cIssues = 0
  for (const [guideId, set] of Object.entries(POTALOT_IMAGE_SETS_BY_ID)) {
    const checkAsset = (label: string, asset?: Asset) => {
      if (!asset) return
      if (manifest.has(asset.src)) usedPaths.add(asset.src)
      else {
        console.log(`   ⚠ ${guideId} ${label} → ${asset.src}`)
        cIssues++
      }
    }
    checkAsset('seedCard', set.seedCard)
    checkAsset('plantCard', set.plantCard)
    checkAsset('speciesHero', set.speciesHero)
    checkAsset('varietyHero', set.varietyHero)
    for (const m of set.macro) {
      if (manifest.has(m.src)) usedPaths.add(m.src)
      else {
        console.log(`   ⚠ ${guideId} macro[${m.role}] → ${m.src}`)
        cIssues++
      }
    }
  }
  if (cIssues === 0) console.log('   ✓ ingen brudte referencer')
  totalIssues += cIssues
  console.log('')

  // ── D. Sortsguider uden atmosphere-makro ────────────────────
  // Visuel progression (V4.1 regel C i Docs/design-system/guides.md
  // sektion -2): mindst 1 atmosphere-makro pr. sortsguide.
  console.log('D. Sortsguider uden atmosphere-makro (visuel progression)')
  let dIssues = 0
  for (const g of sortsguider) {
    const set = POTALOT_IMAGE_SETS_BY_ID[g.id]
    if (!set) continue  // ingen entry endnu = ikke en regression, blot ikke fyldt ud
    const hasAtmosphere = set.macro.some((m) => m.role === 'atmosphere')
    if (!hasAtmosphere && set.macro.length > 0) {
      console.log(`   ⚠ ${g.id}: ${set.macro.length} makro(s), 0 atmosphere`)
      dIssues++
    }
  }
  if (dIssues === 0) console.log('   ✓ alle sortsguider med makro har atmosphere-rolle')
  totalIssues += dIssues
  console.log('')

  // ── E. Ubrugte billedfiler i tracked mapper ─────────────────
  console.log('E. Ubrugte billedfiler (arts/plantekort/frokort/makro)')
  const tracked = allPaths.filter(
    (p) =>
      p.startsWith('/images/arts/') ||
      p.startsWith('/images/plantekort/') ||
      p.startsWith('/images/frokort/') ||
      p.startsWith('/images/makro/'),
  )
  const unused = tracked.filter((p) => !usedPaths.has(p))
  if (unused.length === 0) {
    console.log('   ✓ ingen ubrugte filer i tracked mapper')
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
    console.log(`✗ ${totalIssues} issue(s) fundet i kategori A–D`)
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
