/**
 * Forvandlinger — "Find og gem ekstern opskrift/vejledning" (9. juli 2026).
 *
 * Potalot ejer IKKE opskriften; Potalot ejer forbindelsen:
 *   have → forvandlingsidé → ekstern opskrift/vejledning → gemt erfaring.
 *
 * Denne helper genererer søgefraser + en ekstern søge-URL ud fra en
 * forvandling (titel, kategori, afgrøde, evt. sort). Ren funktion, testbar.
 * Ingen scraping, ingen import af fulde opskrifter — kun en browser-søgning.
 */

import type { HavebogForvandling, ForvandlingKategori } from './havebog-forvandlinger'

// Læsbare afgrøde-navne til søgefraser (normaliserede nøgler → dansk).
const CROP_VISNING: Record<string, string> = {
  tomat: 'tomat', agurk: 'agurk', basilikum: 'basilikum', jordbaer: 'jordbær',
  chili: 'chili', mynte: 'mynte', lavendel: 'lavendel', kamille: 'kamille',
  ribs: 'ribs', morgenfrue: 'morgenfrue', dahlia: 'dahlia',
  tallerkensmaekker: 'tallerkensmækker', aert: 'ært',
}
function cropVisning(key: string): string {
  return CROP_VISNING[key] ?? key
}

// Kategorier hvor man leder efter en "opskrift"; resten en "vejledning".
const OPSKRIFT_KAT: ForvandlingKategori[] = ['spis', 'gem', 'bryg']
export function handlingsOrd(kat: ForvandlingKategori): 'opskrift' | 'vejledning' {
  return OPSKRIFT_KAT.includes(kat) ? 'opskrift' : 'vejledning'
}

/** Kort "næste handling"-linje pr. kategori. */
export function naesteHandling(kat: ForvandlingKategori): string {
  switch (kat) {
    case 'spis': return 'Find en opskrift, du vil prøve.'
    case 'gem': return 'Find en metode til at gemme høsten.'
    case 'bryg': return 'Find en opskrift eller metode, du vil prøve.'
    case 'toer': return 'Find en metode til tørring, der passer til dig.'
    case 'duft': return 'Find en enkel vejledning.'
    case 'plej': return 'Find en kosmetisk vejledning.'
    case 'pynt': return 'Find en enkel vejledning.'
    case 'saa-igen': return 'Find en vejledning til frøavl.'
  }
}

/**
 * Søgefraser til ekstern søgning. Baseret på titel, kategori, primær afgrøde
 * og evt. brugerens sort. Maks 4, uden dubletter.
 */
export function byggForvandlingSoegninger(
  f: HavebogForvandling,
  opts?: { variety?: string },
): string[] {
  const ord = handlingsOrd(f.category)
  const primaerCrop = f.crops[0] ? cropVisning(f.crops[0]) : ''
  const s: string[] = []
  if (primaerCrop) s.push(`${f.title} ${primaerCrop}`)
  s.push(`${f.title} ${ord}`)
  if (opts?.variety) s.push(`${f.title} ${opts.variety}`)
  s.push(`${f.title} hjemmelavet`)
  // Plej: styr søgningen mod kosmetisk brug (ingen medicinske claims).
  if (f.category === 'plej') s.push(`${f.title} kosmetisk brug`)
  return [...new Set(s.map(x => x.trim()))].slice(0, 4)
}

/** Ekstern søge-URL (browser). Ingen scraping — bare en søgning. */
export function googleSoegUrl(q: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

/** Sikker plej-tekst — kosmetisk/hobby, aldrig medicinske claims. */
export const PLEJ_SIKKERHED = 'Kun til kosmetisk brug. Test altid på et lille hudområde først.'
