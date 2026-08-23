'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { EnrichedImportRow } from '@/lib/inventory-import-merge'
import { cn } from '@/lib/utils'

/**
 * ImportReview — kvitteringen FØR oprettelse.
 *
 * Viser hvad Potalot har fået ud af hver Excel-række efter berigelsen
 * (fil → link → sortsguide → artsguide), og hvad vi IKKE kunne. Rækker
 * med noget at forklare kan foldes ud: uenighed mellem fil og link,
 * flere poser af samme sort, advarsler og fejl.
 *
 * Ingen række må se "færdig" ud, hvis den ikke er det — derfor er
 * "Delvist" og "Link" egne tilstande og ikke bare mangel på grønt.
 */
export function ImportReview({
  rows,
  unmappedColumns,
}: {
  rows: EnrichedImportRow[]
  unmappedColumns: string[]
}) {
  const [aabenRaekke, setAabenRaekke] = useState<number | null>(null)

  const klar = rows.filter(r => r.status === 'klar').length
  const delvist = rows.filter(r => r.status === 'delvist').length
  const linkFejl = rows.filter(r => r.status === 'link_fejl').length
  const fejl = rows.filter(r => r.status === 'fejl').length

  return (
    <>
      <p className="text-sm">
        {rows.length} {rows.length === 1 ? 'række' : 'rækker'} fundet.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {klar > 0 && <Badge variant="success" className="text-[11px]">{klar} klar</Badge>}
        {delvist > 0 && <Badge variant="warning" className="text-[11px]">{delvist} delvist udfyldt</Badge>}
        {linkFejl > 0 && <Badge variant="warning" className="text-[11px]">{linkFejl} link kunne ikke læses</Badge>}
        {fejl > 0 && <Badge variant="muted" className="text-[11px]">{fejl} med fejl</Badge>}
      </div>
      {unmappedColumns.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs break-words">
          Kolonner uden match: {unmappedColumns.join(', ')}
        </div>
      )}

      {/* Mobil: listen flyder med siden. Et 320 px-scrollfelt inde i en side,
          der selv scroller, er ubrugeligt på en telefon — især når en række
          foldes ud. Fra sm og op holdes listen i sit eget felt. */}
      <ul className="sm:max-h-80 sm:overflow-y-auto border border-border rounded-lg divide-y divide-border">
        {rows.map(r => {
          const aaben = aabenRaekke === r.rowNumber
          const detaljer =
            r.konflikter.length + r.warnings.length + r.errors.length > 0 || !!r.flerePoserNote
          return (
            <li key={r.rowNumber}>
              <button
                type="button"
                onClick={() => setAabenRaekke(aaben ? null : r.rowNumber)}
                disabled={!detaljer}
                aria-expanded={detaljer ? aaben : undefined}
                className={cn(
                  'w-full text-left px-3 py-2.5 flex items-start gap-2',
                  detaljer && 'hover:bg-muted/50',
                )}
              >
                <span className="shrink-0 pt-0.5 w-[62px]">
                  {r.status === 'klar' && <Badge variant="success" className="text-[10px]">Klar</Badge>}
                  {r.status === 'delvist' && <Badge variant="warning" className="text-[10px]">Delvist</Badge>}
                  {r.status === 'link_fejl' && <Badge variant="warning" className="text-[10px]">Link</Badge>}
                  {r.status === 'fejl' && <Badge variant="muted" className="text-[10px]">Fejl</Badge>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">
                    {r.values.name || '—'}
                    {r.values.variety && (
                      <span className="text-muted-foreground font-normal"> · {r.values.variety}</span>
                    )}
                  </span>
                  <span className="block text-[11px] text-muted-foreground truncate">
                    {[r.values.supplier, r.values.purchaseYear].filter(Boolean).join(' · ')
                      || `Række ${r.rowNumber}`}
                  </span>
                </span>
                {detaljer && (
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                )}
              </button>

              {aaben && detaljer && (
                <div className="px-3 pb-3 space-y-2 text-xs">
                  {r.errors.map((m, i) => (
                    <p key={`e${i}`} className="text-destructive break-words">{m}</p>
                  ))}
                  {r.konflikter.map(k => (
                    <div key={k.felt} className="bg-muted/60 rounded-md p-2 space-y-0.5">
                      <p className="font-medium">{k.label}</p>
                      <p className="text-muted-foreground break-words">Din fil: {k.fil}</p>
                      <p className="text-muted-foreground break-words">Linket: {k.link}</p>
                      <p className="break-words">Vi beholder {k.fil}.</p>
                    </div>
                  ))}
                  {r.flerePoserNote && (
                    <p className="text-muted-foreground break-words">{r.flerePoserNote}</p>
                  )}
                  {r.warnings.map((m, i) => (
                    <p key={`w${i}`} className="text-muted-foreground break-words">{m}</p>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
