/**
 * Backfill af tomme dyrkningsfelter på EKSISTERENDE frøposter.
 *
 * Baggrund: poser oprettet før berigelses-pipelinen (import før 23/8 2026)
 * står med tomme dyrkningsfakta, selv om Potalot i dag har både arts- og
 * sortsguide for dem. De skal ikke være andenrangsposter, og brugeren skal
 * ikke åbne Redigér én post ad gangen for at rette op på det.
 *
 * PRIORITET (samme som overalt ellers):
 *   1. Brugerens egne data — røres ALDRIG
 *   2. Potalot sort
 *   3. Potalot art
 *   4. STOP — er guiderne tavse, forbliver feltet tomt
 *
 * Denne første version bruger KUN Potalots eget kontrollerede bibliotek.
 * Gamle webshoplinks hentes bevidst ikke: produktsider ændrer sig, og en
 * baggrunds-backfill er det forkerte sted at opdage det (Anna, 25/8).
 *
 * Motoren er ren (ingen I/O) så både forhåndsvisningen og selve skrivningen
 * kan bruge nøjagtig samme regler — og så reglerne kan testes.
 */

import { findFroebankAutofill } from '@/lib/froebank-autofill'
import type { InventoryItem } from '@/lib/types'
import type { DyrkningsfaktaState } from '@/components/froebank/dyrkningsfakta-fields'

/**
 * De eneste felter backfill må røre. Poseoplysninger (leverandør, årgang,
 * antal, bedst før, noter, foto) står bevidst IKKE på listen: de hører til
 * den fysiske pose, og dem kan intet bibliotek vide noget om.
 */
export const BACKFILL_FELTER = [
  'sowingMonths',
  'sowingDepthMm',
  'preCultivation',
  'plantingOutMonths',
  'harvestMonths',
  'light',
  'water',
  'soil',
  'germinationDays',
  'germinationTemperature',
  'plantSpacing',
  'rowSpacing',
] as const

export type BackfillFelt = (typeof BACKFILL_FELTER)[number]

export const BACKFILL_LABELS: Record<BackfillFelt, string> = {
  sowingMonths: 'Sås',
  sowingDepthMm: 'Sådybde',
  preCultivation: 'Forkultivering',
  plantingOutMonths: 'Plant ud',
  harvestMonths: 'Høst',
  light: 'Lys',
  water: 'Vand',
  soil: 'Jord',
  germinationDays: 'Spiretid',
  germinationTemperature: 'Spiretemperatur',
  plantSpacing: 'Planteafstand',
  rowSpacing: 'Rækkeafstand',
}

/** Kolonnenavne i databasen — så skrivningen ikke skal gætte. */
export const BACKFILL_KOLONNER: Record<BackfillFelt, string> = {
  sowingMonths: 'sowing_months',
  sowingDepthMm: 'sowing_depth_mm',
  preCultivation: 'pre_cultivation',
  plantingOutMonths: 'planting_out_months',
  harvestMonths: 'harvest_months',
  light: 'light',
  water: 'water',
  soil: 'soil',
  germinationDays: 'germination_days',
  germinationTemperature: 'germination_temperature',
  plantSpacing: 'plant_spacing',
  rowSpacing: 'row_spacing',
}

/**
 * Er feltet reelt TOMT på brugerens frøpost?
 *
 * Her gælder 0-er-ikke-ukendt-reglen i begge ender:
 *   · `sowingDepthMm === 0` betyder "sås på overfladen" — en ægte værdi,
 *     som backfill ALDRIG må skrive hen over.
 *   · `preCultivation === false` betyder "forkultiveres ikke" — også en
 *     ægte værdi. Kun `null` er ukendt.
 * Tom liste og tom streng er derimod ikke til at skelne fra manglende
 * registrering, og tæller derfor som tomme.
 */
export function erTomt(item: Partial<InventoryItem>, felt: BackfillFelt): boolean {
  switch (felt) {
    case 'sowingMonths':
    case 'plantingOutMonths':
    case 'harvestMonths':
      return (item[felt] ?? []).length === 0
    case 'sowingDepthMm':
    case 'preCultivation':
    case 'light':
    case 'water':
      return item[felt] == null
    default: {
      const v = item[felt]
      return v == null || String(v).trim() === ''
    }
  }
}

/** Guiden tier om feltet? (tom liste og tom streng tæller som tavshed). */
function guidenHarVaerdi(v: unknown): boolean {
  if (v === undefined || v === null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'string') return v.trim().length > 0
  return true
}

export interface BackfillForslag {
  id: string
  /** "Squash · Eight Ball F1" — kun til visning. */
  navn: string
  /** Kom værdierne overvejende fra sortsguiden eller artsguiden? */
  kilde: 'sort' | 'art'
  /** Kun de felter der er tomme hos brugeren OG har en værdi i guiden. */
  felter: Partial<Pick<DyrkningsfaktaState, BackfillFelt>>
  antalFelter: number
}

/**
 * Hvad kan Potalot fylde ud, uden at røre noget brugeren selv har skrevet?
 *
 * Returnerer kun poser hvor der faktisk er noget at gøre. Poser uden guide,
 * poser der allerede er udfyldt, og felter guiderne tier om, udelades — så
 * en tom liste betyder "der er intet at rette", ikke "vi kiggede ikke".
 */
export function foreslaaBackfill(items: InventoryItem[]): BackfillForslag[] {
  const forslag: BackfillForslag[] = []

  for (const item of items) {
    if (!item.name?.trim()) continue
    const autofill = findFroebankAutofill(item.name, item.variety ?? null)
    if (!autofill) continue

    const felter: BackfillForslag['felter'] = {}
    for (const felt of BACKFILL_FELTER) {
      if (!erTomt(item, felt)) continue
      const vaerdi = autofill.facts[felt]
      if (!guidenHarVaerdi(vaerdi)) continue
      // Kilden pr. felt kommer fra autofill; her bruges kun værdien.
      ;(felter as Record<string, unknown>)[felt] = vaerdi
    }

    const antalFelter = Object.keys(felter).length
    if (antalFelter === 0) continue

    forslag.push({
      id: item.id,
      navn: item.variety ? `${item.name} · ${item.variety}` : item.name,
      kilde: autofill.source,
      felter,
      antalFelter,
    })
  }

  return forslag
}

/** Samlet antal felter på tværs af forslagene — til én rolig sætning. */
export function antalFelterIAlt(forslag: BackfillForslag[]): number {
  return forslag.reduce((sum, f) => sum + f.antalFelter, 0)
}

/**
 * Ét forslag → den præcise database-opdatering.
 *
 * Kun de foreslåede felter kommer med; alt andet på rækken er urørt. Kaldes
 * FØRST efter at forslaget er genberegnet mod de friske rækker, så to
 * faneblade ikke kan nå at skrive hen over hinandens redigering.
 */
export function backfillOpdatering(forslag: BackfillForslag): Record<string, unknown> {
  const update: Record<string, unknown> = {}
  for (const [felt, vaerdi] of Object.entries(forslag.felter)) {
    update[BACKFILL_KOLONNER[felt as BackfillFelt]] = vaerdi
  }
  return update
}
