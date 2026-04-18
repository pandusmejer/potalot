/**
 * Havesprog — centraliseret tekst-utility.
 *
 * Erstatter tech-jargon (status, 0 tasks, sync...) med rolig haveven-tone.
 * Princip: Ville en erfaren gartner sige det til en ven over hækken?
 */

import type { Livscyklus } from '@/lib/types'

// ============================================
// Tidsmæssige formuleringer
// ============================================

export function dageSiden(dato: string | Date): string {
  const d = typeof dato === 'string' ? new Date(dato) : dato
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

  if (diff === 0) return 'i dag'
  if (diff === 1) return 'i går'
  if (diff < 7) return `${diff} dage siden`
  if (diff < 14) return 'sidste uge'
  if (diff < 30) return `${Math.floor(diff / 7)} uger siden`
  if (diff < 60) return 'sidste måned'
  if (diff < 365) return `${Math.floor(diff / 30)} måneder siden`
  return `${Math.floor(diff / 365)} år siden`
}

export function dageTil(dato: string | Date): string {
  const d = typeof dato === 'string' ? new Date(dato) : dato
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return `${Math.abs(diff)} dage siden`
  if (diff === 0) return 'i dag'
  if (diff === 1) return 'i morgen'
  if (diff < 7) return `om ${diff} dage`
  if (diff === 7) return 'om en uge'
  if (diff < 14) return 'næste uge'
  if (diff < 30) return `om ${Math.floor(diff / 7)} uger`
  if (diff < 60) return 'næste måned'
  return `om ${Math.floor(diff / 30)} måneder`
}

// ============================================
// Livscyklus → vennligt sprog
// ============================================

/**
 * Vis livscyklus som "Klar til X" eller "X dage X" — ikke "status: spiret"
 */
export function livscyklusVenligt(livscyklus: Livscyklus, sidsteEvent?: string): string {
  switch (livscyklus) {
    case 'i_froebank':
      return 'I frøbanken'
    case 'planlagt':
      return 'Klar til at sås'
    case 'soet':
      return sidsteEvent ? `Sået ${dageSiden(sidsteEvent)}` : 'Sået'
    case 'spiret':
      return 'Klar til prikling'
    case 'priklet':
      return 'Klar til udplantning'
    case 'udplantet':
      return 'Lige plantet ud'
    case 'i_vaekst':
      return 'I vækst'
    case 'afsluttet':
      return 'Afsluttet'
  }
}

// ============================================
// Empty states (ingen presserende sprog)
// ============================================

export const EMPTY_STATES = {
  ingen_opgaver_i_dag:    'Ingen opgaver i dag. Nyd kaffen.',
  ingen_kommende_opgaver: 'Ro på i kalenderen — intet venter.',
  ingen_planter:          'Ingen planter endnu. Begynd med at så et frø.',
  ingen_froe:             'Frøbanken er tom. Tilføj din første pose.',
  ingen_haver:            'Ingen haver oprettet endnu.',
  ingen_placeringer:      'Endnu ingen placeringer i denne have.',
  ingen_noter:            'Ingen noter endnu — skriv dine erfaringer ned.',
  ingen_guides:           'Endnu ingen guides. De oprettes automatisk når du tilføjer planter.',
  ingen_events:           'Ingen begivenheder endnu på denne plante.',
  ingen_resultater:       'Ingen resultater for din søgning.',
  ingen_aktivitet:        'Ingen ny aktivitet at vise.',
} as const

// ============================================
// Begivenhedstekster (event narrative)
// ============================================

export function eventNarrativ(eventType: string, data: Record<string, unknown>, dato: string): string {
  const dag = dageSiden(dato)
  switch (eventType) {
    case 'soet':
      return data.antal ? `Du såede ${data.antal} ${dag}` : `Sået ${dag}`
    case 'spiret':
      return `Spiret ${dag}`
    case 'priklet':
      return data.antal ? `${data.antal} priklet ud ${dag}` : `Priklet ud ${dag}`
    case 'udplantet':
      return `Plantet ud ${dag}`
    case 'vandet':
      return `Vandet ${dag}`
    case 'goedet':
      return `Gødet ${dag}`
    case 'flyttet':
      return `Flyttet ${dag}`
    case 'beskaaret':
      return `Beskåret ${dag}`
    case 'hoestet': {
      const m = data.maengde
      const e = data.enhed ?? 'stk'
      return m ? `Høstede ${m} ${e} ${dag}` : `Høstet ${dag}`
    }
    case 'afsluttet': {
      const aarsag = data.aarsag as string | undefined
      const aarsagTekst: Record<string, string> = {
        frost: 'tog af frosten',
        sygdom: 'blev syg',
        toerke: 'tørrede ud',
        skadedyr: 'blev ædt',
        faerdig: 'er færdig for sæsonen',
        gemt_til_froe: 'gemt til frø',
        ukendt: 'er afsluttet',
      }
      return `${aarsagTekst[aarsag ?? 'ukendt']} ${dag}`
    }
    case 'note':
      return `Note skrevet ${dag}`
    case 'foto':
      return `Foto tilføjet ${dag}`
    default:
      return `Hændelse ${dag}`
  }
}

// ============================================
// Vejr-baserede formuleringer
// ============================================

export function vejrAdvarselTekst(type: 'frost' | 'storm' | 'regn' | 'hede', forklaring: string): string {
  // Rolig tone — ikke "ALARM!"
  switch (type) {
    case 'frost':
      return `Det bliver koldt. ${forklaring}`
    case 'storm':
      return `Det blæser op. ${forklaring}`
    case 'regn':
      return `Der kommer regn. ${forklaring}`
    case 'hede':
      return `Det bliver varmt. ${forklaring}`
  }
}

// ============================================
// AI-formuleringer (lyd som menneske, ikke AI)
// ============================================

export const AI_TONE = {
  haelser:        'Hej.',
  ved_ikke:       'Det er jeg ikke sikker på. Vil du fortælle lidt mere?',
  fejl:           'Noget gik galt — prøv igen om et øjeblik.',
  taenker:        'Lad mig kigge på det…',
} as const

// Undgå disse mønstre i AI-svar:
export const AI_FORBIDDEN_PHRASES = [
  'Jeg har analyseret',
  'Baseret på dine data',
  'Som AI-assistent',
  'Lad mig hjælpe dig',
  'Jeg kan se at',
] as const
