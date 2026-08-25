/**
 * Excel-import: berigelse FØR oprettelse.
 *
 * Pipelinen (Annas oplæg, opgave 2):
 *
 *   Excel-række
 *     → normalisér art/sort/leverandør
 *     → hvis link findes: læs link
 *     → merge data
 *     → Potalot sort-autofill
 *     → Potalot art-autofill
 *     → resolve frøkort
 *     → validér
 *     → vis review
 *     → FØRST derefter oprettelse
 *
 * MERGE-PRIORITET (LÅST):
 *   1. Excel        — brugerens egen fil vinder altid
 *   2. Link         — produktsiden
 *   3. Potalot sort — sortsguiden
 *   4. Potalot art  — artsguiden
 *   5. STOP         — kategori er ALDRIG datakilde; tomt felt forbliver tomt
 *
 * En allerede udfyldt Excel-værdi overskrives ALDRIG automatisk. Er filen
 * og linket uenige, beholder vi filens værdi og VISER uenigheden i review.
 *
 * Modulet er rent (ingen I/O) så det kan køre både på server og i
 * review-fladen. Lag 3+4 kommer fra findFroebankAutofill, som allerede
 * afgør sort-før-art pr. felt.
 */

import { findFroebankAutofill } from '@/lib/froebank-autofill'
import { resolveSeedCard } from '@/lib/images/resolve-potalot-image'
import type { PrimaryCategoryId } from '@/lib/types'
import type { ExtractedSeedFields } from '@/actions/seed-packet-extract'

/** Rå Excel-værdier — præcis som de stod i filen (efter normalisering). */
export interface ImportRowData {
  name?: string
  latinName?: string
  variety?: string
  seedCount?: number
  quantity?: number
  purchaseYear?: number
  purchaseDate?: string
  expiryDate?: string
  supplier?: string
  purchaseUrl?: string
  notes?: string
  // Dyrkningsfakta brugeren selv har skrevet i regnearket. Står de i
  // filen, er de brugerens egne tal og vinder over både link og guider.
  sowingMonths?: number[]
  sowingDepthMm?: number
  preCultivation?: boolean
  plantingOutMonths?: number[]
  harvestMonths?: number[]
  light?: 'full_sun' | 'partial_shade' | 'shade'
  water?: 'low' | 'regular' | 'high'
  soil?: string
  germinationDays?: string
  germinationTemperature?: string
  plantSpacing?: string
  rowSpacing?: string
}

export interface ImportRow {
  rowNumber: number
  status: 'ready' | 'warning' | 'error'
  warnings: string[]
  errors: string[]
  data: ImportRowData
}

export interface ParseResult {
  rows: ImportRow[]
  unmappedColumns: string[]
}

/** Resultatet af ét link-opslag. Fejl er en tilstand, ikke en undtagelse. */
export type LinkResult =
  | { ok: true; fields: ExtractedSeedFields; primaryImageUrl: string | null; sourceUrl: string }
  | { ok: false }

/**
 * Hvor en færdig værdi kom fra. Rækkefølgen ER merge-prioriteten:
 * brugerens egen rettelse i reviewet ligger ØVERST — den må hverken
 * linket eller Potalots guider skrive hen over bagefter.
 */
export type ImportFeltKilde = 'egen' | 'excel' | 'link' | 'sort' | 'art'

/**
 * Felter brugeren kan rette i reviewet, før noget oprettes. Bevidst
 * begrænset til identitet og poseoplysninger — dét, en automatisk import
 * realistisk kan tage fejl af. Dyrkningsfakta autofyldes fortsat og rettes
 * på frøkortet bagefter.
 *
 * At NØGLEN findes tæller som "rettet", også når værdien er tom: rydder
 * brugeren leverandøren, skal den blive tom — ikke fyldes op af linket igen.
 */
export interface ImportRettelser {
  name?: string
  variety?: string
  supplier?: string
  purchaseYear?: number | null
  expiryDate?: string
  seedCount?: number | null
  purchaseUrl?: string
  primaryCategoryId?: PrimaryCategoryId
}

/** Felter i den rækkefølge, redigeringsformularen viser dem. */
export const RETTELSE_FELTER = [
  'name', 'variety', 'supplier', 'purchaseYear', 'expiryDate', 'seedCount', 'purchaseUrl',
] as const satisfies readonly (keyof ImportRettelser)[]

export interface ImportKonflikt {
  felt: string
  label: string
  /** Brugerens fil — den vi beholder. */
  fil: string
  /** Linkets bud — den vi kasserer. */
  link: string
}

