/**
 * Senest læste guides — client-side hukommelse (localStorage), ingen backend.
 *
 * Bruges af "FORTSÆT DINE GUIDES" på /guides: brugere genlæser de samme 5-10
 * guides igen og igen, så en genvej til dem sparer en søgning. Virker for både
 * demo (anonym) og indloggede, da det er per-browser. Fejler stille hvis
 * localStorage er utilgængelig (privat browsing).
 *
 * Vi gemmer et tidsstempel pr. åbning, så sektionen kan vise en ægte
 * hukommelsesstøtte ("Læst i går") frem for en generisk undertitel.
 */

const KEY = 'potalot:recently-read-guides'
const CAP = 12

export interface RecentRead {
  id: string
  /** ms siden epoch. 0 for legacy-poster uden tidsstempel. */
  at: number
}

/** Registrér at en guide er åbnet. Rykker den forrest, dedup, cap på CAP. */
export function recordGuideRead(id: string): void {
  if (typeof window === 'undefined' || !id) return
  try {
    const list = getRecentlyRead().filter(r => r.id !== id)
    list.unshift({ id, at: Date.now() })
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP)))
  } catch {
    // localStorage utilgængelig → stille no-op
  }
}

/** Senest læste guides, senest først. */
export function getRecentlyRead(): RecentRead[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      // Bagudkompatibel: tidligere format var en ren id-streng-liste.
      .map(x => (typeof x === 'string' ? { id: x, at: 0 } : x))
      .filter(
        (r): r is RecentRead =>
          !!r && typeof r.id === 'string' && typeof r.at === 'number',
      )
  } catch {
    return []
  }
}
