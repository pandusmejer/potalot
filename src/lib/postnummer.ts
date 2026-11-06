import { POSTNUMRE_DK, type PostnummerRække } from '@/data/postnumre-dk.generated'

/**
 * Postnummer → stednavn + omtrentlig koordinat, slået op i den lokale tabel
 * (GeoNames, CC BY 4.0 — se data/kilder/README.md). Ren, synkron og uden
 * netværk: der er intet, der kan fejle teknisk. Ukendt, ugyldigt eller
 * udeladt (ikke-geografisk) postnummer giver null.
 *
 * ⚠️ SERVER-ONLY: importerer 53 kB data. Importér ikke fra klientkode —
 * scripts/test-postnummer.ts fejler hvis en 'use client'-fil gør det.
 * (Pakken 'server-only' er bevidst ikke tilføjet: ingen ny dependency.)
 */

export interface PostnummerHit {
  name: string
  latitude: number
  longitude: number
  /** Postnummer som firecifret streng */
  postnr: string
}

export function findPostnummer(postnr: string): PostnummerHit | null {
  if (typeof postnr !== 'string') return null
  const nr = postnr.trim()
  if (!/^\d{4}$/.test(nr)) return null
  // Object.hasOwn: "constructor" og andre prototype-nøgler må aldrig ramme.
  if (!Object.hasOwn(POSTNUMRE_DK, nr)) return null
  const [name, latitude, longitude]: PostnummerRække = POSTNUMRE_DK[nr]
  return { name, latitude, longitude, postnr: nr }
}
