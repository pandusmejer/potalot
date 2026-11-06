/**
 * Frøbankens kompakte liste (MVP 1.0, fase 1) — rene regler uden UI.
 *
 * Alt her er AFLEDT ved visning af de felter, der allerede findes på
 * frøposerne. Intet gemmes, og der indføres ingen grænseværdier: listen
 * viser antal og dato, men kalder aldrig noget "lavt" (låst 24/8 — uden
 * artsdata kan Potalot ikke afgøre, om 5 frø er få).
 *
 * Bygger oven på froebank-grupper.ts (én sort, flere fysiske poser) og
 * arts-model.ts (kanonisk art) — der er ingen parallel klassifikation.
 */

import type { InventoryItem } from '@/lib/types'
import { manglerOplysninger } from '@/lib/constants'
import { parseDate } from '@/lib/datetime'
import { kanoniskArtsNavn, kanoniskArtsSlug } from '@/lib/arts-model'
import { erUdloebet, sortsNoegle, type SortsGruppe } from '@/lib/froebank-grupper'

// ─────────────────────────────────────────────────────────────
// Beholdning
// ─────────────────────────────────────────────────────────────

export interface Maengde {
  /** null = ukendt. 0 er et ægte tal (posen er tom). */
  antal: number | null
  /** Frø tælles i frø; løg, knolde og planter i styk (feltet `quantity`). */
  enhed: 'frø' | 'stk'
}

/**
 * Sortens samlede beholdning på tværs af dens poser.
 *
 * Frøantallet (seed_count minus såninger) vinder, når mindst én pose har
 * det. Ellers bruges `quantity`, som løg, knolde og planter registreres i.
 * Har ingen pose et tal, er beholdningen UKENDT — ikke nul.
 */
export function maengdeForSort(gruppe: Pick<SortsGruppe, 'froeTilbage' | 'poser'>): Maengde {
  if (gruppe.froeTilbage != null) return { antal: gruppe.froeTilbage, enhed: 'frø' }
  let sum = 0
  let harTal = false
  for (const p of gruppe.poser) {
    if (p.quantity != null) {
      sum += p.quantity
      harTal = true
    }
  }
  return harTal ? { antal: sum, enhed: 'stk' } : { antal: null, enhed: 'frø' }
}

export function maengdeTekst(m: Maengde): string {
  if (m.antal == null) return 'Antal ukendt'
  return `${m.antal} ${m.enhed}`
}

/**
 * Færrest først. Ukendt antal ligger ALTID sidst: en pose uden tal er ikke
 * tom, så den må ikke stå øverst som om den skulle genanskaffes.
 */
export function sammenlignMaengde(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return a - b
}

// ─────────────────────────────────────────────────────────────
// Udløb
// ─────────────────────────────────────────────────────────────

/**
 * Forklaringen til statussen UDLØBET (låst 6/11 2026). Bedst før-datoen er
 * rådgivende: en passeret dato gør ikke frøene ubrugelige. Ordet UDLØBET,
 * filtret "Udløber snart" og sorteringen "Udløber først" er uændrede.
 */
export const UDLOEBET_FORKLARING =
  'Frøene kan stadig være spiredygtige. Overvej at teste spireevnen.'

export interface UdloebForSort {
  /** Tidligste og seneste bedst før-år blandt sortens poser. null = ingen dato. */
  aarFra: number | null
  aarTil: number | null
  /** Hvor mange af sortens poser har en passeret bedst før-dato. */
  antalUdloebet: number
  /**
   * Sandt kun når HVER pose har en passeret dato. En pose uden dato er ikke
   * udløbet — vi ved det bare ikke — så den holder sorten ude af "alle".
   */
  alleUdloebet: boolean
}

export function udloebForSort(
  poser: Pick<InventoryItem, 'expiryDate'>[],
  idag: Date = new Date(),
): UdloebForSort {
  const aar = poser
    .filter((p) => !!p.expiryDate)
    .map((p) => parseDate(p.expiryDate!).getFullYear())
  const antalUdloebet = poser.filter((p) => erUdloebet(p.expiryDate, idag)).length
  return {
    aarFra: aar.length ? Math.min(...aar) : null,
    aarTil: aar.length ? Math.max(...aar) : null,
    antalUdloebet,
    alleUdloebet: poser.length > 0 && antalUdloebet === poser.length,
  }
}

