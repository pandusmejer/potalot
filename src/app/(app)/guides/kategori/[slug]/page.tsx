import { notFound } from 'next/navigation'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'
import { ALL_GUIDES } from '@/data/guides-demo'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import {
  libraryCategoryOf,
  LIBRARY_CATEGORY_ORDER,
  LIBRARY_CATEGORY_LABEL,
  LIBRARY_CATEGORY_INTRO,
  type LibraryCategory,
} from '@/data/guide-library-categories'
import { buildLibraryArts } from '@/lib/guides/library-arts'
import { normalizeGuideKey } from '@/lib/guides/normalize-key'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import type { ArtRow } from '@/components/guides/guides-bibliotek'
import { KategoriBibliotek } from './kategori-bibliotek'

export const dynamic = 'force-dynamic'

/**
 * Kategoriside — /guides/kategori/[slug]. Her bor den lange A–Å-liste, som IKKE
 * hører hjemme på forsiden: brugeren har aktivt valgt kategorien. Hierarki:
 * Guides → kategori → art → sort.
 */
export default async function KategoriPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!(LIBRARY_CATEGORY_ORDER as readonly string[]).includes(slug)) notFound()
  const category = slug as LibraryCategory

  const [guides, inventory] = await Promise.all([
    getAllGuides(),
    getAllInventoryItems(),
  ])
  const isDemo = guides.length === 0
  const visibleGuides = isDemo ? ALL_GUIDES : IMPORTED_GUIDES

  const catGuides = visibleGuides.filter(
    g => g.guideLevel !== 'technique' && libraryCategoryOf(g.plantName) === category,
  )
  const artRows: ArtRow[] = buildLibraryArts(catGuides)
    .map(a => {
      const g = a.hero ?? a.varieties[0]
      return g
        ? { plantName: a.plantName, guideId: g.id, sortCount: a.varieties.length }
        : null
    })
    .filter((r): r is ArtRow => r !== null)

  // Tom kategori → 404 (ingen byggeplads-sider).
  if (artRows.length === 0) notFound()

  const froeKeys = new Set(
    inventory.map(i => normalizeGuideKey(i.name)).filter(Boolean),
  )
  const mineArts = artRows
    .filter(r => froeKeys.has(normalizeGuideKey(r.plantName)))
    .map(r => ({ plantName: r.plantName, guideId: r.guideId }))

  // START HER — redaktionelle indgange (pt. de 4 første; senere sæson-kurateret).
  const heroes = artRows.slice(0, 4).map(r => ({
    plantName: r.plantName,
    guideId: r.guideId,
    sortCount: r.sortCount,
    imageSrc:
      resolvePotalotImage({
        guideId: r.guideId,
        speciesSlug: r.guideId,
        varietySlug: null,
        role: 'species-hero',
        preferredSrc: null,
      }).src ?? null,
  }))

  return (
    <div className="relative -mx-4 -mt-6 min-h-screen bg-[#EAE6D8] px-4 pb-16 pt-6">
      <style>{`.app-canvas{background-color:#EAE6D8;}`}</style>
      <KategoriBibliotek
        slug={category}
        label={LIBRARY_CATEGORY_LABEL[category]}
        intro={LIBRARY_CATEGORY_INTRO[category]}
        arts={artRows}
        heroes={heroes}
        mineArts={mineArts}
      />
    </div>
  )
}