/** Alle felter en importeret række kan bære videre til oprettelsen. */
export interface ImportValues {
  name: string
  latinName?: string
  variety?: string
  supplier?: string
  primaryCategoryId: PrimaryCategoryId
  seedCount?: number
  /** Stk-antal for løg/knolde/planter — frø tælles i seedCount. */
  quantity?: number
  purchaseYear?: number
  purchaseDate?: string
  purchaseUrl?: string
  expiryDate?: string
  notes?: string
  sowingMonths?: number[]
  sowingDepthMm?: number
  preCultivation?: boolean
  plantingOutMonths?: number[]
  harvestMonths?: number[]
  light?: 'full_sun' | 'partial_shade' | 'shade'
  water?: 'low' | 'regular' | 'high'
  soil?: string
  germinationDays?: string
  germinationTemperature?: string
  plantSpacing?: string
  rowSpacing?: string
  imageUrls?: string[]
  primaryImageUrl?: string
}

export type EnrichedStatus = 'klar' | 'delvist' | 'link_fejl' | 'fejl'

export interface EnrichedImportRow {
  rowNumber: number
  status: EnrichedStatus
  warnings: string[]
  errors: string[]
  /** Rå Excel-data — bevares uændret så review kan vise "Din fil". */
  excel: ImportRowData
  values: ImportValues
  fieldSources: Partial<Record<keyof ImportValues, ImportFeltKilde>>
  konflikter: ImportKonflikt[]
  linkStatus: 'ingen' | 'ok' | 'fejl'
  /** Findes der et kurateret Potalot-frøkort for sorten? */
  harFroekort: boolean
  /** Nøgle for "samme sort" — bruges KUN til at forklare, aldrig til dedup. */
  sortsNoegle: string
  /** Sat når flere rækker deler sortsNoegle: to fysiske frøposer, begge beholdes. */
  flerePoserNote: string | null
  /** Brugerens egne rettelser fra reviewet — vinder over alt andet. */
  rettelser: ImportRettelser
}

// ── Normalisering ────────────────────────────────────────────────────────

/** Trim + saml mellemrum. Ændrer ALDRIG selve ordene. */
function stram(v: string | undefined): string | undefined {
  if (v == null) return undefined
  const s = v.replace(/\s+/g, ' ').trim()
  return s.length > 0 ? s : undefined
}