/** "Bedst før 2027" · "Bedst før 2024–2028" · null når ingen pose har en dato. */
export function udloebTekst(u: UdloebForSort): string | null {
  if (u.aarFra == null || u.aarTil == null) return null
  return u.aarFra === u.aarTil
    ? `Bedst før ${u.aarFra}`
    : `Bedst før ${u.aarFra}–${u.aarTil}`
}

/** "UDLØBET" når hele sorten er passeret, ellers "1 pose udløbet". null = intet at melde. */
export function udloebMaerkat(u: UdloebForSort): string | null {
  if (u.antalUdloebet === 0) return null
  if (u.alleUdloebet) return 'UDLØBET'
  return `${u.antalUdloebet} ${u.antalUdloebet === 1 ? 'pose' : 'poser'} udløbet`
}

// ─────────────────────────────────────────────────────────────
// Art og sort
// ─────────────────────────────────────────────────────────────

/**
 * Sortsnavnet, som A–Å sorterer på. En pose uden sort sorteres på sin art,
 * så den ikke forsvinder i bunden eller toppen af listen.
 */
export function sortsnavn(item: Pick<InventoryItem, 'name' | 'variety'>): string {
  return item.variety?.trim() || item.name
}

/** A–Å på sortsnavn; ens sortsnavne skilles på art. */
export function sammenlignSortsnavn(
  a: Pick<InventoryItem, 'name' | 'variety'>,
  b: Pick<InventoryItem, 'name' | 'variety'>,
): number {
  const sort = sortsnavn(a).localeCompare(sortsnavn(b), 'da')
  return sort !== 0 ? sort : a.name.localeCompare(b.name, 'da')
}

/** Art A–Å, derefter sort A–Å — listens standardrækkefølge. */
export function sammenlignArtOgSort(
  a: Pick<InventoryItem, 'name' | 'variety'>,
  b: Pick<InventoryItem, 'name' | 'variety'>,
): number {
  const art = a.name.localeCompare(b.name, 'da')
  return art !== 0 ? art : (a.variety ?? '').localeCompare(b.variety ?? '', 'da')
}

/** Artsnøglen filteret matcher på — artsmodellens kanoniske slug. */
export function artsNoegle(item: Pick<InventoryItem, 'name'>): string {
  return kanoniskArtsSlug(item.name)
}

export interface ArtsValg {
  slug: string
  /** Kanonisk artsnavn i visningsform ("Bønne" for både Bønner og Stangbønne). */
  label: string
  /** Antal SORTER (ikke poser) af arten. */
  antalSorter: number
}

/**
 * Arterne i et udsnit af frøbanken, A–Å, med antal sorter pr. art.
 *
 * Går gennem artsmodellen, så "Skoleagurk" og "Agurk" er ÉN art i filteret,
 * præcis som de er én mappe i grupperingen. Foto-kun-kladder uden navn
 * ("Frøpose uden navn") er ikke en art og holdes ude.
 */
export function artsValg(
  items: Pick<InventoryItem, 'name' | 'variety' | 'primaryCategoryId'>[],
): ArtsValg[] {
  const arter = new Map<string, { label: string; sorter: Set<string> }>()
  for (const item of items) {
    if (manglerOplysninger(item)) continue
    const slug = artsNoegle(item)
    if (!slug) continue
    let post = arter.get(slug)
    if (!post) {
      const navn = kanoniskArtsNavn(item.name)
      post = { label: navn.charAt(0).toLocaleUpperCase('da') + navn.slice(1), sorter: new Set() }
      arter.set(slug, post)
    }
    post.sorter.add(sortsNoegle(item))
  }
  return [...arter.entries()]
    .map(([slug, p]) => ({ slug, label: p.label, antalSorter: p.sorter.size }))
    .sort((a, b) => a.label.localeCompare(b.label, 'da'))
}
