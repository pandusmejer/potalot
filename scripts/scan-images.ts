/**
 * Image manifest generator.
 *
 * Scanner public/images/ rekursivt og genererer
 * src/data/image-manifest.generated.ts — en flad Set af alle
 * eksisterende billedstier (under /images/...).
 *
 * Bruges af:
 *   - src/lib/images/resolve-potalot-image.ts (eksistens-check)
 *   - scripts/check-images.ts (audit)
 *
 * Kør med:
 *   npx tsx scripts/scan-images.ts
 *
 * Genereres også som side-effekt af scripts/import-guides.ts og
 * scripts/check-images.ts så manifest aldrig kommer bag de andre
 * commands.
 */

import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative, sep, posix } from 'node:path'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.svg', '.gif', '.webp'])
const IGNORE_NAMES = new Set(['.DS_Store', '.gitkeep'])

function walk(dir: string, out: string[]): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    if (IGNORE_NAMES.has(name)) continue
    const full = join(dir, name)
    let stat
    try {
      stat = statSync(full)
    } catch {
      continue
    }
    if (stat.isDirectory()) {
      walk(full, out)
    } else if (stat.isFile()) {
      const ext = '.' + name.split('.').pop()!.toLowerCase()
      if (IMAGE_EXT.has(ext)) out.push(full)
    }
  }
}

export function scanImages(publicRoot = 'public/images'): string[] {
  const collected: string[] = []
  walk(publicRoot, collected)
  // Normaliser til POSIX-style /images/... paths.
  const root = relative('public', publicRoot).split(sep).join(posix.sep)
  return collected
    .map((abs) => {
      const rel = relative('public', abs).split(sep).join(posix.sep)
      return '/' + rel
    })
    .sort()
}

export function writeManifest(paths: string[]): void {
  const outFile = 'src/data/image-manifest.generated.ts'
  mkdirSync('src/data', { recursive: true })
  const body = `/**
 * AUTO-GENERATED — rør ikke direkte.
 *
 * Genereret af scripts/scan-images.ts. Kør 'npx tsx scripts/scan-images.ts'
 * eller 'npm run check:images' for at regenerere.
 *
 * Listen er sandheden om hvilke billedfiler der findes under
 * public/images/. resolvePotalotImage() bruger den til at afgøre
 * om et asset-convention-path findes inden det returneres.
 *
 * Fil-tæller: ${paths.length}
 */

export const IMAGE_MANIFEST: ReadonlySet<string> = new Set([
${paths.map((p) => `  ${JSON.stringify(p)},`).join('\n')}
])

export function hasImage(path: string): boolean {
  return IMAGE_MANIFEST.has(path)
}
`
  writeFileSync(outFile, body)
}

// Kør som CLI hvis kaldt direkte
if (process.argv[1]?.endsWith('scan-images.ts')) {
  const paths = scanImages()
  writeManifest(paths)
  console.log(`✓ Scannet ${paths.length} billeder → src/data/image-manifest.generated.ts`)
}
