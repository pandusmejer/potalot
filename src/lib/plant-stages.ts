/**
 * Plante-stadier (lifecycle) som organiserings-princip.
 *
 * `PlantStatus` definerer rejsen en plante går igennem fra frø til afslutning.
 * Disse helpers giver rækkefølge, navigation og task-stadie-mapping.
 */

import type { PlantStatus, TaskType } from './types'

/** Rækkefølgen plante-stadier optræder i. */
export const STAGE_ORDER: PlantStatus[] = [
  'planlagt',
  'saaet',
  'spirer',
  'i_vaekst',
  'klar_til_udplantning',
  'udplantet',
  'hoestklar',
  'afsluttet',
]

/** Korte labels til progression-bar (mobile-friendly). */
export const STAGE_SHORT_LABEL: Record<PlantStatus, string> = {
  planlagt: 'Plan',
  saaet: 'Sået',
  spirer: 'Spirer',
  i_vaekst: 'Vækst',
  klar_til_udplantning: 'Klar',
  udplantet: 'Udplantet',
  hoestklar: 'Høstklar',
  afsluttet: 'Afsluttet',
}

export function stageIndex(s: PlantStatus): number {
  const i = STAGE_ORDER.indexOf(s)
  return i === -1 ? 0 : i
}

export function nextStage(s: PlantStatus): PlantStatus | null {
  const i = stageIndex(s)
  return i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null
}

export function previousStage(s: PlantStatus): PlantStatus | null {
  const i = stageIndex(s)
  return i > 0 ? STAGE_ORDER[i - 1] : null
}

/**
 * Map en task-type til det stadie hvor opgaven er mest relevant.
 * 'enhver' = relevant gennem hele aktiv-fasen (vand, gød, skadedyr).
 */
export const TASK_STAGE: Record<TaskType, PlantStatus | 'enhver'> = {
  pre_sow: 'planlagt',
  sowing: 'planlagt',
  repot: 'spirer',
  plant_out: 'klar_til_udplantning',
  watering: 'enhver',
  fertilizing: 'enhver',
  pruning: 'enhver',
  pest_check: 'enhver',
  harvest: 'hoestklar',
  weeding: 'enhver',
  maintenance: 'enhver',
  planning: 'planlagt',
  custom: 'enhver',
}

/**
 * Hører en opgave til 'aktuelt' (nuværende stadie) eller 'senere' (efter)?
 * Bruges til at gruppere åbne opgaver pr. plante.
 */
export function taskBelongsTo(
  taskType: TaskType,
  currentStage: PlantStatus
): 'aktuelt' | 'senere' | 'tidligere' {
  const target = TASK_STAGE[taskType]
  if (target === 'enhver') return 'aktuelt'
  const targetIdx = stageIndex(target)
  const currentIdx = stageIndex(currentStage)
  if (targetIdx === currentIdx) return 'aktuelt'
  if (targetIdx > currentIdx) return 'senere'
  return 'tidligere'
}
