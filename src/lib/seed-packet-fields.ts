/**
 * Frøpose-udtræk: felttype + ren JSON-parsning.
 *
 * Bor uden for server-actionen, så reglerne for hvad der overhovedet
 * accepteres fra modellen kan testes uden netværk, auth eller API-nøgle.
 * Selve kaldet (foto og link) ligger fortsat i actions/seed-packet-extract.
 *
 * Grundregel: modellen må gerne tie. Et felt der ikke har den rigtige type
 * — eller slet ikke er der — bliver IKKE sat. Vi opfinder aldrig en værdi
 * for at få posten til at se komplet ud.
 */

import type { PrimaryCategoryId } from '@/lib/types'

export interface ExtractedSeedFields {
  name?: string
  latinName?: string
  variety?: string
  supplier?: string
  seedCount?: number
  purchaseYear?: number
  sowingMonths?: number[]
  plantingOutMonths?: number[]
  harvestMonths?: number[]
  sowingDepthMm?: number
  preCultivation?: boolean
  germinationDays?: string
  germinationTemperature?: string
  plantSpacing?: string
  rowSpacing?: string
  light?: 'full_sun' | 'partial_shade' | 'shade'
  water?: 'low' | 'regular' | 'high'
  /** Jordtype/jordkrav, ordret som posen eller siden beskriver det. */
  soil?: string
  primaryCategoryId?: PrimaryCategoryId
  notes?: string
}

/** Modelsvar → JSON. Tåler markdown-hegn; alt andet giver null. */
export function parseJsonOrNull(raw: string): Record<string, unknown> | null {
  let cleaned = raw.trim()
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) cleaned = fenceMatch[1].trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

/** Tom eller kun-mellemrum tæller som tavshed, ikke som en værdi. */
function tekstfelt(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  return s.length > 0 ? s : undefined
}

export function parseFieldsFromJson(parsed: Record<string, unknown>): ExtractedSeedFields {
  const fields: ExtractedSeedFields = {}
  if (typeof parsed.name === 'string')           fields.name = parsed.name
  if (typeof parsed.latinName === 'string')      fields.latinName = parsed.latinName
  if (typeof parsed.variety === 'string')        fields.variety = parsed.variety
  if (typeof parsed.supplier === 'string')       fields.supplier = parsed.supplier
  if (typeof parsed.seedCount === 'number')      fields.seedCount = Math.round(parsed.seedCount)
  if (typeof parsed.purchaseYear === 'number' && parsed.purchaseYear >= 1900 && parsed.purchaseYear <= 2100) {
    fields.purchaseYear = Math.round(parsed.purchaseYear)
  }
  if (Array.isArray(parsed.sowingMonths))        fields.sowingMonths = parsed.sowingMonths.filter((m): m is number => typeof m === 'number')
  if (Array.isArray(parsed.plantingOutMonths))   fields.plantingOutMonths = parsed.plantingOutMonths.filter((m): m is number => typeof m === 'number')
  if (Array.isArray(parsed.harvestMonths))       fields.harvestMonths = parsed.harvestMonths.filter((m): m is number => typeof m === 'number')
  if (typeof parsed.sowingDepthMm === 'number')  fields.sowingDepthMm = Math.round(parsed.sowingDepthMm)
  if (typeof parsed.preCultivation === 'boolean') fields.preCultivation = parsed.preCultivation
  if (typeof parsed.germinationDays === 'string')        fields.germinationDays = parsed.germinationDays
  if (typeof parsed.germinationTemperature === 'string') fields.germinationTemperature = parsed.germinationTemperature
  if (typeof parsed.plantSpacing === 'string')   fields.plantSpacing = parsed.plantSpacing
  if (typeof parsed.rowSpacing === 'string')     fields.rowSpacing = parsed.rowSpacing
  // Jord er fritekst og bæres videre ordret. Tom streng er tavshed —
  // ellers ville et tomt felt se ud som en jordbeskrivelse i frøbanken.
  const jord = tekstfelt(parsed.soil)
  if (jord) fields.soil = jord
  if (parsed.light === 'full_sun' || parsed.light === 'partial_shade' || parsed.light === 'shade') {
    fields.light = parsed.light
  }
  if (parsed.water === 'low' || parsed.water === 'regular' || parsed.water === 'high') {
    fields.water = parsed.water
  }
  if (typeof parsed.primaryCategoryId === 'string') {
    fields.primaryCategoryId = parsed.primaryCategoryId as PrimaryCategoryId
  }
  if (typeof parsed.notes === 'string') fields.notes = parsed.notes
  return fields
}
