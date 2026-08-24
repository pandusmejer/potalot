'use server'

import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { extractSeedFromUrl } from '@/actions/seed-packet-extract'
import { buildInventoryInsert } from '@/lib/inventory-insert'
import { findExistingGuideIdsForImport } from '@/actions/guides'
import type { ImportGuideMatch } from '@/lib/guides/import-guide-match'
import {
  normaliserImportRaekke,
  parseSowingDepth,
  LINK_CHUNK,
  FEJL_MANGLER_NAVN,
  type ImportRow,
  type ParseResult,
  type LinkResult,
  type EnrichedImportRow,
} from '@/lib/inventory-import-merge'

// Kolonne-aliases: rå header → vores nøgle
const COLUMN_ALIASES: Record<string, string[]> = {
  name: ['dansk navn', 'navn', 'plante', 'plantenavn', 'name'],
  latinName: ['latinsk navn', 'botanisk navn', 'latin', 'botanical', 'latinsk/botanisk navn'],
  variety: ['sort', 'variant', 'kultivar', 'variety'],
  seedCount: ['antal frø', 'antal', 'frø i pose', 'antal frø i pose', 'seed count'],
  purchaseYear: ['købsår', 'år', 'purchase year', 'år købt', 'årgang'],
  expiryDate: ['bedst før', 'bedst foer', 'udløb', 'udløber', 'expiry', 'best before'],
  supplier: ['mærke', 'leverandør', 'mærke/leverandør', 'mærke / leverandør', 'brand', 'supplier'],
  purchaseUrl: ['købt her', 'url', 'link', 'purchase url', 'produktlink'],
  sowingDepthMm: ['sådybde', 'sådybde mm', 'sådybde (mm)', 'sowing depth'],
  notes: ['noter', 'note', 'egne noter', 'kommentar', 'notes'],
}

function detectColumn(header: string): string | null {
  const norm = header.trim().toLowerCase()
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(norm)) return key
  }
  return null
}

function parseDate(s: unknown): string | null {
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

function parseInt0(s: unknown): number | null {
  if (s == null || s === '') return null
  const n = parseInt(String(s).trim(), 10)
  return isNaN(n) ? null : n
}

/**
 * Parser Excel- eller CSV-fil og returnerer mappede rækker + advarsler.
 * Importerer ikke noget endnu — rækkerne beriges (readImportLinks +
 * byggImportPreview) og vises i review, før noget oprettes.
 */
export async function parseInventoryFile(formData: FormData): Promise<ParseResult | { error: string }> {
  await requireUser()

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'Ingen fil' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Filen er for stor (maks. 5 MB).' }

  const buffer = await file.arrayBuffer()
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'array' })
  } catch {
    return { error: 'Kunne ikke læse fil. Brug .xlsx eller .csv.' }
  }

  const firstSheet = workbook.SheetNames[0]
  if (!firstSheet) return { error: 'Filen er tom' }

  const sheet = workbook.Sheets[firstSheet]
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  if (json.length === 0) return { error: 'Ingen data i filen' }

  // Map kolonner
  const firstRow = json[0]
  const headers = Object.keys(firstRow)
  const headerToKey = new Map<string, string>()
  const unmapped: string[] = []
  for (const h of headers) {
    const k = detectColumn(h)
    if (k) headerToKey.set(h, k)
    else unmapped.push(h)
  }

  const rows: ImportRow[] = json.map((raw, i) => {
    const data: ImportRow['data'] = {}
    const warnings: string[] = []
    const errors: string[] = []

    for (const [header, key] of headerToKey) {
      const v = raw[header]
      if (v == null || v === '') continue
      switch (key) {
        case 'name':         data.name = String(v).trim(); break
        case 'latinName':    data.latinName = String(v).trim(); break
        case 'variety':      data.variety = String(v).trim(); break
        case 'seedCount':    data.seedCount = parseInt0(v) ?? undefined; break
        case 'purchaseYear': data.purchaseYear = parseInt0(v) ?? undefined; break
        case 'expiryDate':   data.expiryDate = parseDate(v) ?? undefined; break
        case 'supplier':     data.supplier = String(v).trim(); break
        case 'purchaseUrl':  data.purchaseUrl = String(v).trim(); break
        case 'notes':        data.notes = String(v).trim(); break
        case 'sowingDepthMm': {
          // Præcisionsreglen: "5 mm" → 5, men "2–5 mm" er et interval og
          // må ALDRIG blive til 3. Uden ét entydigt tal står feltet tomt.
          const d = parseSowingDepth(v)
          if (d.mm != null) data.sowingDepthMm = d.mm
          else if (d.interval) warnings.push(`Sådybde "${String(v).trim()}" er et interval — vi gætter ikke. Feltet står tomt.`)
          break
        }
      }
    }

    // Normalisér art/sort/leverandør FØR alt andet i pipelinen.
    const norm = normaliserImportRaekke(data)

    if (!norm.name && !norm.latinName) {
      errors.push(FEJL_MANGLER_NAVN)
    }
    if (norm.seedCount != null && norm.seedCount < 0) {
      errors.push('Antal frø må ikke være negativt')
    }
    if (norm.purchaseYear != null && (norm.purchaseYear < 1900 || norm.purchaseYear > 2100)) {
      warnings.push(`Mistænkeligt købsår: ${norm.purchaseYear}`)
    }
    if (norm.purchaseUrl && !/^https?:\/\//i.test(norm.purchaseUrl)) {
      warnings.push('Linket ser ikke ud til at være en webadresse. Vi springer det over.')
    }

    return {
      rowNumber: i + 2, // +1 for header, +1 for 1-indexed
      status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ready',
      warnings,
      errors,
      data: norm,
    }
  })

  return { rows, unmappedColumns: unmapped }
}

