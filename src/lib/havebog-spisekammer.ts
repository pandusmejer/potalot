/**
 * Spisekammer-motoren (Fase E, 9. juli 2026) — have → høst → køkken.
 *
 * Grupperer høst-logs fra den AKTIVE sæson pr. afgrøde og viser de mest
 * høstede (max 3) + et par køkken-forslag. Ikke lagerstyring, ikke
 * dashboard — rolig, redaktionel inspiration til hvad høsten kan blive til.
 *
 * Ærligt tal: plant_logs_v2 har ingen mængde-felt, så `antal` = antal
 * høst-registreringer pr. afgrøde i sæsonen ("mest høstet"). Ingen
 * fabrikerede vægte. Skjules når der ikke er høst (null).
 *
 * Ren funktion — testet i scripts/test-havebog-spisekammer.ts.
 */

import type { SpisekammerData } from '@/data/havebog-demo'

export interface HoestEntry {
  /** Afgrødens/artens navn (fra planten). */
  art: string
  /** ISO-dato (YYYY-MM-DD). */
  date: string
}

function norm(s: string): string {
  return s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').trim()
}
function artKey(s: string): string {
  return norm(s).split(/[\s-]/)[0]
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Kurateret afgrøde → køkken-forslag (hortikulturelt/kulinarisk fornuftigt).
const OPSKRIFTER: Record<string, string[]> = {
  tomat: ['Tomatsalat', 'Gazpacho', 'Passata'],
  jordbaer: ['Jordbærtærte', 'Jordbær med fløde'],
  agurk: ['Agurkesalat', 'Tzatziki'],
  chili: ['Chiliolie', 'Salsa'],
  peberfrugt: ['Fyldte peberfrugter', 'Ratatouille'],
  kartoffel: ['Kartoffelsalat', 'Ovnkartofler'],
  squash: ['Grillet squash', 'Squashboller'],
  aebler: ['Æblekage', 'Most'],
  aeble: ['Æblekage', 'Most'],
  gulerod: ['Gulerodssuppe', 'Råkost'],
  salat: ['Sommersalat'],
  aert: ['Ærtepesto'],
  sukkeraert: ['Ærtepesto'],
  boenne: ['Bønnesalat'],
  stangboenne: ['Bønnesalat'],
  rabarber: ['Rabarberkompot', 'Rabarbertærte'],
  hindbaer: ['Hindbærsnitter', 'Hindbærsylt'],
}

/**
 * Byg spisekammeret ud fra sæsonens høst-logs. Null hvis ingen høst.
 */
export function byggSpisekammer(hoest: HoestEntry[]): SpisekammerData | null {
  if (hoest.length === 0) return null

  const grupper = new Map<string, { navn: string; antal: number; seneste: string }>()
  for (const h of hoest) {
    const key = artKey(h.art)
    const g = grupper.get(key)
    if (g) {
      g.antal += 1
      if (h.date > g.seneste) g.seneste = h.date
    } else {
      // Display-navn bevarer original æøå (kun nøglen normaliseres).
      const navn = capitalize(h.art.trim().split(/[\s-]/)[0])
      grupper.set(key, { navn, antal: 1, seneste: h.date })
    }
  }

  const sorteret = [...grupper.entries()]
    // Mest høstet; tie-break: nyligst høstet.
    .sort((a, b) => b[1].antal - a[1].antal || b[1].seneste.localeCompare(a[1].seneste))
  const top = sorteret.slice(0, 3)

  const opskrifter: string[] = []
  for (const [key] of top) {
    for (const o of OPSKRIFTER[key] ?? []) {
      if (!opskrifter.includes(o)) opskrifter.push(o)
      if (opskrifter.length >= 3) break
    }
    if (opskrifter.length >= 3) break
  }

  return {
    hoest: top.map(([, g]) => ({ navn: g.navn, antal: String(g.antal) })),
    opskrifter,
  }
}
