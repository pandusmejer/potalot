'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, Download, AlertCircle, Check } from 'lucide-react'
import { parseInventoryFile, confirmImportInventory, type ImportRow } from '@/actions/inventory-import'

export function ImportDialog() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [unmapped, setUnmapped] = useState<string[]>([])
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  function reset() {
    setStep('upload'); setRows([]); setUnmapped([]); setResult(null); setError(null)
  }

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) reset()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const fd = new FormData()
    fd.append('file', file)

    startTransition(async () => {
      const res = await parseInventoryFile(fd)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setRows(res.rows)
      setUnmapped(res.unmappedColumns)
      setStep('preview')
    })
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const res = await confirmImportInventory(rows)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setResult(res)
      setStep('done')
      router.refresh()
    })
  }

  const errorRows = rows.filter(r => r.status === 'error').length
  const warningRows = rows.filter(r => r.status === 'warning').length
  const readyRows = rows.filter(r => r.status === 'ready').length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          Importér
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        {step === 'upload' && (
          <>
            <DialogTitle>Importér frøbank fra Excel</DialogTitle>
            <DialogDescription>
              Upload en .xlsx- eller .csv-fil. Vi forsøger automatisk at matche kolonner.
            </DialogDescription>

            <div className="space-y-4 py-4">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv,.xls"
                onChange={handleFile}
                className="hidden"
              />

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Træk en fil hertil, eller…
                </p>
                <Button onClick={() => inputRef.current?.click()} disabled={pending}>
                  <Upload className="h-4 w-4" />
                  {pending ? 'Læser…' : 'Vælg fil'}
                </Button>
              </div>

              <a
                href="/api/inventory/template"
                className="flex items-center gap-2 text-sm text-primary hover:underline justify-center"
              >
                <Download className="h-3.5 w-3.5" />
                Download skabelon (.xlsx)
              </a>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <DialogTitle>Bekræft import</DialogTitle>
            <DialogDescription>
              {rows.length} rækker fundet. {readyRows} klar, {warningRows} med advarsler, {errorRows} med fejl (springes over).
            </DialogDescription>

            {unmapped.length > 0 && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm">
                <p className="font-medium text-foreground">Kolonner der ikke kunne matches:</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {unmapped.join(', ')} — disse felter importeres ikke
                </p>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Navn</th>
                    <th className="text-left p-2">Sort</th>
                    <th className="text-left p-2">Antal</th>
                    <th className="text-left p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.rowNumber} className="border-t border-border">
                      <td className="p-2">
                        {r.status === 'ready' && <Badge variant="success" className="text-[10px]">OK</Badge>}
                        {r.status === 'warning' && <Badge variant="warning" className="text-[10px]">Advarsel</Badge>}
                        {r.status === 'error' && <Badge variant="muted" className="text-[10px]">Fejl</Badge>}
                      </td>
                      <td className="p-2 font-medium">{r.data.name ?? r.data.latinName ?? '—'}</td>
                      <td className="p-2 text-muted-foreground">{r.data.variety ?? '—'}</td>
                      <td className="p-2 text-muted-foreground">{r.data.seedCount ?? '—'}</td>
                      <td className="p-2 text-muted-foreground">
                        {[...r.errors, ...r.warnings].join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('upload')} disabled={pending}>
                Tilbage
              </Button>
              <Button onClick={handleConfirm} disabled={pending || readyRows + warningRows === 0}>
                {pending ? 'Importerer…' : `Importér ${readyRows + warningRows} rækker`}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'done' && result && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-serif text-xl text-foreground">Import gennemført</p>
              <p className="text-sm text-muted-foreground mt-1">
                {result.imported} rækker importeret
                {result.skipped > 0 && `, ${result.skipped} sprunget over`}.
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)}>Luk</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
