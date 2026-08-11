'use server'

import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { PrimaryCategoryId } from '@/lib/types'

// Kolonne-aliases: rå header → vores nøgle
const COLUMN_ALIASES: Record<string, string[]> = {
  name: ['dansk navn', 'navn', 'plante', 'plantenavn', 'name'],
  latinName: ['latinsk navn', 'botanisk navn', 'latin', 'botanical', 'latinsk/botanisk navn'],
  variety: ['sort', 'variant', 'kultivar', 'variety'],
  seedCount: ['antal frø', 'antal', 'frø i pose', 'antal frø i pose', 'seed count'],
  purchaseYear: ['købsår', 'år', 'purchase year', 'år købt'],
  expiryDate: ['udløb', 'udløber', 'expiry', 'best before'],
  supplier: ['mærke', 'leverandør', 'mærke/leverandør', 'mærke / leverandør', 'brand', 'supplier'],
  purchaseUrl: ['købt her', 'url', 'link', 'purchase url'],
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

export interface ImportRow {
  rowNumber: number
  status: 'ready' | 'warning' | 'error'
  warnings: string[]
  errors: string[]
  data: {
    name?: string
    latinName?: string
    variety?: string
    seedCount?: number
    purchaseYear?: number
    expiryDate?: string
    supplier?: string
    purchaseUrl?: string
    notes?: string
  }
}

export interface ParseResult {
  rows: ImportRow[]
  unmappedColumns: string[]
}

/**
 * Parser Excel- eller CSV-fil og returnerer mappede rækker + advarsler.
 * Importerer ikke noget endnu — det sker via confirmImport.
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
  } catch (e) {
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
      }
    }

    const warnings: string[] = []
    const errors: string[] = []

    if (!data.name && !data.latinName) {
      errors.push('Mangler navn eller latinsk navn')
    }
    if (data.seedCount != null && data.seedCount < 0) {
      errors.push('Antal frø må ikke være negativt')
    }
    if (data.purchaseYear != null && (data.purchaseYear < 1900 || data.purchaseYear > 2100)) {
      warnings.push(`Mistænkeligt købsår: ${data.purchaseYear}`)
    }

    return {
      rowNumber: i + 2, // +1 for header, +1 for 1-indexed
      status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ready',
      warnings,
      errors,
      data,
    }
  })

  return { rows, unmappedColumns: unmapped }
}

/**
 * Importér rækker til frøbanken. Skipper rækker med errors.
 * Tjekker for dubletter på (name, variety, supplier, purchaseYear) og advarer
 * — men opretter alligevel da samme sort kan være ny batch.
 */
export async function confirmImportInventory(rows: ImportRow[]): Promise<
  | { imported: number; skipped: number }
  | { error: string }
> {
  const { id: userId } = await requireUser()
  const supabase = await createClient()

  const importable = rows.filter(r => r.status !== 'error')
  if (importable.length === 0) return { imported: 0, skipped: rows.length }

  const inserts = importable.map(r => ({
    user_id: userId,
    name: r.data.name ?? r.data.latinName ?? 'Ukendt',
    latin_name: r.data.latinName ?? null,
    variety: r.data.variety ?? null,
    supplier: r.data.supplier ?? null,
    primary_category_id: 'fro' satisfies PrimaryCategoryId,
    seed_count: r.data.seedCount ?? null,
    purchase_year: r.data.purchaseYear ?? null,
    purchase_url: r.data.purchaseUrl ?? null,
    expiry_date: r.data.expiryDate ?? null,
    notes: r.data.notes ?? null,
    status: 'i_froebank',
  }))

  const { error } = await supabase.from('inventory_items').insert(inserts)
  if (error) {
    console.error('importInventoryRows fejlede:', error)
    return { error: 'Kunne ikke importere rækkerne. Prøv igen.' }
  }

  revalidatePath('/froebank')
  return { imported: inserts.length, skipped: rows.length - inserts.length }
}
