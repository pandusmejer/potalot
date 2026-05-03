'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import {
  Camera, Image as ImageIcon, FileSpreadsheet, FileText, Sparkles, Link2,
  Plus, Loader2, ArrowLeft, Upload, Download, Check, Wand2,
} from 'lucide-react'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS, SYSTEM_SUBCATEGORIES } from '@/lib/constants'
import type { PrimaryCategoryId } from '@/lib/types'
import { createInventoryItem } from '@/actions/froebank'
import { extractSeedPacketFields, extractSeedFromUrl, type ExtractedSeedFields } from '@/actions/seed-packet-extract'
import { parseInventoryFile, confirmImportInventory, type ImportRow } from '@/actions/inventory-import'
import { cn } from '@/lib/utils'

type Mode = 'select' | 'camera' | 'library' | 'link' | 'excel' | 'manuel' | 'oenskeliste'

interface Props {
  initialMode: Mode
}

export function TilfoejFlow({ initialMode }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
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

  // Foto
  const [scanName, setScanName] = useState('')
  const [scanImages, setScanImages] = useState<string[]>([])
  const [scanPrimary, setScanPrimary] = useState<string | null>(null)
  const [scanStage, setScanStage] = useState<'idle' | 'reading' | 'creating' | 'done'>('idle')
  const [scanExtracted, setScanExtracted] = useState<ExtractedSeedFields | null>(null)
  const [scanTarget, setScanTarget] = useState<'froebank' | 'oenskeliste'>('froebank')
  const [scanCreatedId, setScanCreatedId] = useState<string | null>(null)

  // Link
  const [linkUrl, setLinkUrl] = useState('')

  // Excel
  const excelInputRef = useRef<HTMLInputElement>(null)
  const [excelStep, setExcelStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [excelRows, setExcelRows] = useState<ImportRow[]>([])
  const [excelUnmapped, setExcelUnmapped] = useState<string[]>([])
  const [excelResult, setExcelResult] = useState<{ imported: number; skipped: number } | null>(null)

  const isFroe = primaryCat === 'fro'
  const tilgaengeligeSubs = SYSTEM_SUBCATEGORIES.filter(s => s.parentCategoryIds.includes(primaryCat))

  async function runScanAndCreate(imgs: string[], primary: string | null, target: 'froebank' | 'oenskeliste') {
    setError(null)
    setScanStage('reading')
    const ext = await extractSeedPacketFields(imgs)
    let fields: ExtractedSeedFields = {}
    if ('fields' in ext) {
      fields = ext.fields
      setScanExtracted(fields)
    }
    setScanStage('creating')
    const fallbackName = `Frøpose – ${new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}`
    const finalName = (fields.name?.trim() || scanName.trim() || fallbackName)

    const res = await createInventoryItem({
      name: finalName,
      latinName: fields.latinName,
      variety: fields.variety,
      supplier: fields.supplier,
      primaryCategoryId: target === 'oenskeliste' ? 'indkoebsliste' : (fields.primaryCategoryId ?? 'fro'),
      seedCount: fields.seedCount,
      sowingMonths: fields.sowingMonths,
      sowingDepthMm: fields.sowingDepthMm,
      plantingOutMonths: fields.plantingOutMonths,
      harvestMonths: fields.harvestMonths,
      light: fields.light,
      water: fields.water,
      germinationDays: fields.germinationDays,
      germinationTemperature: fields.germinationTemperature,
      plantSpacing: fields.plantSpacing,
      rowSpacing: fields.rowSpacing,
      notes: fields.notes,
      imageUrls: imgs,
      primaryImageUrl: primary ?? undefined,
    })

    if ('error' in res) {
      setError(`Kunne ikke oprette: ${res.error}`)
      setScanStage('idle')
      return
    }
    setScanCreatedId(res.id)
    setScanStage('done')
    setScanName(finalName)
    router.refresh()
  }

  function handleScanImagesChange(imgs: string[], p: string | null) {
    setScanImages(imgs)
    setScanPrimary(p)
  }

  function handleScanStart() {
    if (scanImages.length === 0) return
    startTransition(() => runScanAndCreate(scanImages, scanPrimary, scanTarget))
  }

  async function runLinkAndCreate(url: string, target: 'froebank' | 'oenskeliste') {
    setError(null)
    setScanStage('reading')
    const ext = await extractSeedFromUrl(url)
    if ('error' in ext) {
      setError(ext.error)
      setScanStage('idle')
      return
    }
    setScanExtracted(ext.fields)
    setScanStage('creating')
    const fallbackName = `Link – ${new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}`
    const finalName = (ext.fields.name?.trim() || fallbackName)
    const imgs = ext.primaryImageUrl ? [ext.primaryImageUrl] : []

    const res = await createInventoryItem({
      name: finalName,
      latinName: ext.fields.latinName,
      variety: ext.fields.variety,
      supplier: ext.fields.supplier,
      primaryCategoryId: target === 'oenskeliste' ? 'indkoebsliste' : (ext.fields.primaryCategoryId ?? 'fro'),
      seedCount: ext.fields.seedCount,
      sowingMonths: ext.fields.sowingMonths,
      sowingDepthMm: ext.fields.sowingDepthMm,
      plantingOutMonths: ext.fields.plantingOutMonths,
      harvestMonths: ext.fields.harvestMonths,
      light: ext.fields.light,
      water: ext.fields.water,
      germinationDays: ext.fields.germinationDays,
      germinationTemperature: ext.fields.germinationTemperature,
      plantSpacing: ext.fields.plantSpacing,
      rowSpacing: ext.fields.rowSpacing,
      notes: ext.fields.notes,
      purchaseUrl: ext.sourceUrl,
      imageUrls: imgs,
      primaryImageUrl: imgs[0],
    })

    if ('error' in res) {
      setError(`Kunne ikke oprette: ${res.error}`)
      setScanStage('idle')
      return
    }
    setScanCreatedId(res.id)
    setScanStage('done')
    setScanName(finalName)
    router.refresh()
  }

  function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = linkUrl.trim()
    if (!trimmed) return
    startTransition(() => runLinkAndCreate(trimmed, scanTarget))
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
      if ('error' in res) { setError(res.error); return }
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
      if ('error' in res) { setError(res.error); return }
      setExcelRows(res.rows); setExcelUnmapped(res.unmappedColumns); setExcelStep('preview')
    })
  }

  function handleExcelConfirm() {
    setError(null)
    startTransition(async () => {
      const res = await confirmImportInventory(excelRows)
      if ('error' in res) { setError(res.error); return }
      setExcelResult(res); setExcelStep('done')
      router.refresh()
    })
  }

  const excelReady = excelRows.filter(r => r.status === 'ready').length
  const excelWarn = excelRows.filter(r => r.status === 'warning').length
  const excelErr = excelRows.filter(r => r.status === 'error').length

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        {mode === 'select' ? (
          <Button asChild variant="ghost" size="icon">
            <Link href="/froebank" aria-label="Tilbage">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setMode('select')} aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-2xl font-serif text-foreground">
          {mode === 'select' && 'Tilføj til frøbank'}
          {mode === 'camera' && 'Tag billede'}
          {mode === 'library' && 'Upload billede'}
          {mode === 'link' && 'Indsæt link'}
          {mode === 'excel' && 'Importér Excel'}
          {mode === 'manuel' && 'Opret manuelt'}
          {mode === 'oenskeliste' && 'Hent fra ønskeliste'}
        </h1>
      </div>

      {/* SELECT */}
      {mode === 'select' && (
        <div className="grid grid-cols-2 gap-2">
          <ChoiceCard icon={<Camera className="h-5 w-5" />} title="Tag billede" subtitle="Brug kamera" onClick={() => setMode('camera')} />
          <ChoiceCard icon={<ImageIcon className="h-5 w-5" />} title="Upload billede" subtitle="Fra kamerarulle" onClick={() => setMode('library')} />
          <ChoiceCard icon={<Link2 className="h-5 w-5" />} title="Indsæt link" subtitle="Webshop-side" onClick={() => setMode('link')} />
          <ChoiceCard icon={<FileSpreadsheet className="h-5 w-5" />} title="Excel" subtitle="Importér fil" onClick={() => setMode('excel')} />
          <ChoiceCard icon={<FileText className="h-5 w-5" />} title="Manuel" subtitle="Indtast selv" onClick={() => setMode('manuel')} />
          <ChoiceCard icon={<Sparkles className="h-5 w-5" />} title="Ønskeliste" subtitle="Hent gemte" onClick={() => setMode('oenskeliste')} fullWidth />
        </div>
      )}

      {/* FOTO */}
      {(mode === 'camera' || mode === 'library') && (
        <Card>
          <CardContent className="space-y-4 py-5">
            <p className="text-sm text-muted-foreground">
              AI læser billedet og opretter automatisk i {scanTarget === 'oenskeliste' ? 'ønskeliste' : 'frøbanken'}.
            </p>

            {scanStage === 'idle' && scanImages.length === 0 && (
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button type="button" onClick={() => setScanTarget('froebank')}
                  className={cn('flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                    scanTarget === 'froebank' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                  Frøbank
                </button>
                <button type="button" onClick={() => setScanTarget('oenskeliste')}
                  className={cn('flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                    scanTarget === 'oenskeliste' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                  Ønskeliste
                </button>
              </div>
            )}

            {scanStage === 'idle' && (
              <>
                <MultiImageUpload
                  value={scanImages}
                  primary={scanPrimary}
                  onChange={handleScanImagesChange}
                  folder="froebank"
                  maxImages={4}
                  capture={mode === 'camera' ? 'environment' : undefined}
                  label={mode === 'camera' ? 'Tag billede' : 'Vælg billede(r)'}
                />
                {scanImages.length > 0 && (
                  <Button onClick={handleScanStart} disabled={pending} className="w-full">
                    <Wand2 className="h-4 w-4" />
                    Læs {scanImages.length} billede{scanImages.length > 1 ? 'r' : ''} med AI
                  </Button>
                )}
              </>
            )}

            {(scanStage === 'reading' || scanStage === 'creating') && (
              <div className="flex items-center gap-3 text-sm bg-secondary/40 rounded-lg p-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {scanStage === 'reading' ? 'Læser billedet med AI…' : 'Opretter…'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scanStage === 'reading' ? 'Genkender navn, sort, leverandør osv.' : `Gemmer i ${scanTarget === 'oenskeliste' ? 'ønskeliste' : 'frøbank'}`}
                  </p>
                </div>
              </div>
            )}

            {scanStage === 'done' && scanCreatedId && (
              <div className="bg-primary/5 border border-primary/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg text-foreground">Oprettet i {scanTarget === 'oenskeliste' ? 'ønskeliste' : 'frøbank'}</p>
                    <p className="text-sm text-muted-foreground">{scanName}</p>
                  </div>
                </div>
                {scanExtracted && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-primary/20">
                    {scanExtracted.latinName && <Field label="Latinsk" value={scanExtracted.latinName} />}
                    {scanExtracted.variety && <Field label="Sort" value={scanExtracted.variety} />}
                    {scanExtracted.supplier && <Field label="Leverandør" value={scanExtracted.supplier} />}
                    {scanExtracted.seedCount != null && <Field label="Antal frø" value={String(scanExtracted.seedCount)} />}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button asChild>
                    <Link href={`/froebank/${scanCreatedId}`}>Se i frøbank</Link>
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setScanImages([]); setScanPrimary(null); setScanStage('idle')
                    setScanExtracted(null); setScanCreatedId(null); setScanName('')
                  }}>
                    Scan en til
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LINK */}
      {mode === 'link' && (
        <Card>
          <CardContent className="space-y-4 py-5">
            <p className="text-sm text-muted-foreground">
              Indsæt link til en webshop-side med frø — fx Impecta, Nelson Garden, Solhatt. AI læser siden og opretter automatisk i {scanTarget === 'oenskeliste' ? 'ønskeliste' : 'frøbanken'}.
            </p>

            {scanStage === 'idle' && (
              <>
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <button type="button" onClick={() => setScanTarget('froebank')}
                    className={cn('flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                      scanTarget === 'froebank' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                    Frøbank
                  </button>
                  <button type="button" onClick={() => setScanTarget('oenskeliste')}
                    className={cn('flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                      scanTarget === 'oenskeliste' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                    Ønskeliste
                  </button>
                </div>

                <form onSubmit={handleLinkSubmit} className="space-y-3">
                  <div>
                    <Label>URL</Label>
                    <Input
                      type="url"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                      placeholder="https://impecta.dk/..."
                      required
                      autoFocus
                      className="mt-1.5"
                    />
                  </div>
                  <Button type="submit" disabled={pending || !linkUrl.trim()} className="w-full">
                    <Wand2 className="h-4 w-4" />
                    Læs link med AI
                  </Button>
                </form>
              </>
            )}

            {(scanStage === 'reading' || scanStage === 'creating') && (
              <div className="flex items-center gap-3 text-sm bg-secondary/40 rounded-lg p-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {scanStage === 'reading' ? 'Læser siden med AI…' : 'Opretter…'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scanStage === 'reading' ? 'Henter side, billede og data.' : `Gemmer i ${scanTarget === 'oenskeliste' ? 'ønskeliste' : 'frøbank'}`}
                  </p>
                </div>
              </div>
            )}

            {scanStage === 'done' && scanCreatedId && (
              <div className="bg-primary/5 border border-primary/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg text-foreground">Oprettet i {scanTarget === 'oenskeliste' ? 'ønskeliste' : 'frøbank'}</p>
                    <p className="text-sm text-muted-foreground">{scanName}</p>
                  </div>
                </div>
                {scanExtracted && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-primary/20">
                    {scanExtracted.latinName && <Field label="Latinsk" value={scanExtracted.latinName} />}
                    {scanExtracted.variety && <Field label="Sort" value={scanExtracted.variety} />}
                    {scanExtracted.supplier && <Field label="Leverandør" value={scanExtracted.supplier} />}
                    {scanExtracted.seedCount != null && <Field label="Antal frø" value={String(scanExtracted.seedCount)} />}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button asChild>
                    <Link href={`/froebank/${scanCreatedId}`}>Se i frøbank</Link>
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setLinkUrl(''); setScanStage('idle')
                    setScanExtracted(null); setScanCreatedId(null); setScanName('')
                  }}>
                    Tilføj endnu et link
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* EXCEL */}
      {mode === 'excel' && (
        <Card>
          <CardContent className="space-y-4 py-5">
            {excelStep === 'upload' && (
              <>
                <p className="text-sm text-muted-foreground">Upload .xlsx eller .csv. Kolonner mappes automatisk.</p>
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
                <a href="/api/inventory/template" className="flex items-center gap-2 text-sm text-primary hover:underline justify-center">
                  <Download className="h-3.5 w-3.5" />
                  Download skabelon
                </a>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
              </>
            )}

            {excelStep === 'preview' && (
              <>
                <p className="text-sm">
                  {excelRows.length} rækker fundet. {excelReady} klar, {excelWarn} med advarsler, {excelErr} med fejl.
                </p>
                {excelUnmapped.length > 0 && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs">
                    Kolonner uden match: {excelUnmapped.join(', ')}
                  </div>
                )}
                <div className="max-h-72 overflow-y-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Navn</th>
                        <th className="text-left p-2">Sort</th>
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
                          <td className="p-2 font-medium">{r.data.name ?? '—'}</td>
                          <td className="p-2 text-muted-foreground">{r.data.variety ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setExcelStep('upload')} disabled={pending}>Vælg anden fil</Button>
                  <Button onClick={handleExcelConfirm} disabled={pending || excelReady + excelWarn === 0}>
                    {pending ? 'Importerer…' : `Importér ${excelReady + excelWarn} rækker`}
                  </Button>
                </div>
              </>
            )}

            {excelStep === 'done' && excelResult && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Check className="h-7 w-7 text-primary" />
                <p className="font-serif text-xl text-foreground">Import gennemført</p>
                <p className="text-sm text-muted-foreground">
                  {excelResult.imported} rækker importeret{excelResult.skipped > 0 && `, ${excelResult.skipped} sprunget over`}.
                </p>
                <Button asChild><Link href="/froebank">Tilbage til frøbank</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MANUEL */}
      {mode === 'manuel' && (
        <Card>
          <CardContent className="py-5">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Navn *</Label><Input value={name} onChange={e => setName(e.target.value)} required className="mt-1.5" /></div>
                <div><Label>Sort</Label><Input value={variety} onChange={e => setVariety(e.target.value)} className="mt-1.5" /></div>
              </div>
              <div><Label>Latinsk navn</Label><Input value={latinName} onChange={e => setLatinName(e.target.value)} className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Primær kategori</Label>
                  <select value={primaryCat} onChange={e => { setPrimaryCat(e.target.value as PrimaryCategoryId); setSubcat('') }}
                    className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
                    {PRIMARY_CATEGORY_IDS.filter(id => id !== 'favoritter').map(id => (
                      <option key={id} value={id}>{PRIMARY_CATEGORIES[id].name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Underkategori</Label>
                  <select value={subcat} onChange={e => setSubcat(e.target.value)}
                    className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
                    <option value="">Ingen</option>
                    {tilgaengeligeSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Leverandør</Label><Input value={supplier} onChange={e => setSupplier(e.target.value)} className="mt-1.5" /></div>
                <div>
                  <Label>{isFroe ? 'Antal frø' : 'Antal'}</Label>
                  <Input type="number" value={isFroe ? seedCount : quantity}
                    onChange={e => isFroe ? setSeedCount(e.target.value) : setQuantity(e.target.value)}
                    className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Købsår</Label><Input type="number" value={purchaseYear} onChange={e => setPurchaseYear(e.target.value)} className="mt-1.5" /></div>
                <div><Label>Udløb</Label><Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1.5" /></div>
              </div>
              <div><Label>Købt her</Label><Input type="url" value={purchaseUrl} onChange={e => setPurchaseUrl(e.target.value)} className="mt-1.5" /></div>
              <div><Label>Noter</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1.5" /></div>
              <MultiImageUpload value={images} primary={primaryImage}
                onChange={(imgs, p) => { setImages(imgs); setPrimaryImage(p) }}
                folder="froebank" label="Tilføj billede(r)" />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={pending} className="w-full">
                <Plus className="h-4 w-4" />
                {pending ? 'Opretter…' : 'Opret'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ØNSKELISTE */}
      {mode === 'oenskeliste' && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">Kommer senere — ingen elementer på ønskelisten endnu.</p>
            <Button asChild variant="outline"><Link href="/froebank">Tilbage</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
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
    <button type="button" onClick={onClick}
      className={cn(
        fullWidth && 'col-span-2',
        'flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/40 hover:border-primary/50 transition-all text-left'
      )}>
      <span className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{title}</p>
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
