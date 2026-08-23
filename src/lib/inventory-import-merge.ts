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
  purchaseYear?: number
  expiryDate?: string
  supplier?: string
  purchaseUrl?: string
  sowingDepthMm?: number
  notes?: string
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

/** Hvor en færdig værdi kom fra. Rækkefølgen er merge-prioriteten. */
export type ImportFeltKilde = 'excel' | 'link' | 'sort' | 'art'

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
  purchaseYear?: number
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

// ── Merge ────────────────────────────────────────────────────────────────

const FELT_LABELS: Partial<Record<keyof ImportValues, string>> = {
  name: 'Navn',
  latinName: 'Latinsk navn',
  variety: 'Sort',
  supplier: 'Leverandør',
  primaryCategoryId: 'Kategori',
  seedCount: 'Antal frø',
  purchaseYear: 'Årgang',
  expiryDate: 'Udløb',
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
export function berigImportRaekke(row: ImportRow, link: LinkResult | null): EnrichedImportRow {
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

  // Lag 1+2: Excel vinder; linket fylder kun huller ud. Uenighed vises.
  function saet<K extends keyof ImportValues>(key: K, fraExcel: unknown, fraLink: unknown) {
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
  saet('purchaseYear', excel.purchaseYear, linkFields.purchaseYear)
  saet('expiryDate', excel.expiryDate, undefined)
  saet('notes', excel.notes, linkFields.notes)
  saet('sowingDepthMm', excel.sowingDepthMm, linkFields.sowingDepthMm)
  saet('primaryCategoryId', undefined, linkFields.primaryCategoryId)
  saet('sowingMonths', undefined, linkFields.sowingMonths)
  saet('plantingOutMonths', undefined, linkFields.plantingOutMonths)
  saet('harvestMonths', undefined, linkFields.harvestMonths)
  saet('preCultivation', undefined, linkFields.preCultivation)
  saet('light', undefined, linkFields.light)
  saet('water', undefined, linkFields.water)
  saet('germinationDays', undefined, linkFields.germinationDays)
  saet('germinationTemperature', undefined, linkFields.germinationTemperature)
  saet('plantSpacing', undefined, linkFields.plantSpacing)
  saet('rowSpacing', undefined, linkFields.rowSpacing)

  // Købslinket bevares altid som proveniens på posen.
  if (excel.purchaseUrl) {
    values.purchaseUrl = excel.purchaseUrl
    fieldSources.purchaseUrl = 'excel'
  }

  if (!values.primaryCategoryId) values.primaryCategoryId = 'fro'
  if (!values.name) values.name = excel.latinName ?? ''

  // Lag 3+4: Potalots egne guider — sort før art, aldrig kategori.
  // findFroebankAutofill afgør allerede sort-vs-art pr. felt, så kilden
  // kan bæres direkte videre til badges i review.
  if (values.name) {
    const autofill = findFroebankAutofill(values.name, values.variety ?? null)
    if (autofill) {
      const fra = <K extends keyof ImportValues>(key: K, v: unknown) => {
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
  }
}

/**
 * Berig hele filen og markér — men dedupliker ALDRIG — rækker der er
 * samme sort. To poser Sungold fra hver sin leverandør er to poser.
 */
export function byggImportPreview(
  rows: ImportRow[],
  linkResults: Record<string, LinkResult>,
): EnrichedImportRow[] {
  const beriget = rows.map(r => {
    const url = normaliserImportRaekke(r.data).purchaseUrl
    return berigImportRaekke(r, url ? (linkResults[url] ?? { ok: false }) : null)
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
