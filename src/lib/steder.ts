/**
 * Dyrkningssteder — delte helpers, så stedkortenes LINK-generering
 * (mine-steder.tsx) og sted-detail-rutens FILTER (sted/[slug]/page.tsx)
 * bruger nøjagtig samme slug + type-udledning. Ellers risikerer et kort
 * at linke til en slug, ruten ikke kan matche tilbage til lokationen.
 *
 * Steder er (endnu) UDLEDT af plant.location-strenge — ingen sted-entity.
 */

/** Slug af et stednavn til URL'en. æøå før NFD (å → aa, ikke a). */
export function slugifySted(name: string): string {
  return name
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Udled stedtype af navnet (udledte steder har intet type-felt). */
export function inferStedType(name: string): string {
  const n = name.toLowerCase()
  if (/højbed|hojbed|\bbed\b/.test(n)) return 'Højbed'
  if (/drivhus|væksthus/.test(n)) return 'Drivhus'
  if (/vindue|karm/.test(n)) return 'Vindueskarm'
  if (/krukke|potte|\bkar\b/.test(n)) return 'Krukke'
  if (/altan|terrasse|balkon/.test(n)) return 'Altan'
  if (/friland|køkkenhave|mark|jord|frilands/.test(n)) return 'Friland'
  return 'Andet'
}
