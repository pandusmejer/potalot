'use server'

import { getCurrentUser } from '@/lib/auth'
import { getAllInventoryItems } from '@/actions/froebank'
import { getAllPlants } from '@/actions/mine-planter'

export interface GuideKobling {
  id: string
  name: string
  variety: string | null
  isArchived?: boolean
  archivedYear?: number | null
}

export interface GuideKoblinger {
  loggedIn: boolean
  inventory: GuideKobling[]
  plants: GuideKobling[]
}

/**
 * Brugerens frøbank/plante-koblinger til én guide — kaldes fra klienten af
 * Din have-sektionen på de STATISKE guide-sider (cookies kan ikke læses i
 * deres render-sti). Slanke felter, ikke hele objekter.
 */
export async function getGuideKoblinger(
  guideId: string,
  parentId: string | null,
): Promise<GuideKoblinger> {
  const user = await getCurrentUser()
  if (!user) return { loggedIn: false, inventory: [], plants: [] }

  const [inventory, plants] = await Promise.all([getAllInventoryItems(), getAllPlants()])
  const matcher = (g: string | null | undefined) =>
    g === guideId || (parentId !== null && g === parentId)

  return {
    loggedIn: true,
    inventory: inventory
      .filter((i) => matcher(i.guideId))
      .map((i) => ({ id: i.id, name: i.name, variety: i.variety ?? null })),
    plants: plants
      .filter((p) => matcher(p.guideId))
      .map((p) => ({
        id: p.id,
        name: p.name,
        variety: p.variety ?? null,
        isArchived: p.isArchived,
        archivedYear: p.archivedYear ?? null,
      })),
  }
}