/** Fjern omsluttende anførselstegn — regneark skriver ofte 'Sungold'. */
function afQuote(v: string | undefined): string | undefined {
  const s = stram(v)
  if (!s) return undefined
  const m = s.match(/^["'‘’“”](.+)["'‘’“”]$/)
  return m ? stram(m[1]) : s
}

/** Stort begyndelsesbogstav — kun når hele feltet er skrevet med små. */
function storForbogstav(v: string): string {
  if (v !== v.toLowerCase()) return v
  return v.charAt(0).toUpperCase() + v.slice(1)
}

/**
 * Normalisér art/sort/leverandør før alt andet.
 *
 * Ud over trimning splitter vi den entydige regnearks-form
 * "Tomat 'Sungold'" til art + sort, så autofill kan slå sorten op. Kun
 * ved anførselstegn — vi gætter aldrig på et mellemrum.
 */
export function normaliserImportRaekke(data: ImportRowData): ImportRowData {
  const next: ImportRowData = { ...data }

  let name = stram(next.name)
  let variety = afQuote(next.variety)

  if (name) {
    const m = name.match(/^(.+?)\s+["'‘’“”](.+)["'‘’“”]$/)
    if (m) {
      const art = stram(m[1])
      const sort = stram(m[2])
      if (art && sort) {
        name = art
        if (!variety) variety = sort
      }
    }
    name = storForbogstav(name)
  }

  next.name = name
  // Samme behandling som arten: "sungold" → "Sungold". Grupperingen er
  // alligevel case-ufølsom, men to poser af samme sort skal ikke stå med
  // hver sit begyndelsesbogstav i Frøbanken.
  next.variety = variety ? storForbogstav(variety) : undefined
  next.latinName = stram(next.latinName)
  next.supplier = stram(next.supplier)
  next.purchaseUrl = stram(next.purchaseUrl)
  next.notes = stram(next.notes)
  next.soil = stram(next.soil)
  next.germinationDays = stram(next.germinationDays)
  next.germinationTemperature = stram(next.germinationTemperature)
  next.plantSpacing = stram(next.plantSpacing)
  next.rowSpacing = stram(next.rowSpacing)
  return next
}

/**
 * Sådybde fra fritekst — samme præcisionsregel som frøpose-læsningen:
 * "5 mm" → 5. "2–5 mm" er et INTERVAL og må aldrig blive til 3. Uden et
 * egnet struktureret felt lader vi sådybden være tom.
 */
export function parseSowingDepth(raw: unknown): { mm: number | null; interval: boolean } {
  if (raw == null || raw === '') return { mm: null, interval: false }
  if (typeof raw === 'number') return { mm: Math.round(raw), interval: false }
  const s = String(raw).replace(',', '.').trim().toLowerCase()

  // Interval først — ellers ville "2-5" blive læst som tallet 2.
  if (/^\d+(?:\.\d+)?\s*(?:-|–|—|til)\s*\d+(?:\.\d+)?\s*(?:mm|cm)?$/.test(s)) {
    return { mm: null, interval: true }
  }

  const m = s.match(/^(\d+(?:\.\d+)?)\s*(mm|cm)?$/)
  if (!m) return { mm: null, interval: false }
  const tal = parseFloat(m[1])
  if (isNaN(tal)) return { mm: null, interval: false }
  return { mm: Math.round(m[2] === 'cm' ? tal * 10 : tal), interval: false }
}

// ── Dyrkningsfelter fra regnearket ───────────────────────────────────────
//
// Samme præcisionsregel som sådybde hele vejen: står der noget entydigt i
// cellen, læser vi det. Er det tvetydigt, lader vi feltet stå tomt og
// siger det i reviewet. Vi gætter aldrig for at få en celle til at "tælle".

const MAANED_NAVNE: Record<string, number> = {
  jan: 1, januar: 1, feb: 2, februar: 2, mar: 3, marts: 3, apr: 4, april: 4,
  maj: 5, jun: 6, juni: 6, jul: 7, juli: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, okt: 10, oktober: 10,
  nov: 11, november: 11, dec: 12, december: 12,
}

function eenMaaned(bid: string): number | null {
  const s = bid.trim().toLowerCase().replace(/\.$/, '')
  if (!s) return null
  if (/^\d{1,2}$/.test(s)) {
    const n = parseInt(s, 10)
    return n >= 1 && n <= 12 ? n : null
  }
  return MAANED_NAVNE[s] ?? null
}

/**
 * Måneder fra en regnearkscelle.
 *
 * Forstår lister ("3, 4, 5" · "mar, apr" · "marts/april") og intervaller
 * ("3-5" · "mar–maj"). Et interval mellem måneder er IKKE det samme
 * tvetydige tilfælde som et sådybde-interval: "mar-maj" betyder utvetydigt
 * marts, april og maj. Vender intervallet årsskiftet ("nov-feb"), læser vi
 * det den vej rundt.
 *
 * Alt andet → `uklar: true`, feltet står tomt, og reviewet siger hvorfor.
 */
export function parseMaaneder(raw: unknown): { months: number[] | null; uklar: boolean } {
  if (raw == null || raw === '') return { months: null, uklar: false }
  if (typeof raw === 'number') {
    const n = Math.round(raw)
    return n >= 1 && n <= 12 ? { months: [n], uklar: false } : { months: null, uklar: true }
  }
  const s = String(raw).trim().toLowerCase()
  if (!s) return { months: null, uklar: false }

  const ud = new Set<number>()
  for (const del of s.split(/[,;/]|\bog\b/)) {
    const bid = del.trim()
    if (!bid) continue
    const interval = bid.match(/^(.+?)\s*(?:-|–|—|til)\s*(.+)$/)
    if (interval) {
      const fra = eenMaaned(interval[1])
      const til = eenMaaned(interval[2])
      if (fra == null || til == null) return { months: null, uklar: true }
      // Nov–feb vender om årsskiftet; det er stadig en entydig række måneder.
      for (let n = fra, vaern = 0; vaern < 12; vaern++) {
        ud.add(n)
        if (n === til) break
        n = n === 12 ? 1 : n + 1
      }
      continue
    }
    const en = eenMaaned(bid)
    if (en == null) return { months: null, uklar: true }
    ud.add(en)
  }
  if (ud.size === 0) return { months: null, uklar: true }
  return { months: [...ud].sort((a, b) => a - b), uklar: false }
}

/** Ja/nej fra en celle. Alt uden for de kendte ord → null (ukendt). */
export function parseJaNej(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw
  if (raw == null || raw === '') return null
  const s = String(raw).trim().toLowerCase()
  if (['ja', 'j', 'true', 'sand', 'x', '1', 'yes'].includes(s)) return true
  if (['nej', 'n', 'false', 'falsk', '0', 'no'].includes(s)) return false
  // Hele ord fra Potalots eget sprogbrug, så "Forkultiveres" og
  // "Sås direkte" også kan stå i kolonnen.
  if (/^for(kultiver|spir)/.test(s)) return true
  if (/^(så|saa)s?\s*direkte/.test(s) || s === 'direkte') return false
  return null
}

/** Lys — Potalots egne etiketter plus de engelske enum-værdier. */
export function parseLys(raw: unknown): 'full_sun' | 'partial_shade' | 'shade' | null {
  if (raw == null || raw === '') return null
  const s = String(raw).trim().toLowerCase()
  if (['full_sun', 'fuld sol', 'sol', 'fuldsol', 'full sun'].includes(s)) return 'full_sun'
  if (['partial_shade', 'halvskygge', 'halv skygge', 'delvis skygge', 'partial shade'].includes(s)) return 'partial_shade'
  if (['shade', 'skygge'].includes(s)) return 'shade'
  return null
}

/** Vand — Potalots egne etiketter plus de engelske enum-værdier. */
export function parseVand(raw: unknown): 'low' | 'regular' | 'high' | null {
  if (raw == null || raw === '') return null
  const s = String(raw).trim().toLowerCase()
  if (['low', 'lidt', 'lav', 'sparsomt', 'tørketålende', 'toerketaalende'].includes(s)) return 'low'
  if (['regular', 'regelmæssig', 'regelmaessig', 'jævnt', 'jaevnt', 'jævn', 'normal', 'middel'].includes(s)) return 'regular'
  if (['high', 'meget', 'højt', 'hoejt', 'rigeligt'].includes(s)) return 'high'
  return null
}

// ── Kolonner ─────────────────────────────────────────────────────────────

// Kolonne-aliases: rå header → vores nøgle
export const COLUMN_ALIASES: Record<string, string[]> = {
  // Identitet og pose
  name: ['dansk navn', 'navn', 'plante', 'plantenavn', 'name'],
  latinName: ['latinsk navn', 'botanisk navn', 'latin', 'botanical', 'latinsk/botanisk navn'],
  variety: ['sort', 'variant', 'kultivar', 'variety'],
  seedCount: ['antal frø', 'antal', 'frø i pose', 'antal frø i pose', 'seed count'],
  quantity: ['antal stk', 'stk', 'antal løg', 'antal knolde', 'quantity'],
  purchaseYear: ['købsår', 'år', 'purchase year', 'år købt', 'årgang'],
  purchaseDate: ['købsdato', 'indkøbsdato', 'købt dato', 'purchase date'],
  expiryDate: ['bedst før', 'bedst foer', 'udløb', 'udløber', 'expiry', 'best before'],
  supplier: ['mærke', 'leverandør', 'mærke/leverandør', 'mærke / leverandør', 'brand', 'supplier'],
  purchaseUrl: ['købt her', 'url', 'link', 'purchase url', 'produktlink'],
  notes: ['noter', 'note', 'egne noter', 'kommentar', 'notes'],

  // Dyrkningsfakta. Står de i regnearket, er de brugerens egne og vinder
  // over både produktsiden og Potalots guider (merge-prioriteten).
  sowingMonths: ['sås', 'såmåneder', 'saamaaneder', 'såtid', 'såning', 'sowing months'],
  sowingDepthMm: ['sådybde', 'sådybde mm', 'sådybde (mm)', 'sowing depth'],
  preCultivation: ['forkultivering', 'forkultiveres', 'forspiring', 'pre cultivation'],
  plantingOutMonths: ['plant ud', 'udplantning', 'udplantningsmåneder', 'planting out'],
  harvestMonths: ['høst', 'høstmåneder', 'hoestmaaneder', 'høsttid', 'harvest months'],
  light: ['lys', 'placering', 'sol', 'light'],
  water: ['vand', 'vanding', 'water'],
  soil: ['jord', 'jordtype', 'soil'],
  germinationDays: ['spiretid', 'spiring', 'germination days'],
  germinationTemperature: ['spiretemperatur', 'spiretemp', 'germination temperature'],
  plantSpacing: ['planteafstand', 'afstand', 'plant spacing'],
  rowSpacing: ['rækkeafstand', 'raekkeafstand', 'row spacing'],
}

/** Menneskelige navne til måneds-advarslerne. */
export const MAANED_FELT_LABEL: Record<'sowingMonths' | 'plantingOutMonths' | 'harvestMonths', string> = {
  sowingMonths: 'Såmåneder',
  plantingOutMonths: 'Udplantning',
  harvestMonths: 'Høst',
}

/** Én kolonne i Excel-skabelonen: overskrift + eksempelværdi. */
export type TemplateColumn = [string, string | number]

export function detectColumn(header: string): string | null {
  const norm = header.trim().toLowerCase()
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(norm)) return key
  }
  return null
}

/** Én celle-værdi som regnearket leverer den. */
type Celle = unknown

function parseDato(s: Celle): string | null {
  if (s == null || s === '') return null
  if (s instanceof Date) return s.toISOString().split('T')[0]
  const str = String(s).trim()
  // DD.MM.YYYY
  let m = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // YYYY-MM-DD
  m = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (m) {
    const [, y, mo, d] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

function parseHeltal(s: Celle): number | null {
  if (s == null || s === '') return null
  const n = parseInt(String(s).trim(), 10)
  return isNaN(n) ? null : n
}

/** Overskrifter → feltnøgler. Ukendte kolonner tabes ikke — de rapporteres. */
export function kortlaegKolonner(headers: string[]): {
  headerToKey: Map<string, string>
  unmapped: string[]
} {
  const headerToKey = new Map<string, string>()
  const unmapped: string[] = []
  for (const h of headers) {
    const k = detectColumn(h)
    if (k) headerToKey.set(h, k)
    else unmapped.push(h)
  }
  return { headerToKey, unmapped }
}

/**
 * Læs én regnearksrække til felter + advarsler.
 *
 * Præcisionsreglen gælder hver celle: kan værdien ikke afkodes entydigt,
 * står feltet TOMT og brugeren får at vide hvorfor. Vi runder aldrig et
 * interval af og gætter aldrig på "forår" for at få en celle til at tælle.
 */
export function laesImportRaekke(
  raw: Record<string, Celle>,
  headerToKey: Map<string, string>,
  rowNumber: number,
): ImportRow {
  const data: ImportRowData = {}
  const warnings: string[] = []
  const errors: string[] = []

  for (const [header, key] of headerToKey) {
    const v = raw[header]
    if (v == null || v === '') continue
    switch (key) {
      case 'name':         data.name = String(v).trim(); break
      case 'latinName':    data.latinName = String(v).trim(); break
      case 'variety':      data.variety = String(v).trim(); break
      case 'supplier':     data.supplier = String(v).trim(); break
      case 'purchaseUrl':  data.purchaseUrl = String(v).trim(); break
      case 'notes':        data.notes = String(v).trim(); break
      case 'seedCount':    data.seedCount = parseHeltal(v) ?? undefined; break
      case 'quantity':     data.quantity = parseHeltal(v) ?? undefined; break
      case 'purchaseYear': data.purchaseYear = parseHeltal(v) ?? undefined; break
      case 'purchaseDate': data.purchaseDate = parseDato(v) ?? undefined; break
      case 'expiryDate':   data.expiryDate = parseDato(v) ?? undefined; break
      // Fritekst-felterne bæres videre som de står — Potalot viser dem
      // ordret, så der er intet at fortolke og intet at gætte forkert.
      case 'soil':                   data.soil = String(v).trim(); break
      case 'germinationDays':        data.germinationDays = String(v).trim(); break
      case 'germinationTemperature': data.germinationTemperature = String(v).trim(); break
      case 'plantSpacing':           data.plantSpacing = String(v).trim(); break
      case 'rowSpacing':             data.rowSpacing = String(v).trim(); break
      case 'preCultivation': {
        const b = parseJaNej(v)
        if (b != null) data.preCultivation = b
        else warnings.push(`Forkultivering "${String(v).trim()}" kunne ikke afkodes. Feltet står tomt.`)
        break
      }
      case 'light': {
        const l = parseLys(v)
        if (l) data.light = l
        else warnings.push(`Lys "${String(v).trim()}" kunne ikke afkodes. Feltet står tomt.`)
        break
      }
      case 'water': {
        const w = parseVand(v)
        if (w) data.water = w
        else warnings.push(`Vand "${String(v).trim()}" kunne ikke afkodes. Feltet står tomt.`)
        break
      }
      case 'sowingMonths':
      case 'plantingOutMonths':
      case 'harvestMonths': {
        const { months, uklar } = parseMaaneder(v)
        if (months) data[key] = months
        else if (uklar) warnings.push(`${MAANED_FELT_LABEL[key]} "${String(v).trim()}" kunne ikke læses som måneder. Feltet står tomt.`)
        break
      }
      case 'sowingDepthMm': {
        // "5 mm" → 5, men "2–5 mm" er et interval og må ALDRIG blive til 3.
        const d = parseSowingDepth(v)
        if (d.mm != null) data.sowingDepthMm = d.mm
        else if (d.interval) warnings.push(`Sådybde "${String(v).trim()}" er et interval — vi gætter ikke. Feltet står tomt.`)
        break
      }
    }
  }

  // Normalisér art/sort/leverandør FØR alt andet i pipelinen.
  const norm = normaliserImportRaekke(data)

  if (!norm.name && !norm.latinName) errors.push(FEJL_MANGLER_NAVN)
  if (norm.seedCount != null && norm.seedCount < 0) errors.push('Antal frø må ikke være negativt')
  if (norm.quantity != null && norm.quantity < 0) errors.push('Antal må ikke være negativt')
  if (norm.purchaseYear != null && (norm.purchaseYear < 1900 || norm.purchaseYear > 2100)) {
    warnings.push(`Mistænkeligt købsår: ${norm.purchaseYear}`)
  }
  if (norm.purchaseUrl && !/^https?:\/\//i.test(norm.purchaseUrl)) {
    warnings.push('Linket ser ikke ud til at være en webadresse. Vi springer det over.')
  }

  return {
    rowNumber,
    status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ready',
    warnings,
    errors,
    data: norm,
  }
}

// ── Merge ────────────────────────────────────────────────────────────────

const FELT_LABELS: Partial<Record<keyof ImportValues, string>> = {
  name: 'Navn',
  latinName: 'Latinsk navn',
  variety: 'Sort',
  supplier: 'Leverandør',
  primaryCategoryId: 'Kategori',
  seedCount: 'Antal frø',
  quantity: 'Antal stk',
  purchaseYear: 'Årgang',
  purchaseDate: 'Købsdato',
  expiryDate: 'Bedst før',
  purchaseUrl: 'Link',
  notes: 'Noter',
  sowingMonths: 'Såmåneder',
  sowingDepthMm: 'Sådybde',
  preCultivation: 'Forkultivering',
  plantingOutMonths: 'Udplantning',
  harvestMonths: 'Høst',
  light: 'Lys',
  water: 'Vand',
  soil: 'Jord',
  germinationDays: 'Spiretid',
  germinationTemperature: 'Spiretemperatur',
  plantSpacing: 'Planteafstand',
  rowSpacing: 'Rækkeafstand',
}

const MAANEDER = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function harVaerdi(v: unknown): boolean {
  if (v === undefined || v === null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'string') return v.trim().length > 0
  return true
}

/** Menneskelig visning af en værdi i konflikt-listen. */
function vis(v: unknown): string {
  if (Array.isArray(v)) {
    return v.map(n => (typeof n === 'number' && n >= 1 && n <= 12 ? MAANEDER[n - 1] : String(n))).join(', ')
  }
  if (typeof v === 'boolean') return v ? 'ja' : 'nej'
  if (v === 'full_sun') return 'fuld sol'
  if (v === 'partial_shade') return 'halvskygge'
  if (v === 'shade') return 'skygge'
  if (v === 'low') return 'lidt'
  if (v === 'regular') return 'jævnt'
  if (v === 'high') return 'meget'
  return String(v)
}

function ensVaerdi(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => x === b[i])
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim().toLowerCase() === b.trim().toLowerCase()
  }
  return a === b
}

/** Sorts-nøgle: kategori + art + sort. Pose-oplysninger indgår bevidst ikke. */
function noegle(kategori: string, name: string, variety: string | undefined): string {
  const n = (s: string) =>
    s.toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${kategori}|${n(name)}|${n(variety ?? '')}`
}

/**
 * Berig én række: Excel → link → sortsguide → artsguide → STOP.
 * Rækken oprettes ikke her — den gøres kun klar til review.
 */
export function berigImportRaekke(
  row: ImportRow,
  link: LinkResult | null,
  rettelser: ImportRettelser = {},
): EnrichedImportRow {
  const excel = normaliserImportRaekke(row.data)
  const linkFields: ExtractedSeedFields = link?.ok ? link.fields : {}
  const linkStatus: EnrichedImportRow['linkStatus'] = !excel.purchaseUrl
    ? 'ingen'
    : link?.ok
      ? 'ok'
      : 'fejl'

  const warnings = [...row.warnings]
  // "Mangler navn" afgøres FØRST efter merget — et navn kan komme fra linket,
  // selv om Excel-cellen var tom. Fil-parsningens bud kasseres derfor her.
  const errors = row.errors.filter(m => m !== FEJL_MANGLER_NAVN)

  const values = {} as ImportValues
  const fieldSources: EnrichedImportRow['fieldSources'] = {}
  const konflikter: ImportKonflikt[] = []

  // Felter brugeren selv har rørt i reviewet. Låst: hverken linket eller
  // Potalots guider må skrive hen over dem — heller ikke når værdien er tom.
  const laast = new Set<keyof ImportValues>(
    (Object.keys(rettelser) as (keyof ImportRettelser)[]).filter(k => rettelser[k] !== undefined),
  )

  // Lag 0-2: brugeren vinder over Excel, Excel over linket. Uenighed mellem
  // fil og link vises — men kun så længe brugeren ikke selv har afgjort feltet.
  function saet<K extends keyof ImportValues>(key: K, fraExcel: unknown, fraLink: unknown) {
    if (laast.has(key)) {
      const egen = (rettelser as Record<string, unknown>)[key as string]
      if (harVaerdi(egen)) {
        values[key] = egen as ImportValues[K]
        fieldSources[key] = 'egen'
      }
      return
    }
    const harExcel = harVaerdi(fraExcel)
    const harLink = harVaerdi(fraLink)
    if (harExcel && harLink && !ensVaerdi(fraExcel, fraLink)) {
      konflikter.push({
        felt: key,
        label: FELT_LABELS[key] ?? key,
        fil: vis(fraExcel),
        link: vis(fraLink),
      })
    }
    if (harExcel) {
      values[key] = fraExcel as ImportValues[K]
      fieldSources[key] = 'excel'
    } else if (harLink) {
      values[key] = fraLink as ImportValues[K]
      fieldSources[key] = 'link'
    }
  }

  saet('name', excel.name, linkFields.name)
  saet('latinName', excel.latinName, linkFields.latinName)
  saet('variety', excel.variety, linkFields.variety)
  saet('supplier', excel.supplier, linkFields.supplier)
  saet('seedCount', excel.seedCount, linkFields.seedCount)
  saet('quantity', excel.quantity, undefined)
  saet('purchaseYear', excel.purchaseYear, linkFields.purchaseYear)
  saet('purchaseDate', excel.purchaseDate, undefined)
  saet('expiryDate', excel.expiryDate, undefined)
  saet('notes', excel.notes, linkFields.notes)
  saet('primaryCategoryId', undefined, linkFields.primaryCategoryId)
  // Dyrkningsfakta: står de i brugerens fil, vinder de over produktsiden —
  // præcis som resten af filen gør. Guiderne (lag 3+4) kommer først bagefter.
  saet('sowingMonths', excel.sowingMonths, linkFields.sowingMonths)
  saet('sowingDepthMm', excel.sowingDepthMm, linkFields.sowingDepthMm)
  saet('preCultivation', excel.preCultivation, linkFields.preCultivation)
  saet('plantingOutMonths', excel.plantingOutMonths, linkFields.plantingOutMonths)
  saet('harvestMonths', excel.harvestMonths, linkFields.harvestMonths)
  saet('light', excel.light, linkFields.light)
  saet('water', excel.water, linkFields.water)
  saet('soil', excel.soil, undefined)
  saet('germinationDays', excel.germinationDays, linkFields.germinationDays)
  saet('germinationTemperature', excel.germinationTemperature, linkFields.germinationTemperature)
  saet('plantSpacing', excel.plantSpacing, linkFields.plantSpacing)
  saet('rowSpacing', excel.rowSpacing, linkFields.rowSpacing)

  // Købslinket bevares altid som proveniens på posen.
  saet('purchaseUrl', excel.purchaseUrl, undefined)

  if (!values.primaryCategoryId) values.primaryCategoryId = 'fro'
  if (!values.name) values.name = excel.latinName ?? ''

  // Frø tælles i frø, løg og knolde i stk — præcis som den manuelle
  // oprettelse gør det. Et regneark har typisk ÉN "Antal"-kolonne, og
  // kategorien er først kendt her (linket kan have sagt "loeg"). Uden det
  // her ville en importeret løg stå med en frø-tæller på frøkortet.
  if (values.primaryCategoryId !== 'fro' && values.seedCount != null && values.quantity == null) {
    values.quantity = values.seedCount
    fieldSources.quantity = fieldSources.seedCount
    delete values.seedCount
    delete fieldSources.seedCount
  }

  // Lag 3+4: Potalots egne guider — sort før art, aldrig kategori.
  // findFroebankAutofill afgør allerede sort-vs-art pr. felt, så kilden
  // kan bæres direkte videre til badges i review.
  if (values.name) {
    const autofill = findFroebankAutofill(values.name, values.variety ?? null)
    if (autofill) {
      const fra = <K extends keyof ImportValues>(key: K, v: unknown) => {
        if (laast.has(key)) return                  // brugerens eget felt — urørligt
        if (harVaerdi(values[key])) return          // Excel/link har allerede talt
        if (!harVaerdi(v)) return                   // guiderne tier → feltet forbliver tomt
        values[key] = v as ImportValues[K]
        fieldSources[key] = autofill.fieldSources[key as keyof typeof autofill.fieldSources] ?? 'art'
      }
      fra('sowingMonths', autofill.facts.sowingMonths)
      fra('sowingDepthMm', autofill.facts.sowingDepthMm ?? undefined)
      fra('preCultivation', autofill.facts.preCultivation ?? undefined)
      fra('plantingOutMonths', autofill.facts.plantingOutMonths)
      fra('harvestMonths', autofill.facts.harvestMonths)
      fra('light', autofill.facts.light ?? undefined)
      fra('water', autofill.facts.water ?? undefined)
      fra('soil', autofill.facts.soil)
      fra('germinationDays', autofill.facts.germinationDays)
      fra('germinationTemperature', autofill.facts.germinationTemperature)
      fra('plantSpacing', autofill.facts.plantSpacing)
      fra('rowSpacing', autofill.facts.rowSpacing)
    }
  }
  // Lag 5: STOP. Resterende tomme felter forbliver tomme.

  // Frøkort: Potalots kuraterede kort vinder over shoppens produktfoto.
  const kort = values.name
    ? resolveSeedCard({ name: values.name, variety: values.variety ?? null })
    : null
  const harFroekort = !!kort && (kort.source === 'guide-images' || kort.source === 'asset-convention')

  if (link?.ok && link.primaryImageUrl && !harFroekort) {
    values.imageUrls = [link.primaryImageUrl]
    values.primaryImageUrl = link.primaryImageUrl
  }

  // Validering.
  if (!values.name) errors.push(FEJL_MANGLER_NAVN)
  if (linkStatus === 'fejl') {
    warnings.push('Linket kunne ikke læses. Vi bruger oplysningerne fra din fil.')
  }

  const DYRKNING: (keyof ImportValues)[] = [
    'sowingMonths', 'sowingDepthMm', 'preCultivation', 'plantingOutMonths', 'harvestMonths',
    'light', 'water', 'soil', 'germinationDays', 'germinationTemperature', 'plantSpacing', 'rowSpacing',
  ]
  const antalDyrkning = DYRKNING.filter(k => harVaerdi(values[k])).length

  let status: EnrichedStatus
  if (errors.length > 0) status = 'fejl'
  else if (linkStatus === 'fejl') status = 'link_fejl'
  else if (antalDyrkning === 0) status = 'delvist'
  else status = 'klar'

  return {
    rowNumber: row.rowNumber,
    status,
    warnings,
    errors,
    excel,
    values,
    fieldSources,
    konflikter,
    linkStatus,
    harFroekort,
    sortsNoegle: noegle(values.primaryCategoryId, values.name, values.variety),
    flerePoserNote: null,
    rettelser,
  }
}

/**
 * Berig hele filen og markér — men dedupliker ALDRIG — rækker der er
 * samme sort. To poser Sungold fra hver sin leverandør er to poser.
 */
export function byggImportPreview(
  rows: ImportRow[],
  linkResults: Record<string, LinkResult>,
  rettelser: Record<number, ImportRettelser> = {},
): EnrichedImportRow[] {
  const beriget = rows.map(r => {
    const url = normaliserImportRaekke(r.data).purchaseUrl
    return berigImportRaekke(
      r,
      url ? (linkResults[url] ?? { ok: false }) : null,
      rettelser[r.rowNumber] ?? {},
    )
  })

  const antalPrNoegle = new Map<string, number>()
  for (const r of beriget) {
    if (!r.values.name) continue
    antalPrNoegle.set(r.sortsNoegle, (antalPrNoegle.get(r.sortsNoegle) ?? 0) + 1)
  }
  for (const r of beriget) {
    const n = antalPrNoegle.get(r.sortsNoegle) ?? 0
    if (n > 1) {
      const navn = r.values.variety || r.values.name
      r.flerePoserNote =
        `${navn} findes ${n === 2 ? 'to' : `${n}`} gange. Det ser ud til at være ` +
        `${n === 2 ? 'to' : n} forskellige frøposer. Alle beholdes under samme sort.`
    }
  }
  return beriget
}

/** Alle unikke links i filen — hver URL hentes kun én gang pr. import. */
export function unikkeLinks(rows: ImportRow[]): string[] {
  const set = new Set<string>()
  for (const r of rows) {
    const url = normaliserImportRaekke(r.data).purchaseUrl
    if (url && /^https?:\/\//i.test(url)) set.add(url)
  }
  return [...set]
}

/**
 * Maks. antal links pr. server-kald. Review-fladen henter linkene i
 * bidder, så hvert kald holder sig et godt stykke under funktions-
 * timeouten og brugeren ser fremdrift undervejs.
 */
export const LINK_CHUNK = 4

/**
 * Fejlteksten for en række uden identitet. Delt konstant, fordi den sættes
 * ved fil-parsningen og RE-VURDERES efter berigelsen: står navnet kun på
 * produktsiden, er rækken ikke navnløs alligevel.
 */
export const FEJL_MANGLER_NAVN = 'Mangler navn eller latinsk navn'

export const IMPORT_STATUS_LABEL: Record<EnrichedStatus, string> = {
  klar: 'Klar',
  delvist: 'Delvist udfyldt',
  link_fejl: 'Link kunne ikke læses',
  fejl: 'Fejl',
}
