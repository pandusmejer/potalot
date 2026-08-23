/**
 * Én insert-kontrakt for frøbanken.
 *
 * `createInventoryItem` (én pose ad gangen) og Excel-importen (et batch)
 * skal skrive PRÆCIS de samme kolonner med de samme regler — ellers
 * driver de to veje fra hinanden. Derfor bor kortlægningen her, i et rent
 * modul begge kan bruge (server actions må kun eksportere async
 * funktioner, så den kan ikke bo i froebank.ts).
 */

import type { PrimaryCategoryId, GrowingLocation } from '@/lib/types'

export interface CreateInventoryInput {
  name: string
  latinName?: string
  variety?: string
  supplier?: string
  primaryCategoryId: PrimaryCategoryId
  subcategoryId?: string
  quantity?: number
  seedCount?: number
  purchaseDate?: string
  purchaseYear?: number
  purchaseUrl?: string
  expiryDate?: string
  notes?: string
  sowingMonths?: number[]
  sowingDepthMm?: number
  preCultivation?: boolean
  plantingOutMonths?: number[]
  harvestMonths?: number[]
  light?: 'full_sun' | 'partial_shade' | 'shade'
  water?: 'low' | 'regular' | 'high'
  soil?: string
  germinationDays?: string
  germinationTemperature?: string
  plantSpacing?: string
  rowSpacing?: string
  growingLocations?: GrowingLocation[]
  imageUrls?: string[]
  primaryImageUrl?: string
  /**
   * Forudkoblet guide. Sættes KUN af Excel-importen, der slår eksisterende
   * guides op i batch; den normale oprettelse lader `after()` gøre det.
   */
  guideId?: string | null
}

export function buildInventoryInsert(userId: string, input: CreateInventoryInput) {
  return {
    user_id: userId,
    name: input.name,
    latin_name: input.latinName || null,
    variety: input.variety || null,
    supplier: input.supplier || null,
    primary_category_id: input.primaryCategoryId,
    subcategory_id: input.subcategoryId || null,
    quantity: input.quantity != null ? Math.round(input.quantity) : null,
    seed_count: input.seedCount != null ? Math.round(input.seedCount) : null,
    purchase_date: input.purchaseDate || null,
    purchase_year: input.purchaseYear != null ? Math.round(input.purchaseYear) : null,
    purchase_url: input.purchaseUrl || null,
    expiry_date: input.expiryDate || null,
    notes: input.notes || null,
    sowing_months: input.sowingMonths ?? [],
    sowing_depth_mm: input.sowingDepthMm != null ? Math.round(input.sowingDepthMm) : 0,
    pre_cultivation: input.preCultivation ?? null,
    planting_out_months: input.plantingOutMonths ?? [],
    harvest_months: input.harvestMonths ?? [],
    light: input.light ?? null,
    water: input.water ?? null,
    soil: input.soil || null,
    germination_days: input.germinationDays ?? null,
    germination_temperature: input.germinationTemperature ?? null,
    plant_spacing: input.plantSpacing ?? null,
    row_spacing: input.rowSpacing ?? null,
    growing_locations: input.growingLocations ?? [],
    status: 'i_froebank',
    image_urls: input.imageUrls ?? [],
    primary_image_url: input.primaryImageUrl ?? null,
    guide_id: input.guideId ?? null,
  }
}
