'use client'

import { Button } from '@/components/ui/button'
import type { PlantGuide } from '@/lib/types'
import type { ParsedSeed } from './seed-bulk-review'
import { matchGuide } from './seed-bulk-review'
import { FileSpreadsheet, Download, AlertCircle } from 'lucide-react'
import { useState, useRef } from 'react'

interface SeedFileUploadProps {
  onParsed: (seeds: ParsedSeed[]) => void
  onBack: () => void
  guides: PlantGuide[]
}

// Map af mulige kolonnenavne → seed-felt
const COLUMN_MAP: Record<string, keyof ParsedSeed> = {
  // Dansk
  navn: 'name',
  plantenavn: 'name',
  frø: 'name',
  sort: 'variety',
  sortsnavn: 'variety',
  mærke: 'brand',
  producent: 'brand',
  antal: 'quantity',
  stk: 'quantity',
  købsår: 'year_purchased',
  'købs år': 'year_purchased',
  år: 'year_purchased',
  udløb: 'expiry_year',
  udløbsår: 'expiry_year',
  noter: 'notes',
  note: 'notes',
  kommentar: 'notes',
  // Engelsk
  name: 'name',
  variety: 'variety',
  brand: 'brand',
  quantity: 'quantity',
  year: 'year_purchased',
  year_purchased: 'year_purchased',
  expiry: 'expiry_year',
  expiry_year: 'expiry_year',
  notes: 'notes',
}

function downloadTemplate() {
  const csv = `Navn,Sort,Mærke,Antal,Købsår,Udløb,Noter
Tomat,San Marzano,Impecta,50,2026,,
Chili,Habanero,Nelson Garden,20,2025,2028,Meget stærk
Agurk,Marketmore,,30,2026,,`
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fro-skabelon.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function SeedFileUpload({ onParsed, onBack, guides }: SeedFileUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setParsing(true)

    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      })

      if (rows.length === 0) {
        setError('Filen er tom. Prøv med en fil der indeholder frødata.')
        setParsing(false)
        return
      }

      // Detect column mapping from headers
      const headers = Object.keys(rows[0])
      const mapping: Record<string, keyof ParsedSeed> = {}

      for (const header of headers) {
        const normalized = header.toLowerCase().trim()
        if (COLUMN_MAP[normalized]) {
          mapping[header] = COLUMN_MAP[normalized]
        }
      }

      // Fallback: if no 'name' column found, use first column
      const hasName = Object.values(mapping).includes('name')
      if (!hasName && headers.length > 0) {
        mapping[headers[0]] = 'name'
        if (headers.length > 1) {
          mapping[headers[1]] = 'variety'
        }
      }

      // Parse rows into seeds
      const seeds: ParsedSeed[] = rows
        .map((row) => {
          const seed: ParsedSeed = {
            name: '',
            variety: null,
            brand: null,
            quantity: null,
            year_purchased: null,
            expiry_year: null,
            notes: null,
            guide_id: null,
          }

          for (const [header, field] of Object.entries(mapping)) {
            const value = row[header]
            if (value === undefined || value === null || value === '') continue

            if (field === 'quantity' || field === 'year_purchased' || field === 'expiry_year') {
              const num = Number(value)
              if (!isNaN(num)) {
                seed[field] = num
              }
            } else {
              ;(seed[field] as string) = String(value).trim()
            }
          }

          return seed
        })
        .filter((s) => s.name.trim().length > 0)

      if (seeds.length === 0) {
        setError(
          'Kunne ikke finde frødata i filen. Sørg for at filen har en kolonne med "Navn" eller lignende.'
        )
        setParsing(false)
        return
      }

      // Auto-match guides
      for (const seed of seeds) {
        const guide = matchGuide(seed.name, guides)
        if (guide) {
          seed.guide_id = guide.id
        }
      }

      onParsed(seeds)
    } catch (err) {
      console.error('File parse error:', err)
      setError('Kunne ikke læse filen. Sørg for at det er en gyldig Excel eller CSV-fil.')
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Upload en Excel- eller CSV-fil med dine frø. Filen skal have kolonner med
          navne som &quot;Navn&quot;, &quot;Sort&quot;, &quot;Mærke&quot; osv.
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Download className="h-3 w-3" />
          Download skabelon (CSV)
        </button>
      </div>

      {/* Drop zone */}
      <label
        className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
      >
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {parsing ? 'Læser fil...' : 'Klik for at vælge fil'}
        </span>
        <span className="text-xs text-muted-foreground">.xlsx, .xls eller .csv</span>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
          disabled={parsing}
        />
      </label>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-start pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Tilbage
        </Button>
      </div>
    </div>
  )
}
