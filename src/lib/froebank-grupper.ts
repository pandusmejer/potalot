/**
 * Frøbank-gruppering: én botanisk sort, flere fysiske frøposer.
 *
 * Datamodellen har ALLEREDE én række pr. fysisk frøpose i
 * `inventory_items` (supplier, purchase_year, expiry_date, seed_count
 * hører til posen). Der findes ingen unik nøgle på art+sort, så to
 * Sungold fra hver sin leverandør lever fint side om side.
 *
 * Det eneste der manglede var VISNINGEN: Frøbankens stak viste én mappe
 * pr. pose. Her samles poserne til én sort, uden at røre rækkerne.
 *
 * Grupperingsnøglen er KUN kategori + art + sort — aldrig leverandør,
 * årgang eller udløb. To poser af samme sort er ikke dubletter; de er
 * to poser.
 */

import type { InventoryItem } from '@/lib/types'

/**
 * Normalisering til nøglebrug. Kun tekniske værdier (ae/oe/aa er
 * tilladt her — nøglen vises aldrig i brugerfladen).
 */
function normaliser(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Stabil nøgle for sorten. Poseoplysninger (leverandør, købsår,
 * udløb, antal) indgår bevidst IKKE.
 */
export function sortsNoegle(item: Pick<InventoryItem, 'name' | 'variety' | 'primaryCategoryId'>): string {
  return `${item.primaryCategoryId}|${normaliser(item.name)}|${normaliser(item.variety)}`
}

/**
 * Er denne `primaryImageId` brugerens EGET foto?
 *
 * Kanonisk regel, ikke filnavns-heuristik: alle uploads i Potalot går
 * gennem /api/upload, /api/images/upload eller actions/storage.ts, og de
 * returnerer ALTID en absolut Supabase-storage-URL. Et lokalt
 * `/images/…` har derfor aldrig kunnet komme fra en bruger — det er et
 * Potalot-billede, der er skrevet ind i rækken (fx de gamle
 * `/images/froebank/froekort-*.png` fra seed-data).
 *
 * Skellet bruges KUN til at vælge sortens forsidefoto. Selve resolveren
 * er urørt: den validerer stadig enhver preferredSrc mod manifestet.
 */
export function erBrugerfoto(src: string | null | undefined): boolean {
  return !!src && /^https?:\/\//.test(src)
}

/**
 * Sortens forsidefoto på tværs af dens fysiske frøposer.
 *
 * Potalot-frøkortet tilhører SORTEN og resolves ved visning; brugerens
 * eget foto tilhører den enkelte pose. Har mindst én pose et eget foto,
 * repræsenterer det hele sorten — ellers returneres null, og resolveren
 * finder sortens frøkort.
 *
 * Valget er bevidst uafhængigt af hvilken pose der er grupperepræsentant
 * og af brugerens sortering (A–Å, udløb, nyeste …): vi tager det ÆLDST
 * oprettede brugerfoto, med id som tiebreaker. Så skifter gridets billede
 * hverken ved omsortering eller når brugeren tilføjer endnu en pose.
 */
export function gruppensForsidefoto(poser: InventoryItem[]): string | null {
  const medFoto = poser.filter((p) => erBrugerfoto(p.primaryImageId))
  if (medFoto.length === 0) return null
  const valgt = [...medFoto].sort((a, b) => {
    const tid = (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
    if (tid !== 0) return tid
    return a.id.localeCompare(b.id)
  })[0]
  return valgt.primaryImageId ?? null
}

export interface SortsGruppe {
  noegle: string
  /** Posen der repræsenterer sorten i stakken (første i den givne rækkefølge). */
  hoved: InventoryItem
  /** Alle brugerens poser af denne sort — inkl. `hoved`. */
  poser: InventoryItem[]
  antalPoser: number
  /** Samlet antal frø tilbage på tværs af poserne (null hvis ingen pose har tal). */
  froeTilbage: number | null
  /** Samlet oprindeligt antal frø (null hvis ingen pose har tal). */
  froeIAlt: number | null
  /**
   * Sortens forsidefoto: brugerfotoet fra én af poserne, valgt
   * deterministisk (se `gruppensForsidefoto`). Null = ingen pose har eget
   * foto → visningen resolver sortens Potalot-frøkort.
   */
  forsidefoto: string | null
}

function sumFelt(
  poser: InventoryItem[],
  vaelg: (i: InventoryItem) => number | null | undefined,
): number | null {
  let sum = 0
  let harTal = false
  for (const p of poser) {
    const v = vaelg(p)
    if (v != null) {
      sum += v
      harTal = true
    }
  }
  return harTal ? sum : null
}

/**
 * Saml en (allerede filtreret og sorteret) liste af frøposer til
 * sortsgrupper. Rækkefølgen af grupperne følger rækkefølgen af den
 * første pose i hver gruppe, så eksisterende sortering holder.
 */
export function grupperEfterSort(items: InventoryItem[]): SortsGruppe[] {
  const orden: string[] = []
  const kort = new Map<string, InventoryItem[]>()

  for (const item of items) {
    const noegle = sortsNoegle(item)
    const eksisterende = kort.get(noegle)
    if (eksisterende) {
      eksisterende.push(item)
    } else {
      kort.set(noegle, [item])
      orden.push(noegle)
    }
  }

  return orden.map((noegle) => {
    const poser = kort.get(noegle)!
    return {
      noegle,
      hoved: poser[0],
      poser,
      antalPoser: poser.length,
      froeTilbage: sumFelt(poser, (p) => p.seedsRemaining ?? p.seedCount),
      froeIAlt: sumFelt(poser, (p) => p.seedCount),
      forsidefoto: gruppensForsidefoto(poser),
    }
  })
}

/** Poseoplysninger til ét frøkort i stakken. */
export interface PoseInfo {
  antalPoser: number
  froeTilbage: number | null
  froeIAlt: number | null
  /**
   * Sortens forsidefoto — brugerfoto fra en af poserne, eller null når
   * ingen pose har et. Frøkortet er IKKE med her; det resolves ved
   * visning ud fra art+sort.
   */
  forsidefoto: string | null
}

/**
 * Opslag fra hoved-posens id → gruppens poseoplysninger. Grupper med
 * kun én pose udelades, så frøkortet forbliver præcis som før for
 * brugere der har én pose pr. sort.
 */
export function poseInfoEfterHovedId(grupper: SortsGruppe[]): Map<string, PoseInfo> {
  const map = new Map<string, PoseInfo>()
  for (const g of grupper) {
    if (g.antalPoser < 2) continue
    map.set(g.hoved.id, {
      antalPoser: g.antalPoser,
      froeTilbage: g.froeTilbage,
      froeIAlt: g.froeIAlt,
      forsidefoto: g.forsidefoto,
    })
  }
  return map
}

/**
 * Sortér poser inden for en sort: nyeste købsår først, derefter
 * nyeste oprettelse. Bruges på sortens detaljeside.
 */
export function sorterPoser(poser: InventoryItem[]): InventoryItem[] {
  return [...poser].sort((a, b) => {
    const aar = (b.purchaseYear ?? -Infinity) - (a.purchaseYear ?? -Infinity)
    if (aar !== 0) return aar
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  })
}
