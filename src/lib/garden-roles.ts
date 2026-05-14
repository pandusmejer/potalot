/**
 * Haveroller — progression-system der erstatter "level"-tankegang.
 *
 * Den centrale idé: brugerens stadie i sin have-rejse er en TITEL, ikke
 * et tal. Optjenes ved samlet badge-portfolio, ikke ved tid eller
 * aktivitet alene. Roller er afledte (ikke persisterede) — kan altid
 * udregnes fra de optjente badges.
 *
 * Hver rolle har en lille beskrivelse i den tone PotAlot stræber efter:
 * rolig, botanisk, lidt poetisk, ikke gamification-cringe.
 */

import { BADGES, type BadgeId, type BadgeMeta } from './badges-shared'

export type GardenRole =
  | 'spire'
  | 'dyrker'
  | 'gartner'
  | 'froesamler'
  | 'havevogter'
  | 'selvforsyner'

export interface GardenRoleMeta {
  id: GardenRole
  label: string
  description: string
  icon: 'Sprout' | 'Leaf' | 'TreePine' | 'Package' | 'Shield' | 'Crown'
  minBadges: number
  /** Krav til diversitet — minimum badges fra hver kategori. */
  categoryMinimums?: Partial<Record<BadgeMeta['category'], number>>
}

export const GARDEN_ROLES: Record<GardenRole, GardenRoleMeta> = {
  spire: {
    id: 'spire',
    label: 'Spire',
    description: 'Du er lige rykket op af mulden. Velkommen til den lange sæson.',
    icon: 'Sprout',
    minBadges: 0,
  },
  dyrker: {
    id: 'dyrker',
    label: 'Dyrker',
    description: 'De første hænder i jord. Du har gjort det første rigtige skridt.',
    icon: 'Leaf',
    minBadges: 3,
  },
  gartner: {
    id: 'gartner',
    label: 'Gartner',
    description: 'Du kender rytmen. Sæsonerne flytter sig — og du følger med.',
    icon: 'TreePine',
    minBadges: 6,
    categoryMinimums: { dyrkning: 1 },
  },
  froesamler: {
    id: 'froesamler',
    label: 'Frøsamler',
    description: 'En have-historiker. Du bevarer både sorter og erfaringer.',
    icon: 'Package',
    minBadges: 9,
    categoryMinimums: { dyrkning: 2, samler: 1 },
  },
  havevogter: {
    id: 'havevogter',
    label: 'Havevogter',
    description: 'Du kender systemet i bund. Andre kigger til dig for råd.',
    icon: 'Shield',
    minBadges: 15,
    categoryMinimums: { dyrkning: 3, samler: 2, laering: 1 },
  },
  selvforsyner: {
    id: 'selvforsyner',
    label: 'Selvforsyner',
    description: 'Toppen. Sæsoner er ikke længere udfordringer — de er hjemme.',
    icon: 'Crown',
    minBadges: 20,
    categoryMinimums: { dyrkning: 5, samler: 3, laering: 2, social: 2 },
  },
}

export const ROLE_ORDER: GardenRole[] = [
  'spire', 'dyrker', 'gartner', 'froesamler', 'havevogter', 'selvforsyner',
]

export interface RoleProgress {
  currentRole: GardenRole
  nextRole: GardenRole | null
  totalBadges: number
  missingForNext: {
    badgesNeeded: number
    categoryMissing: Partial<Record<BadgeMeta['category'], number>>
  } | null
}

/**
 * Afled brugerens nuværende rolle samt fremskridt mod næste.
 * Tager listen af optjente badge-ID'er og returnerer fuld progression-info.
 */
export function computeRole(earnedBadgeIds: BadgeId[]): RoleProgress {
  const total = earnedBadgeIds.length
  const byCategory = countByCategory(earnedBadgeIds)

  // Find den højeste rolle brugeren opfylder
  let currentRole: GardenRole = 'spire'
  for (const roleId of ROLE_ORDER) {
    const role = GARDEN_ROLES[roleId]
    if (total < role.minBadges) break
    if (!meetsCategoryMinimums(byCategory, role.categoryMinimums)) break
    currentRole = roleId
  }

  // Næste rolle (hvis nogen)
  const currentIdx = ROLE_ORDER.indexOf(currentRole)
  const nextRoleId = currentIdx < ROLE_ORDER.length - 1 ? ROLE_ORDER[currentIdx + 1] : null

  let missingForNext: RoleProgress['missingForNext'] = null
  if (nextRoleId) {
    const next = GARDEN_ROLES[nextRoleId]
    const badgesNeeded = Math.max(0, next.minBadges - total)
    const categoryMissing: Partial<Record<BadgeMeta['category'], number>> = {}
    for (const [cat, min] of Object.entries(next.categoryMinimums ?? {})) {
      const have = byCategory[cat as BadgeMeta['category']] ?? 0
      const need = Math.max(0, min - have)
      if (need > 0) categoryMissing[cat as BadgeMeta['category']] = need
    }
    missingForNext = { badgesNeeded, categoryMissing }
  }

  return {
    currentRole,
    nextRole: nextRoleId,
    totalBadges: total,
    missingForNext,
  }
}

function countByCategory(ids: BadgeId[]): Record<BadgeMeta['category'], number> {
  const counts: Record<BadgeMeta['category'], number> = {
    dyrkning: 0, samler: 0, laering: 0, social: 0,
  }
  for (const id of ids) {
    const b = BADGES[id]
    if (b) counts[b.category]++
  }
  return counts
}

function meetsCategoryMinimums(
  have: Record<BadgeMeta['category'], number>,
  required?: Partial<Record<BadgeMeta['category'], number>>
): boolean {
  if (!required) return true
  for (const [cat, min] of Object.entries(required)) {
    if ((have[cat as BadgeMeta['category']] ?? 0) < min) return false
  }
  return true
}
