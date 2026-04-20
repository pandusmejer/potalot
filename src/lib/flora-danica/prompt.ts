/**
 * Flora Danica-prompt-skabelon.
 *
 * Sikrer konsistens på tværs af AI-genererede illustrationer:
 *  - linje-tykkelse (tynd kobberstuk)
 *  - papir-tekstur (cremefarvet pergament)
 *  - palet-begrænsning (støvede, naturlige toner)
 *  - komposition (hel plante med rod/blad/blomst/frugt hvor relevant)
 */

export interface PromptInput {
  species_name: string       // "Tomat"
  variety_name?: string | null   // "San Marzano"
  botanical_name?: string | null // "Solanum lycopersicum"
  part?: 'fuld_planche' | 'froe_detalje' | 'blomst_detalje' | 'frugt_detalje' | 'blad_detalje'
}

const STIL_BASELINE = `Botanisk illustration i Flora Danica-stil fra 1761-1883.
Æstetik: kobberstuk-linje, fine hånd-tegnede streger, håndfarvet med akvarel.
Papir: lys cremefarvet pergament-baggrund med subtil alderspatina.
Palet: støvet grøn, dæmpet rose, blødt brun, okker — aldrig mættede farver.
Komposition: botanisk illustration centreret på siden, generøs hvidplads.
Linje-kvalitet: tynde, præcise konturer, fine detaljer på årer og blade.
Ingen tekst i billedet. Ingen moderne elementer. Ingen fotografi-kvalitet.
Videnskabeligt præcis, tidløs og naturhistorisk.`

const PART_INSTRUKTIONER: Record<NonNullable<PromptInput['part']>, string> = {
  fuld_planche: 'Hel plante med rod, stilk, blade, blomster og frugt alle synlige hvor relevant, som i en klassisk botanisk planche.',
  froe_detalje: 'Tæt-på detalje af frøene — et eller flere frø med klar visning af form, overflade og relative størrelse.',
  blomst_detalje: 'Tæt-på detalje af blomsten, enkelt eksemplar centreret, med synlige kronblade, støvdragere og stilk.',
  frugt_detalje: 'Tæt-på detalje af frugten, enkelt eksemplar eller klase, med synlig stilk og detaljeret overflade.',
  blad_detalje: 'Tæt-på detalje af bladet, enkelt eksemplar centreret, med tydelige bladårer og form.',
}

export function byggFloraDanicaPrompt(input: PromptInput): string {
  const part = input.part ?? 'fuld_planche'
  const botanical = input.botanical_name ? ` (${input.botanical_name})` : ''
  const variety = input.variety_name ? `, sort: ${input.variety_name}` : ''

  return `${STIL_BASELINE}

Plante: ${input.species_name}${variety}${botanical}.
Komposition: ${PART_INSTRUKTIONER[part]}`
}

export const STANDARD_BILLED_STR = '1024x1024'
export const STANDARD_KVALITET: 'low' | 'medium' | 'high' | 'auto' = 'medium'
