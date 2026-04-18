/**
 * Livscyklus state machine for plante-instanser.
 *
 * Pure logik — ingen DB-kald. Beskriver hvilke handlinger der er tilladt
 * i hver tilstand og hvilken ny tilstand handlingen leder til.
 */

import type { Livscyklus, AfsluttetAarsag } from '@/lib/types'

// ============================================
// Handling-typer
// ============================================

export type Handling =
  | { type: 'soe'; antal: number; placering_id?: string; dato?: string }
  | { type: 'spiret'; dato?: string }
  | { type: 'prikle'; antal: number; placering_id?: string; dato?: string }
  | { type: 'plant_ud'; placering_id?: string; dato?: string }
  | { type: 'vand'; dato?: string }
  | { type: 'goed'; dato?: string }
  | { type: 'flyt'; placering_id: string; dato?: string }
  | { type: 'beskaar'; dato?: string; noter?: string }
  | { type: 'hoest'; maengde?: number; enhed?: 'stk' | 'kg' | 'g'; dato?: string }
  | { type: 'afslut'; aarsag: AfsluttetAarsag; noter?: string; gem_froe?: boolean; dato?: string }
  | { type: 'note'; tekst: string; foto_urls?: string[]; dato?: string }

export type HandlingType = Handling['type']

// ============================================
// Tilladte handlinger per tilstand
// ============================================

export const TILLADTE_HANDLINGER: Record<Livscyklus, HandlingType[]> = {
  i_froebank: ['soe', 'note'],
  planlagt:   ['soe', 'note', 'afslut'],
  soet:       ['spiret', 'prikle', 'plant_ud', 'vand', 'flyt', 'note', 'afslut'],
  spiret:     ['prikle', 'plant_ud', 'vand', 'goed', 'flyt', 'note', 'afslut'],
  priklet:    ['plant_ud', 'vand', 'goed', 'flyt', 'beskaar', 'note', 'afslut'],
  udplantet:  ['vand', 'goed', 'flyt', 'beskaar', 'hoest', 'note', 'afslut'],
  i_vaekst:   ['vand', 'goed', 'flyt', 'beskaar', 'hoest', 'note', 'afslut'],
  afsluttet:  ['note'], // terminal — kun noter er tilladt
}

// ============================================
// Hvilken livscyklus en handling resulterer i
// ============================================

export const NAESTE_LIVSCYKLUS: Partial<Record<HandlingType, Livscyklus>> = {
  soe: 'soet',
  spiret: 'spiret',
  prikle: 'priklet',
  plant_ud: 'udplantet',
  afslut: 'afsluttet',
  // Vand, gød, flyt, beskåret, høstet, note → ingen status-change
  // (En udplantet plante går automatisk til 'i_vaekst' efter X dage uden bruger-input,
  //  men det håndteres af reaktiv motor, ikke her)
}

// ============================================
// Hvilken event-type en handling skriver
// ============================================

import type { EventType } from '@/lib/types'

export const HANDLING_TIL_EVENT: Record<HandlingType, EventType> = {
  soe: 'soet',
  spiret: 'spiret',
  prikle: 'priklet',
  plant_ud: 'udplantet',
  vand: 'vandet',
  goed: 'goedet',
  flyt: 'flyttet',
  beskaar: 'beskaaret',
  hoest: 'hoestet',
  afslut: 'afsluttet',
  note: 'note',
}

// ============================================
// Validering
// ============================================

export function erHandlingTilladt(currentLivscyklus: Livscyklus, handling: HandlingType): boolean {
  return TILLADTE_HANDLINGER[currentLivscyklus].includes(handling)
}

export function naesteLivscyklus(currentLivscyklus: Livscyklus, handling: HandlingType): Livscyklus {
  const naeste = NAESTE_LIVSCYKLUS[handling]
  return naeste ?? currentLivscyklus
}

// ============================================
// Brugervendte labels (havesprog)
// ============================================

export const LIVSCYKLUS_LABEL: Record<Livscyklus, string> = {
  i_froebank: 'I frøbanken',
  planlagt:   'Planlagt',
  soet:       'Sået',
  spiret:     'Spiret',
  priklet:    'Priklet ud',
  udplantet:  'Udplantet',
  i_vaekst:   'I vækst',
  afsluttet:  'Afsluttet',
}

export const HANDLING_LABEL: Record<HandlingType, string> = {
  soe:       'Så',
  spiret:    'Markér spiret',
  prikle:    'Prikl ud',
  plant_ud:  'Plant ud',
  vand:      'Vand',
  goed:      'Gød',
  flyt:      'Flyt',
  beskaar:   'Beskær',
  hoest:     'Høst',
  afslut:    'Afslut',
  note:      'Tilføj note',
}

export const AARSAG_LABEL: Record<AfsluttetAarsag, string> = {
  frost:        'Frost',
  sygdom:       'Sygdom',
  toerke:       'Tørke',
  skadedyr:     'Skadedyr',
  faerdig:      'Færdig sæson',
  gemt_til_froe:'Gemt til frø',
  ukendt:       'Ukendt',
}
