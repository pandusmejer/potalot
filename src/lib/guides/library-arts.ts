import type { Guide } from '@/lib/types'
import {
  libraryCategoryOf,
  LIBRARY_CATEGORY_ORDER,
  type LibraryCategory,
} from '@/data/guide-library-categories'

/** Én art i biblioteket: dens artsguide (hero) + dens sortsguider. */
export interface LibraryArt {
  plantName: string
  hero?: Guide
  varieties: Guide[]
}

/**
 * Grupper en flad guide-liste til arter: species → hero, variety → under arten.
 * Sorteret alfabetisk (arter + sorter). Delt af forsidens kategori-tællinger og
 * kategorisidens A–Å-liste, så de ALDRIG divergerer.
 */
export function buildLibraryArts(guides: Guide[]): LibraryArt[] {
  const arts = new Map<string, LibraryArt>()
  for (const g of guides) {
    const isVar = g.guideLevel === 'variety' || !!g.variety
    const a = arts.get(g.plantName) ?? { plantName: g.plantName, varieties: [] }
    if (isVar) a.varieties.push(g)
    else a.hero = g
    arts.set(g.plantName, a)
  }
  const out = [...arts.values()]
  for (const a of out) {
    a.varieties.sort((x, y) => (x.variety ?? '').localeCompare(y.variety ?? '', 'da'))
  }
  out.sort((x, y) => x.plantName.localeCompare(y.plantName, 'da'))
  return out
}

/** Arter grupperet pr. bibliotekskategori (navigations-kategori, ikke botanik). */
export function artsByCategory(guides: Guide[]): Map<LibraryCategory, LibraryArt[]> {
  const cats = new Map<LibraryCategory, LibraryArt[]>()
  for (const c of LIBRARY_CATEGORY_ORDER) cats.set(c, [])
  for (const a of buildLibraryArts(guides)) {
    cats.get(libraryCategoryOf(a.plantName))!.push(a)
  }
  return cats
}
