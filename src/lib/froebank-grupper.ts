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
import { parseDate } from '@/lib/datetime'
import { kanoniskSortsSlug } from '@/lib/sorts-alias'

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
  // Kanonisk sortsalias: 'Eight Ball' og 'Eight Ball F1' er SAMME sort og
  // skal derfor være samme mappe i Frøbanken. Kun eksplicit verificerede
  // synonymer (sorts-alias.ts) — posens egen tekst ændres aldrig.
  const sort = kanoniskSortsSlug(item.name, item.variety)
  return `${item.primaryCategoryId}|${normaliser(item.name)}|${sort}`
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
      froeTilbage: sumFelt(poser, froeTilbageIPose),
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

// ─────────────────────────────────────────────────────────────
// Udløb og brugsrækkefølge — afledt ved visning, aldrig gemt
// ─────────────────────────────────────────────────────────────

/**
 * Frø tilbage i ÉN fysisk pose.
 *
 * `null` betyder ukendt — ikke nul. Skellet er ægte hele vejen ned:
 * `inventory_items.seed_count` er nullable, og både opret- og
 * redigér-formularen sender tom streng videre som `undefined` (→ null),
 * mens et indtastet "0" bliver til tallet 0. Excel-importen gør det
 * samme (`parseInt0`: tom celle → null). Derfor må visningen ALDRIG
 * kollapse de to med `?? 0`.
 *
 * (Databasens view `inventory_seed_counts` coalescer godt nok
 * seed_count til 0, men dens `seeds_remaining` bruges ikke her —
 * `rowToItem` regner selv resten ud og lader ukendt være undefined.)
 */
export function froeTilbageIPose(
  item: Pick<InventoryItem, 'seedCount' | 'seedsRemaining'>,
): number | null {
  if (item.seedCount == null) return null
  return item.seedsRemaining ?? item.seedCount
}

/**
 * Sortens ÅRGANG for én pose: `purchase_year`, ellers året fra
 * `purchase_date`. Null når posen ikke har nogen af delene.
 */
function poseAargang(item: Pick<InventoryItem, 'purchaseYear' | 'purchaseDate'>): number | null {
  if (item.purchaseYear != null) return item.purchaseYear
  if (item.purchaseDate) return parseDate(item.purchaseDate).getFullYear()
  return null
}

/**
 * Er bedst før-datoen passeret?
 *
 * `expiry_date` er en SQL DATE — en kalenderdato, ikke et tidspunkt.
 * `parseDate` læser den som lokal midnat (samme konvention som resten
 * af appen), og dags dato nulstilles til lokal midnat før sammen-
 * ligningen. En pose der udløber I DAG er altså ikke udløbet endnu.
 */
export function erUdloebet(
  expiryDate: string | null | undefined,
  idag: Date = new Date(),
): boolean {
  if (!expiryDate) return false
  const nu = new Date(idag)
  nu.setHours(0, 0, 0, 0)
  return parseDate(expiryDate).getTime() < nu.getTime()
}

/**
 * Nærmer bedst før-datoen sig — eller er den allerede passeret?
 *
 * Bruges af Frøbankens filter/sortering. Vinduet er 12 måneder, fordi en
 * frøpose bruges inden for en sæson: "inden for det kommende år" er det
 * samme som "brug den i år". Grænsen er en RIGTIG dato, ikke et gæt ud
 * fra købsåret — en pose fra 2019 med bedst før 2031 udløber ikke snart.
 *
 * Poser UDEN bedst før-dato matcher aldrig. Potalot kalder ikke noget
 * "udløber snart" på baggrund af en dato den ikke har.
 */
export function erBedstFoerNaer(
  expiryDate: string | null | undefined,
  idag: Date = new Date(),
  maanederFrem = 12,
): boolean {
  if (!expiryDate) return false
  const graense = new Date(idag)
  graense.setHours(0, 0, 0, 0)
  graense.setMonth(graense.getMonth() + maanederFrem)
  return parseDate(expiryDate).getTime() <= graense.getTime()
}

