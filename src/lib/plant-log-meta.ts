import type { PlantLogType, HealthValue } from '@/lib/types'

/**
 * Fælles labels + enum-metadata for plante-logs.
 *
 * ÉN kilde til sandhed, delt af LogForm, Timeline og Mål-panelet — så
 * overskriften på en log ALTID følger dens type (retter den gamle
 * "Note · Note · Note"-fejl), og trivsel/højde vises ens overalt.
 */

/** Menneskelæsbar overskrift pr. logtype (dansk). */
export const PLANT_LOG_LABEL: Record<PlantLogType, string> = {
  sowing: 'Sået',
  germination: 'Spiret',
  repotting: 'Pottet om',
  planting_out: 'Udplantet',
  watering: 'Vandet',
  fertilizing: 'Gødet',
  pruning: 'Beskåret',
  pest_disease: 'Skadedyr/sygdom',
  harvest: 'Høstet',
  note: 'Observation',
  status_change: 'Stadieskift',
  archive: 'Arkiveret',
  health: 'Trivsel',
  height_measurement: 'Højde',
}

/** Trivsel-enum → UI. `short` bruges på plantekortet, `label` i formular/historik. */
export const HEALTH_OPTIONS: { value: HealthValue; label: string; short: string }[] = [
  { value: 'good', label: 'Trives godt', short: 'God' },
  { value: 'okay', label: 'Trives nogenlunde', short: 'Nogenlunde' },
  { value: 'attention', label: 'Kræver opmærksomhed', short: 'Kræver opmærksomhed' },
]

const HEALTH_BY_VALUE = new Map(HEALTH_OPTIONS.map(o => [o.value, o]))

/** Kort trivsels-label (til kort/oversigt). Ukendt/tom → null. */
export function healthShort(value?: string | null): string | null {
  if (!value) return null
  return HEALTH_BY_VALUE.get(value as HealthValue)?.short ?? null
}

/** Fuld trivsels-label (til formular/historik). */
export function healthLabel(value?: string | null): string | null {
  if (!value) return null
  return HEALTH_BY_VALUE.get(value as HealthValue)?.label ?? null
}

/** Formatér en højdemåling ("24 cm"). Ingen værdi → null. */
export function heightLabel(cm?: number | null): string | null {
  if (cm == null || Number.isNaN(cm)) return null
  // Heltal uden decimal; ellers max 1 decimal.
  const n = Number.isInteger(cm) ? cm : Math.round(cm * 10) / 10
  return `${n} cm`
}

/** Overskrift til en log i historikken — inkl. værdi for måletyper. */
export function logHeading(log: {
  type: PlantLogType
  title?: string | null
  valueText?: string | null
  valueNumeric?: number | null
}): string {
  if (log.type === 'health') {
    const s = healthShort(log.valueText)
    return s ? `Trivsel: ${s}` : 'Trivsel'
  }
  if (log.type === 'height_measurement') {
    const h = heightLabel(log.valueNumeric)
    return h ? `Højde: ${h}` : 'Højde'
  }
  // Brugerens egen titel vinder; ellers typens navn (ALDRIG bare "Note").
  return (log.title && log.title.trim()) || PLANT_LOG_LABEL[log.type]
}
