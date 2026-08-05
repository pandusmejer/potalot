'use server'

import { getCurrentUser } from '@/lib/auth'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'
import {
  buildMineHaveGuides,
  pickForForside,
  type HaveCardData,
} from '@/lib/guides/min-have'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { ALL_GUIDES } from '@/data/guides-demo'
import type { Guide } from '@/lib/types'

export interface GuidesPersona {
  mineHaveCards: HaveCardData[]
  mineHaveTotal: number
  mineGuides: Guide[]
}

/**
 * De personlige sektioner på /guides (I DIN HAVE + Dine egne guides) —
 * hentes fra klienten efter mount, fordi biblioteks-siden er statisk
 * genereret og ikke kan læse cookies i render-stien. Anonym → tomt
 * (sektionerne skjuler sig selv / falder tilbage til redaktionelt).
 */
export async function getGuidesPersona(): Promise<GuidesPersona> {
  const user = await getCurrentUser()
  if (!user) return { mineHaveCards: [], mineHaveTotal: 0, mineGuides: [] }

  const [guides, inventory] = await Promise.all([
    getAllGuides(),
    getAllInventoryItems(),
  ])

  // Slank payload: biblioteket viser kort, aldrig artikel-indhold.
  const mineGuides = guides
    .filter((g) => g.visibility === 'private')
    .map((g) => ({ ...g, sections: [] }))

  const mineHaveAll = buildMineHaveGuides(
    ALL_GUIDES,
    inventory,
    new Date().getMonth() + 1,
  )
  const mineHaveCards = pickForForside(mineHaveAll, 4).map((it) => {
    const g = it.guide
    const isVar = it.kind === 'variety'
    const { src } = resolvePotalotImage({
      guideId: g.id,
      speciesSlug: isVar ? g.parentGuideId ?? g.id : g.id,
      varietySlug: isVar ? g.id : null,
      role: isVar ? 'variety-hero' : 'species-hero',
      preferredSrc: g.primaryImageId,
    })
    return {
      guideId: g.id,
      title: isVar ? g.variety ?? g.plantName : g.plantName,
      typeLabel: isVar ? 'Sortsguide' : 'Artsguide',
      contextLine: isVar ? `${it.plantName} · Sortsguide` : 'Artsguide',
      summary: g.summary ?? '',
      imageSrc: src ?? null,
    }
  })

  return { mineHaveCards, mineHaveTotal: mineHaveAll.length, mineGuides }
}