/** Én poses afledte status. Intet af det gemmes i databasen. */
export interface PoseStatus {
  /** Bedst før-datoen er passeret. Rådgivende — frøene kan stadig spire. */
  udloebet: boolean
  /** Denne pose bør bruges før de andre. Højst én pr. sortsgruppe. */
  brugFoerst: boolean
  /** Frø tilbage i netop denne pose. null = ukendt (ikke 0). */
  froeTilbage: number | null
}

/**
 * Afledt status for hver pose i ÉN sortsgruppe — nøglet på pose-id.
 *
 * "Brug denne først" er rådgivning, ikke en tilstand posen har.
 * Reglerne, i den rækkefølge Potalot tør udtale sig:
 *
 *  1. Én pose i gruppen → ingen anbefaling. Brugeren kan selv regne ud
 *     hvilken pose han skal bruge, når der kun er én.
 *  2. Poser der sikkert er TOMME (0 frø tilbage — ikke ukendt) kan ikke
 *     bruges først. De rangeres ikke med, men vises stadig.
 *  3. Er der kun én brugbar pose tilbage, får den anbefalingen: at de
 *     øvrige er tomme er et fagligt grundlag, ikke et gæt.
 *  4. Ellers sammenlignes poserne på det FØRSTE kriterium der er kendt
 *     for ALLE brugbare poser: bedst før-dato (tidligst først), ellers
 *     årgang (ældst først). En udløbet pose kommer dermed naturligt
 *     før en gyldig — uden at vi kalder den dårlig.
 *  5. Er ingen af kriterierne kendt for alle, gives INGEN anbefaling.
 *     Ukendt er bedre end opdigtet rådgivning: en pose uden årgang kan
 *     lige så godt være fra 2010 som fra i år.
 *
 * `created_at` → `id` bruges kun som stabil tie-breaker INDE i en
 * sammenligning der allerede har et fagligt grundlag (samme udløb,
 * samme årgang), så UI'et ikke hopper. Den forklares aldrig i UI'et,
 * og den kan aldrig alene skabe en anbefaling.
 */
export function poseStatusForSort(
  poser: InventoryItem[],
  idag: Date = new Date(),
): Map<string, PoseStatus> {
  const status = new Map<string, PoseStatus>()
  for (const p of poser) {
    status.set(p.id, {
      udloebet: erUdloebet(p.expiryDate, idag),
      brugFoerst: false,
      froeTilbage: froeTilbageIPose(p),
    })
  }

  if (poser.length < 2) return status

  // Regel 2: kun poser der faktisk kan bruges rangeres. Ukendt antal
  // tæller som brugbar — vi ved ikke at posen er tom.
  const brugbare = poser.filter((p) => froeTilbageIPose(p) !== 0)
  if (brugbare.length === 0) return status

  if (brugbare.length === 1) {
    status.get(brugbare[0].id)!.brugFoerst = true
    return status
  }

  const stabil = (a: InventoryItem, b: InventoryItem) => {
    const tid = (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
    return tid !== 0 ? tid : a.id.localeCompare(b.id)
  }

  let raekkefoelge: InventoryItem[] | null = null

  if (brugbare.every((p) => !!p.expiryDate)) {
    raekkefoelge = [...brugbare].sort((a, b) => {
      const dato = parseDate(a.expiryDate!).getTime() - parseDate(b.expiryDate!).getTime()
      if (dato !== 0) return dato
      const aa = poseAargang(a)
      const ba = poseAargang(b)
      if (aa != null && ba != null && aa !== ba) return aa - ba
      return stabil(a, b)
    })
  } else if (brugbare.every((p) => poseAargang(p) != null)) {
    raekkefoelge = [...brugbare].sort((a, b) => {
      const aar = poseAargang(a)! - poseAargang(b)!
      return aar !== 0 ? aar : stabil(a, b)
    })
  }

  // Regel 5: intet fælles kendt kriterium → ingen anbefaling.
  if (raekkefoelge) status.get(raekkefoelge[0].id)!.brugFoerst = true

  return status
}