const LINK_CONCURRENCY = 4
const LINK_TIMEOUT_MS = 15_000

function medTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p.catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ])
}

/**
 * Læs et bundt produktlinks fra importen.
 *
 * Reglerne (Anna, opgave 2): begrænset samtidighed, timeout pr. link,
 * og en fejl på ét link må ALDRIG stoppe importen — den bliver til
 * `{ ok: false }`, og rækken beholder sine Excel-data.
 *
 * Kaldes i bidder fra review-fladen, så brugeren ser fremdrift og hvert
 * server-kald holder sig kort. Kalderen sørger for at hver URL kun
 * sendes én gang pr. import.
 */
export async function readImportLinks(urls: string[]): Promise<Record<string, LinkResult>> {
  await requireUser()

  const unikke = [...new Set(urls.filter(u => /^https?:\/\//i.test(u)))].slice(0, LINK_CHUNK)
  const ud: Record<string, LinkResult> = {}

  let i = 0
  async function arbejder() {
    while (i < unikke.length) {
      const url = unikke[i++]
      const res = await medTimeout(extractSeedFromUrl(url), LINK_TIMEOUT_MS)
      if (!res || 'error' in res) {
        if (res && 'error' in res) console.error(`import-link fejlede (${url}):`, res.error)
        ud[url] = { ok: false }
      } else {
        ud[url] = { ok: true, fields: res.fields, primaryImageUrl: res.primaryImageUrl, sourceUrl: res.sourceUrl }
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(LINK_CONCURRENCY, unikke.length) }, () => arbejder()),
  )

  return ud
}

/**
 * Opret de berigede rækker i frøbanken. Rækker med fejl springes over.
 *
 * Der dedupliceres ALDRIG: to rækker med samme sort er to fysiske
 * frøposer (jf. frøposer-modellen), og begge oprettes.
 *
 * Rækkerne bygges gennem den samme insert-kontrakt som
 * `createInventoryItem` (buildInventoryInsert), men skrives i ét batch.
 *
 * GUIDE-REGEL (Anna, 23/8): batch-import må ALDRIG starte AI-generering —
 * en 100-rækkers fil skal ikke sætte 100 guide-genereringer i gang. Men
 * importerede poser må heller ikke være andenrangsborgere: findes der
 * allerede en sortsguide, kobles den; ellers en artsguide; ellers
 * importeres posen uden guide. Opslaget er ét enkelt kald for hele
 * batchen og genererer intet.
 */
export async function confirmImportInventory(rows: EnrichedImportRow[]): Promise<
  | { imported: number; skipped: number }
  | { error: string }
> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const importable = rows.filter(r => r.status !== 'fejl' && r.values?.name)
  if (importable.length === 0) return { imported: 0, skipped: rows.length }

  // Eksisterende guides kobles på FØR insert — aldrig via
  // ensureGuideForInventoryItem, som ville generere med AI pr. række.
  // Kun et 1:1-match gemmes: en pose MED sort får kun guide_id, hvis der
  // findes en rigtig sortsguide. Findes kun artsguiden, står guide_id tom,
  // så posen kan kobles korrekt den dag sortsguiden produceres — visningen
  // falder alligevel tilbage til artsguiden på navn.
  let matches: ImportGuideMatch[] = importable.map(() => ({ guideId: null, artsGuideId: null }))
  try {
    matches = await findExistingGuideIdsForImport(
      importable.map(r => ({ name: r.values.name, variety: r.values.variety ?? null })),
    )
  } catch (e) {
    // Guide-opslaget må aldrig blokere importen — posterne kan kobles senere.
    console.error('guide-opslag under import fejlede:', e)
  }

  const inserts = importable.map((r, i) =>
    buildInventoryInsert(userId, { ...r.values, guideId: matches[i]?.guideId ?? null }),
  )

  const { error } = await supabase.from('inventory_items').insert(inserts)
  if (error) {
    console.error('confirmImportInventory fejlede:', error)
    return { error: 'Kunne ikke importere rækkerne. Prøv igen.' }
  }

  revalidatePath('/froebank')
  return { imported: inserts.length, skipped: rows.length - inserts.length }
}
