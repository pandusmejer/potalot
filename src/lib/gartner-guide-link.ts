import { GUIDE_FACTS } from '@/data/guide-facts-index.generated'

/**
 * Resolver Gartnerens "Relevant guide"-navn mod Potalots faktiske
 * guide-inventory (Anna 10/8): AI'en må ALDRIG selv producere en URL eller
 * et guidenavn, der ikke findes. Prompten beder modellen skrive navnet
 * PRÆCIS som det står i konteksten ("Tomat" eller "Tomat 'San Marzano'");
 * her valideres det mod det slanke guide-indeks, før UI'et renderer et link.
 * Ingen match → intet link, og hele sektionen skjules.
 */

export interface GartnerGuideLink {
  id: string
  titel: string
}

/** Samme slug-regler som scripts/import-guides.ts bruger til guide-id'er. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function resolveGuideLink(navn: string): GartnerGuideLink | null {
  const renset = navn.trim().replace(/[→.,:]+$/, '').trim()
  if (!renset || renset.length > 60) return null

  const slug = slugify(renset)
  const lav = renset.toLowerCase().replace(/['’]/g, '')

  const guide =
    // "Tomat 'San Marzano'" → tomat-san-marzano, "Tomat" → tomat
    GUIDE_FACTS.find(g => g.id === slug) ??
    // Artsnavn alene, uanset kasus/bøjning fra modellen
    GUIDE_FACTS.find(g => !g.variety && g.plantName?.toLowerCase() === lav) ??
    // Sortsnavn alene ("San Marzano")
    GUIDE_FACTS.find(g => g.variety && g.variety.toLowerCase().replace(/['’]/g, '') === lav)

  if (!guide) return null
  return {
    id: guide.id,
    titel: guide.variety
      ? `${guide.plantName ?? ''} '${guide.variety}'`.trim()
      : (guide.plantName ?? renset),
  }
}
