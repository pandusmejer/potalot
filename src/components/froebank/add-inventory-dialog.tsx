'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import {
  Camera, Image as ImageIcon, FileSpreadsheet, FileText, Sparkles,
  Plus, Loader2, ArrowLeft, Upload, Download, Check,
} from 'lucide-react'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS, SYSTEM_SUBCATEGORIES } from '@/lib/constants'
import type { PrimaryCategoryId } from '@/lib/types'
import { createInventoryItem } from '@/actions/froebank'
import { extractSeedPacketFields, type ExtractedSeedFields } from '@/actions/seed-packet-extract'
import { parseInventoryFile, confirmImportInventory, type ImportRow } from '@/actions/inventory-import'

type Mode = 'select' | 'camera' | 'library' | 'excel' | 'manuel' | 'oenskeliste'

interface Props {
  children: React.ReactNode
}

export function AddInventoryDialog({ children }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('select')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Manuel
  const [name, setName] = useState('')
  const [latinName, setLatinName] = useState('')
  const [variety, setVariety] = useState('')
  const [supplier, setSupplier] = useState('')
  const [primaryCat, setPrimaryCat] = useState<PrimaryCategoryId>('fro')
  const [subcat, setSubcat] = useState('')
  const [quantity, setQuantity] = useState('')
  const [seedCount, setSeedCount] = useState('')
  const [purchaseYear, setPurchaseYear] = useState('')
  const [purchaseUrl, setPurchaseUrl] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [primaryImage, setPrimaryImage] = useState<string | null>(null)

  // Foto-flows (camera + library deler state)
  const [scanName, setScanName] = useState('')
  const [scanImages, setScanImages] = useState<string[]>([])
  const [scanPrimary, setScanPrimary] = useState<string | null>(null)
  const [scanExtracting, setScanExtracting] = useState(false)
  const [scanExtracted, setScanExtracted] = useState<ExtractedSeedFields | null>(null)

  // Excel-flow
  const excelInputRef = useRef<HTMLInputElement>(null)
  const [excelStep, setExcelStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [excelRows, setExcelRows] = useState<ImportRow[]>([])
  const [excelUnmapped, setExcelUnmapped] = useState<string[]>([])
  const [excelResult, setExcelResult] = useState<{ imported: number; skipped: number } | null>(null)

  const isFroe = primaryCat === 'fro'
  const tilgaengeligeSubs = SYSTEM_SUBCATEGORIES.filter(s => s.parentCategoryIds.includes(primaryCat))

  function reset() {
    setMode('select')
    setError(null)
    setName(''); setLatinName(''); setVariety(''); setSupplier(''); setPrimaryCat('fro')
    setSubcat(''); setQuantity(''); setSeedCount(''); setPurchaseYear(''); setPurchaseUrl('')
    setExpiryDate(''); setNotes(''); setImages([]); setPrimaryImage(null)
    setScanName(''); setScanImages([]); setScanPrimary(null)
    setScanExtracting(false); setScanExtracted(null)
    setExcelStep('upload'); setExcelRows([]); setExcelUnmapped([]); setExcelResult(null)
  }

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) reset()
  }

  async function runScanExtraction(imgs: string[]) {
    if (imgs.length === 0) return
    setScanExtracting(true)
    setError(null)
    const res = await extractSeedPacketFields(imgs)
    setScanExtracting(false)
    if ('error' in res) {
      setError(`AI kunne ikke læse frøposen: ${res.error}`)
      return
    }
    setScanExtracted(res.fields)
    if (res.fields.name && !scanName) setScanName(res.fields.name)
  }

  function handleScanImagesChange(imgs: string[], p: string | null) {
    const isFirst = scanImages.length === 0 && imgs.length > 0
    setScanImages(imgs)
    setScanPrimary(p)
    if (isFirst) runScanExtraction(imgs)
  }

  function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!scanName.trim()) {
      setError('Navn er påkrævet')
      return
    }
    const ex = scanExtracted ?? {}
    startTransition(async () => {
      const res = await createInventoryItem({
        name: scanName.trim(),
        latinName: ex.latinName,
        variety: ex.variety,
        supplier: ex.supplier,
        primaryCategoryId: ex.primaryCategoryId ?? 'fro',
        seedCount: ex.seedCount,
        sowingMonths: ex.sowingMonths,
        sowingDepthMm: ex.sowingDepthMm,
        plantingOutMonths: ex.plantingOutMonths,
        harvestMonths: ex.harvestMonths,
        light: ex.light,
        water: ex.water,
        germinationDays: ex.germinationDays,
        germinationTemperature: ex.germinationTemperature,
        plantSpacing: ex.plantSpacing,
        rowSpacing: ex.rowSpacing,
        notes: ex.notes,
        imageUrls: scanImages,
        primaryImageUrl: scanPrimary ?? undefined,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      handleOpenChange(false)
      router.refresh()
      router.push(`/froebank/${res.id}`)
    })
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createInventoryItem({
        name: name.trim(),
        latinName: latinName.trim() || undefined,
        variety: variety.trim() || undefined,
        supplier: supplier.trim() || undefined,
        primaryCategoryId: primaryCat,
        subcategoryId: subcat || undefined,
        quantity: !isFroe && quantity ? parseInt(quantity, 10) : undefined,
        seedCount: isFroe && seedCount ? parseInt(seedCount, 10) : undefined,
        purchaseYear: purchaseYear ? parseInt(purchaseYear, 10) : undefined,
        purchaseUrl: purchaseUrl.trim() || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
        imageUrls: images,
        primaryImageUrl: primaryImage ?? undefined,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      handleOpenChange(false)
      router.refresh()
      router.push(`/froebank/${res.id}`)
    })
  }

  async function handleExcelFile(e: React.ChangeEvent<HTMLInputElement>) {
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
      setExcelRows(res.rows)
      setExcelUnmapped(res.unmappedColumns)
      setExcelStep('preview')
    })
  }

  function handleExcelConfirm() {
    setError(null)
    startTransition(async () => {
      const res = await confirmImportInventory(excelRows)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setExcelResult(res)
      setExcelStep('done')
      router.refresh()
    })
  }

  const excelReady = excelRows.filter(r => r.status === 'ready').length
  const excelWarn = excelRows.filter(r => r.status === 'warning').length
  const excelErr = excelRows.filter(r => r.status === 'error').length

  // ============================================================
  // VALG-SKÆRM
  // ============================================================

  if (mode === 'select') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogTitle>Tilføj til frøbank</DialogTitle>
          <DialogDescription>Vælg hvordan du vil tilføje.</DialogDescription>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <ChoiceCard
              icon={<Camera className="h-5 w-5" />}
              title="Tag billede"
              subtitle="Brug kamera"
              onClick={() => setMode('camera')}
            />
            <ChoiceCard
              icon={<ImageIcon className="h-5 w-5" />}
              title="Upload billede"
              subtitle="Fra kamerarulle"
              onClick={() => setMode('library')}
            />
            <ChoiceCard
              icon={<FileSpreadsheet className="h-5 w-5" />}
              title="Excel"
              subtitle="Importér fil"
              onClick={() => setMode('excel')}
            />
            <ChoiceCard
              icon={<FileText className="h-5 w-5" />}
              title="Manuel"
              subtitle="Indtast selv"
              onClick={() => setMode('manuel')}
            />
            <ChoiceCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Ønskeliste"
              subtitle="Hent gemte"
              onClick={() => setMode('oenskeliste')}
              fullWidth
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ============================================================
  // SUB-FLOWS
  // ============================================================

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <button
          type="button"
          onClick={() => { reset(); setMode('select') }}
          className="absolute left-3 top-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Tilbage
        </button>

        {/* Foto-flows (camera + library) */}
        {(mode === 'camera' || mode === 'library') && (
          <div className="pt-6">
            <DialogTitle>{mode === 'camera' ? 'Tag billede af frøpose' : 'Upload billede af frøpose'}</DialogTitle>
            <DialogDescription>
              AI læser frøposen og auto-udfylder felterne.
            </DialogDescription>

            <form onSubmit={handleScanSubmit} className="space-y-3 mt-3">
              <MultiImageUpload
                value={scanImages}
                primary={scanPrimary}
                onChange={handleScanImagesChange}
                folder="froebank"
                maxImages={6}
                capture={mode === 'camera' ? 'environment' : undefined}
                label={mode === 'camera' ? 'Tag billede' : 'Vælg billede(r)'}
              />

              {scanExtracting && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Læser frøposen med AI…
                </div>
              )}

              {scanExtracted && !scanExtracting && (
                <div className="bg-secondary/30 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Felter fra frøposen
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {scanExtracted.latinName && <Field label="Latinsk" value={scanExtracted.latinName} />}
                    {scanExtracted.variety && <Field label="Sort" value={scanExtracted.variety} />}
                    {scanExtracted.supplier && <Field label="Leverandør" value={scanExtracted.supplier} />}
                    {scanExtracted.seedCount != null && <Field label="Antal frø" value={String(scanExtracted.seedCount)} />}
                    {scanExtracted.sowingMonths?.length ? <Field label="Sås" value={scanExtracted.sowingMonths.join(', ')} /> : null}
                    {scanExtracted.harvestMonths?.length ? <Field label="Høst" value={scanExtracted.harvestMonths.join(', ')} /> : null}
                  </div>
                </div>
              )}

              <div>
                <Label>Navn *</Label>
                <Input
                  value={scanName}
                  onChange={e => setScanName(e.target.value)}
                  placeholder="Fx. Tomat"
                  required
                  className="mt-1.5"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button type="submit" disabled={pending || scanExtracting}>
                  <Plus className="h-4 w-4" />
                  {pending ? 'Opretter…' : 'Opret'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}

        {/* Excel */}
        {mode === 'excel' && (
          <div className="pt-6">
            {excelStep === 'upload' && (
              <>
                <DialogTitle>Importér fra Excel</DialogTitle>
                <DialogDescription>
                  Upload .xlsx eller .csv. Kolonner mappes automatisk.
                </DialogDescription>

                <div className="space-y-4 py-4">
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.csv,.xls"
                    onChange={handleExcelFile}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <Button onClick={() => excelInputRef.current?.click()} disabled={pending}>
                      <Upload className="h-4 w-4" />
                      {pending ? 'Læser…' : 'Vælg fil'}
                    </Button>
                  </div>
                  <a
                    href="/api/inventory/template"
                    className="flex items-center gap-2 text-sm text-primary hover:underline justify-center"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download skabelon
                  </a>
                  {error && <p className="text-sm text-destructive text-center">{error}</p>}
                </div>
              </>
            )}

            {excelStep === 'preview' && (
              <>
                <DialogTitle>Bekræft import</DialogTitle>
                <DialogDescription>
                  {excelRows.length} rækker fundet. {excelReady} klar, {excelWarn} med advarsler, {excelErr} med fejl.
                </DialogDescription>

                {excelUnmapped.length > 0 && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs mt-2">
                    Kolonner uden match: {excelUnmapped.join(', ')}
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto border border-border rounded-lg mt-3">
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
                      {excelRows.map(r => (
                        <tr key={r.rowNumber} className="border-t border-border">
                          <td className="p-2">
                            {r.status === 'ready' && <Badge variant="success" className="text-[10px]">OK</Badge>}
                            {r.status === 'warning' && <Badge variant="warning" className="text-[10px]">Advarsel</Badge>}
                            {r.status === 'error' && <Badge variant="muted" className="text-[10px]">Fejl</Badge>}
                          </td>
                          <td className="p-2 font-medium">{r.data.name ?? r.data.latinName ?? '—'}</td>
                          <td className="p-2 text-muted-foreground">{r.data.variety ?? '—'}</td>
                          <td className="p-2 text-muted-foreground">{r.data.seedCount ?? '—'}</td>
                          <td className="p-2 text-muted-foreground">{[...r.errors, ...r.warnings].join(' · ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {error && <p className="text-sm text-destructive mt-2">{error}</p>}

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setExcelStep('upload')} disabled={pending}>
                    Vælg anden fil
                  </Button>
                  <Button onClick={handleExcelConfirm} disabled={pending || excelReady + excelWarn === 0}>
                    {pending ? 'Importerer…' : `Importér ${excelReady + excelWarn} rækker`}
                  </Button>
                </DialogFooter>
              </>
            )}

            {excelStep === 'done' && excelResult && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-serif text-xl text-foreground">Import gennemført</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {excelResult.imported} rækker importeret
                    {excelResult.skipped > 0 && `, ${excelResult.skipped} sprunget over`}.
                  </p>
                </div>
                <Button onClick={() => handleOpenChange(false)}>Luk</Button>
              </div>
            )}
          </div>
        )}

        {/* Manuel */}
        {mode === 'manuel' && (
          <div className="pt-6">
            <DialogTitle>Opret manuelt</DialogTitle>
            <DialogDescription>Udfyld felterne du har info på.</DialogDescription>

            <form onSubmit={handleManualSubmit} className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Navn *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Fx. Tomat" required className="mt-1.5" />
                </div>
                <div>
                  <Label>Sort</Label>
                  <Input value={variety} onChange={e => setVariety(e.target.value)} placeholder="Fx. San Marzano" className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label>Latinsk navn</Label>
                <Input value={latinName} onChange={e => setLatinName(e.target.value)} placeholder="Fx. Solanum lycopersicum" className="mt-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Primær kategori</Label>
                  <select
                    value={primaryCat}
                    onChange={e => { setPrimaryCat(e.target.value as PrimaryCategoryId); setSubcat('') }}
                    className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                  >
                    {PRIMARY_CATEGORY_IDS.filter(id => id !== 'favoritter').map(id => (
                      <option key={id} value={id}>{PRIMARY_CATEGORIES[id].name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Underkategori</Label>
                  <select
                    value={subcat}
                    onChange={e => setSubcat(e.target.value)}
                    className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                  >
                    <option value="">Ingen</option>
                    {tilgaengeligeSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Leverandør</Label>
                  <Input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Fx. Impecta" className="mt-1.5" />
                </div>
                <div>
                  <Label>{isFroe ? 'Antal frø' : 'Antal'}</Label>
                  <Input
                    type="number"
                    value={isFroe ? seedCount : quantity}
                    onChange={e => isFroe ? setSeedCount(e.target.value) : setQuantity(e.target.value)}
                    placeholder="0"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Købsår</Label>
                  <Input type="number" value={purchaseYear} onChange={e => setPurchaseYear(e.target.value)} placeholder="2026" className="mt-1.5" />
                </div>
                <div>
                  <Label>Udløb</Label>
                  <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label>Købt her</Label>
                <Input type="url" value={purchaseUrl} onChange={e => setPurchaseUrl(e.target.value)} placeholder="https://..." className="mt-1.5" />
              </div>

              <div>
                <Label>Noter</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1.5" />
              </div>

              <MultiImageUpload
                value={images}
                primary={primaryImage}
                onChange={(imgs, p) => { setImages(imgs); setPrimaryImage(p) }}
                folder="froebank"
                label="Tilføj billede(r)"
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  <Plus className="h-4 w-4" />
                  {pending ? 'Opretter…' : 'Opret'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}

        {/* Ønskeliste */}
        {mode === 'oenskeliste' && (
          <div className="pt-6">
            <DialogTitle>Hent fra ønskeliste</DialogTitle>
            <DialogDescription>Når du tilføjer planter til ønskelisten kan de flyttes hertil.</DialogDescription>
            <div className="text-center py-8 space-y-3">
              <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">Kommer senere — ingen elementer på ønskelisten endnu.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ChoiceCard({
  icon, title, subtitle, onClick, fullWidth,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
  fullWidth?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${fullWidth ? 'col-span-2 ' : ''}flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/40 hover:border-primary/50 transition-all text-left`}
    >
      <span className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className="text-foreground">{value}</p>
    </div>
  )
}
