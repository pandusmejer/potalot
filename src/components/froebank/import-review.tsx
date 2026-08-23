'use client'

import { useState } from 'react'
import { AlertTriangle, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS } from '@/lib/constants'
import type { PrimaryCategoryId } from '@/lib/types'
import type { EnrichedImportRow, ImportRettelser } from '@/lib/inventory-import-merge'
import { cn } from '@/lib/utils'

/**
 * ImportReview — kvitteringen FØR oprettelse.
 *
 * Tonen er "Potalot har gjort arbejdet; du tjekker det" — ikke "her er 87
 * formularer". Derfor er rækken lukket som udgangspunkt, og redigering
 * ligger ét tryk inde og dækker kun de felter, en automatisk import
 * realistisk kan tage fejl af: identitet og poseoplysninger.
 * Dyrkningsfakta autofyldes fortsat og rettes på frøkortet bagefter.
 *
 * Ingen række må se "færdig" ud, hvis den ikke er det — derfor er
 * "Delvist" og "Link" egne tilstande og ikke bare mangel på grønt.
 */
export function ImportReview({
  rows,
  unmappedColumns,
  onGem,
}: {
  rows: EnrichedImportRow[]
  unmappedColumns: string[]
  /** Gemmer brugerens rettelser for én række; kalderen genberegner merget. */
  onGem: (rowNumber: number, rettelser: ImportRettelser) => void
}) {
  const [aabenRaekke, setAabenRaekke] = useState<number | null>(null)
  const [redigerer, setRedigerer] = useState<number | null>(null)

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
          const rettet = Object.keys(r.rettelser).length > 0
          return (
            <li key={r.rowNumber}>
              <button
                type="button"
                onClick={() => { setAabenRaekke(aaben ? null : r.rowNumber); setRedigerer(null) }}
                aria-expanded={aaben}
                className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-muted/50"
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
                    {rettet && ' · rettet af dig'}
                  </span>
                </span>
                {detaljer && (
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                )}
              </button>

              {aaben && (
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

                  {redigerer === r.rowNumber ? (
                    <RaekkeFormular
                      raekke={r}
                      onAnnuller={() => setRedigerer(null)}
                      onGem={rettelser => { onGem(r.rowNumber, rettelser); setRedigerer(null) }}
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setRedigerer(r.rowNumber)}
                      className="h-8 px-2 text-xs"
                    >
                      <Pencil className="h-3 w-3" />
                      Redigér oplysninger
                    </Button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

// ── Redigering af én række ────────────────────────────────────────────

function tekst(v: unknown): string {
  return v == null ? '' : String(v)
}

/**
 * Kun de felter en import realistisk kan tage fejl af. Gemmer BLOT det,
 * brugeren faktisk har ændret — urørte felter forbliver ulåste og følger
 * fortsat linket og Potalots guider. Et felt, brugeren rydder, forbliver
 * tomt: også dét er en beslutning.
 */
function RaekkeFormular({
  raekke,
  onGem,
  onAnnuller,
}: {
  raekke: EnrichedImportRow
  onGem: (rettelser: ImportRettelser) => void
  onAnnuller: () => void
}) {
  const v = raekke.values
  const [form, setForm] = useState({
    name: tekst(v.name),
    variety: tekst(v.variety),
    supplier: tekst(v.supplier),
    purchaseYear: tekst(v.purchaseYear),
    expiryDate: tekst(v.expiryDate),
    seedCount: tekst(v.seedCount),
    purchaseUrl: tekst(v.purchaseUrl),
    primaryCategoryId: v.primaryCategoryId,
  })

  const saet = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function gem() {
    const ud: ImportRettelser = { ...raekke.rettelser }
    const tal = (s: string): number | null => {
      const n = parseInt(s.trim(), 10)
      return isNaN(n) ? null : n
    }

    if (form.name.trim() !== tekst(v.name)) ud.name = form.name.trim()
    if (form.variety.trim() !== tekst(v.variety)) ud.variety = form.variety.trim()
    if (form.supplier.trim() !== tekst(v.supplier)) ud.supplier = form.supplier.trim()
    if (form.purchaseUrl.trim() !== tekst(v.purchaseUrl)) ud.purchaseUrl = form.purchaseUrl.trim()
    if (form.expiryDate !== tekst(v.expiryDate)) ud.expiryDate = form.expiryDate
    if (form.purchaseYear.trim() !== tekst(v.purchaseYear)) ud.purchaseYear = tal(form.purchaseYear)
    if (form.seedCount.trim() !== tekst(v.seedCount)) ud.seedCount = tal(form.seedCount)
    if (form.primaryCategoryId !== v.primaryCategoryId) ud.primaryCategoryId = form.primaryCategoryId

    onGem(ud)
  }

  return (
    <div className="space-y-2.5 bg-muted/40 rounded-lg p-3">
      <Felt id={`navn-${raekke.rowNumber}`} label="Art">
        <Input id={`navn-${raekke.rowNumber}`} value={form.name} onChange={saet('name')} placeholder="Ikke udfyldt" />
      </Felt>
      <Felt id={`sort-${raekke.rowNumber}`} label="Sort">
        <Input id={`sort-${raekke.rowNumber}`} value={form.variety} onChange={saet('variety')} placeholder="Ikke udfyldt" />
      </Felt>
      <Felt id={`lev-${raekke.rowNumber}`} label="Leverandør">
        <Input id={`lev-${raekke.rowNumber}`} value={form.supplier} onChange={saet('supplier')} placeholder="Ikke udfyldt" />
      </Felt>
      <div className="grid grid-cols-2 gap-2">
        <Felt id={`aar-${raekke.rowNumber}`} label="Årgang">
          <Input id={`aar-${raekke.rowNumber}`} value={form.purchaseYear} onChange={saet('purchaseYear')} inputMode="numeric" placeholder="Ikke udfyldt" />
        </Felt>
        <Felt id={`antal-${raekke.rowNumber}`} label="Antal frø">
          <Input id={`antal-${raekke.rowNumber}`} value={form.seedCount} onChange={saet('seedCount')} inputMode="numeric" placeholder="Ikke udfyldt" />
        </Felt>
      </div>
      <Felt id={`udloeb-${raekke.rowNumber}`} label="Bedst før">
        <Input id={`udloeb-${raekke.rowNumber}`} type="date" value={form.expiryDate} onChange={saet('expiryDate')} />
      </Felt>
      <Felt id={`kat-${raekke.rowNumber}`} label="Kategori">
        <select
          id={`kat-${raekke.rowNumber}`}
          value={form.primaryCategoryId}
          onChange={e => setForm(f => ({ ...f, primaryCategoryId: e.target.value as PrimaryCategoryId }))}
          className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
        >
          {PRIMARY_CATEGORY_IDS.filter(id => id !== 'favoritter').map(id => (
            <option key={id} value={id}>{PRIMARY_CATEGORIES[id].name}</option>
          ))}
        </select>
      </Felt>
      <Felt id={`link-${raekke.rowNumber}`} label="Link">
        <Input id={`link-${raekke.rowNumber}`} value={form.purchaseUrl} onChange={saet('purchaseUrl')} placeholder="https://…" />
      </Felt>

      <p className="text-[11px] text-muted-foreground">
        Det, du retter her, er dine oplysninger. Vi skriver dem ikke over igen.
      </p>
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="ghost" onClick={onAnnuller} className="h-8 px-3 text-xs">Annullér</Button>
        <Button onClick={gem} className="h-8 px-3 text-xs">Gem ændringer</Button>
      </div>
    </div>
  )
}

function Felt({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
