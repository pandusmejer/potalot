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
  kortlaegKolonner,
  laesImportRaekke,
  LINK_CHUNK,
  type ImportRow,
  type ParseResult,
  type LinkResult,
  type EnrichedImportRow,
} from '@/lib/inventory-import-merge'

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

  const { headerToKey, unmapped } = kortlaegKolonner(Object.keys(json[0]))
  const rows: ImportRow[] = json.map((raw, i) =>
    // +1 for header, +1 for 1-indekseret regneark
    laesImportRaekke(raw, headerToKey, i + 2),
  )

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
