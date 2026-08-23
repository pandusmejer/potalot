'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import {
  Camera, Image as ImageIcon, FileSpreadsheet, FileText, Sparkles, Link2,
  Loader2, ArrowLeft, Upload, Download, Check, Wand2, AlertTriangle,
} from 'lucide-react'
import { FROEPOSE_UDEN_NAVN } from '@/lib/constants'
import type { PrimaryCategoryId } from '@/lib/types'
import { createInventoryItem } from '@/actions/froebank'
import { harKurateretFroekort } from '@/lib/images/resolve-potalot-image'
import { extractSeedPacketFields, extractSeedFromUrl, type ExtractedSeedFields } from '@/actions/seed-packet-extract'
import { parseInventoryFile, confirmImportInventory, readImportLinks } from '@/actions/inventory-import'
import {
  byggImportPreview, unikkeLinks, LINK_CHUNK, IMPORT_STATUS_LABEL,
  type EnrichedImportRow, type LinkResult,
} from '@/lib/inventory-import-merge'
import { ManuelOpret } from './manuel-opret'
import { cn } from '@/lib/utils'

type Mode = 'select' | 'camera' | 'library' | 'link' | 'excel' | 'manuel' | 'oenskeliste'

interface Props {
  initialMode: Mode
  /** Hvor "tilbage"/"færdig" fører hen. Default frøbank; onboarding overrider. */
  returnTo?: string
  /** Menneske-læsbar etiket for returmålet (fx "frøbank" / "opsætning"). */
  returnLabel?: string
  /** Forudfyld manuel oprettelse (fra søgning-uden-match / guide-CTA'er). */
  initialName?: string
  initialVariety?: string
}

export function TilfoejFlow({ initialMode, returnTo = '/froebank', returnLabel = 'frøbank', initialName, initialVariety }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Manuel oprettelse bor i <ManuelOpret> (to-trins flow med autofill).

  // Foto
  const [scanName, setScanName] = useState('')
  const [scanImages, setScanImages] = useState<string[]>([])
  const [scanPrimary, setScanPrimary] = useState<string | null>(null)
  const [scanStage, setScanStage] = useState<'idle' | 'reading' | 'review' | 'failed' | 'creating' | 'done'>('idle')
  const [scanExtracted, setScanExtracted] = useState<ExtractedSeedFields | null>(null)
  const [scanTarget, setScanTarget] = useState<'froebank' | 'oenskeliste'>('froebank')
  const [scanCreatedId, setScanCreatedId] = useState<string | null>(null)
  const [scanIncomplete, setScanIncomplete] = useState(false)

  // Link
  const [linkUrl, setLinkUrl] = useState('')

  // Excel — berigelse sker FØR oprettelse: fil → links → merge → review.
  const excelInputRef = useRef<HTMLInputElement>(null)
  const [excelStep, setExcelStep] = useState<'upload' | 'laeser' | 'preview' | 'done'>('upload')
  const [excelRows, setExcelRows] = useState<EnrichedImportRow[]>([])
  const [excelUnmapped, setExcelUnmapped] = useState<string[]>([])
  const [excelResult, setExcelResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [excelBusy, setExcelBusy] = useState(false)
  const [linkProgress, setLinkProgress] = useState<{ laest: number; ialt: number } | null>(null)
  const [aabenRaekke, setAabenRaekke] = useState<number | null>(null)

  // ── FASE 1: LÆS posen. Opretter ALDRIG her — hverken ved API-fejl eller tom
  //    udlæsning (spejler F5's ærlige adfærd). Fører til 'review' (navn aflæst)
  //    eller 'failed' (fejl / ingen brugbar identifikation). ──────────────────
  async function runScan(imgs: string[]) {
    setError(null)
    setScanStage('reading')
    const ext = await extractSeedPacketFields(imgs)
    if ('error' in ext) {
      // Rigtig AI/API-fejl må ALDRIG sluges eller ende som "succes".
      // Detaljen logges internt — aldrig i UI'et (FRB-0227).
      console.error('frøpose-skanning fejlede:', ext.error)
      setScanStage('failed')
      return
    }
    const fields = ext.fields
    setScanExtracted(fields)
    const aflaestNavn = fields.name?.trim() ?? ''
    if (!aflaestNavn) {
      // Gyldigt billede, men ingen brugbar identifikation → opret intet.
      setScanStage('failed')
      return
    }
    setScanName(aflaestNavn) // redigerbart i review-trinnet
    setScanStage('review')
  }

  // ── FASE 2: OPRET. Kun fra et EKSPLICIT brugervalg (review "Opret" eller
  //    "Gem kun foto til senere"). incomplete=true → bevidst foto-kun-kladde
  //    markeret "Mangler oplysninger". ─────────────────────────────────────
  async function runScanCreate(opts: { incomplete: boolean }) {
    const fields = scanExtracted ?? {}
    setScanStage('creating')
    const finalName = opts.incomplete ? FROEPOSE_UDEN_NAVN : (scanName.trim() || FROEPOSE_UDEN_NAVN)

    // Frøkort-reglen: posefotos er KILDEMATERIALE til specs, ikke hovedbillede.
    // Findes et kurateret frøkort for sorten, vinder DET som forsidefoto.
    const harFroekort = harKurateretFroekort({ name: finalName, variety: fields.variety })

    // Foto-kun-kladde bærer INGEN opdigtede felter — kun billede + markør.
    const specs = opts.incomplete
      ? {
          primaryCategoryId: scanTarget === 'oenskeliste' ? ('indkoebsliste' as PrimaryCategoryId) : ('fro' as PrimaryCategoryId),
          notes: 'Gemt fra foto — kunne ikke aflæses automatisk. Åbn kortet og udfyld oplysningerne.',
        }
      : {
          latinName: fields.latinName,
          variety: fields.variety,
          supplier: fields.supplier,
          primaryCategoryId: scanTarget === 'oenskeliste' ? 'indkoebsliste' : (fields.primaryCategoryId ?? 'fro'),
          seedCount: fields.seedCount,
          sowingMonths: fields.sowingMonths,
          sowingDepthMm: fields.sowingDepthMm,
          preCultivation: fields.preCultivation,
          plantingOutMonths: fields.plantingOutMonths,
          harvestMonths: fields.harvestMonths,
          light: fields.light,
          water: fields.water,
          germinationDays: fields.germinationDays,
          germinationTemperature: fields.germinationTemperature,
          plantSpacing: fields.plantSpacing,
          rowSpacing: fields.rowSpacing,
          notes: fields.notes,
        }

    const res = await createInventoryItem({
      name: finalName,
      ...specs,
      imageUrls: scanImages,
      primaryImageUrl: harFroekort ? undefined : (scanPrimary ?? undefined),
    })

    if ('error' in res) {
      console.error('oprettelse efter skanning fejlede:', res.error)
      setScanStage('failed')
      return
    }
    setScanCreatedId(res.id)
    setScanName(finalName)
    setScanIncomplete(opts.incomplete)
    setScanStage('done')
    router.refresh()
  }

  function handleScanImagesChange(imgs: string[], p: string | null) {
    setScanImages(imgs)
    setScanPrimary(p)
  }

  function handleScanStart() {
    if (scanImages.length === 0) return
    startTransition(() => runScan(scanImages))
  }

  // Failed-trin-handlinger.
  function resetScan(toMode?: 'camera' | 'library') {
    setScanImages([]); setScanPrimary(null); setScanExtracted(null)
    setScanName(''); setScanStage('idle')
    if (toMode) setMode(toMode)
  }
  function handleSkrivNavnSelv() {
    // Ingen brugbar aflæsning → lad brugeren navngive selv (billeder bevares).
    setScanName('')
    setScanStage('review')
  }
  function handleReviewOpret() {
    if (!scanName.trim()) return
    startTransition(() => runScanCreate({ incomplete: false }))
  }
  function handleGemKunFoto() {
    startTransition(() => runScanCreate({ incomplete: true }))
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
      preCultivation: ext.fields.preCultivation,
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

  // ── EXCEL: berig FØR oprettelse ────────────────────────────────────────
  //  fil → normalisér → læs links → merge (Excel > link > sort > art > STOP)
  //  → resolve frøkort → validér → review. Intet oprettes før brugeren
  //  trykker "Importér". Ingen manuel "Autoudfyld" pr. række.
  async function handleExcelFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const fd = new FormData()
    fd.append('file', file)

    setExcelBusy(true)
    try {
      const res = await parseInventoryFile(fd)
      if ('error' in res) { setError(res.error); return }
      setExcelUnmapped(res.unmappedColumns)
      setAabenRaekke(null)

      // Hver URL hentes kun ÉN gang pr. import — også når ti rækker deler
      // samme produktside.
      const links = unikkeLinks(res.rows)
      if (links.length === 0) {
        setExcelRows(byggImportPreview(res.rows, {}))
        setExcelStep('preview')
        return
      }

      setLinkProgress({ laest: 0, ialt: links.length })
      setExcelRows(byggImportPreview(res.rows, {}))
      setExcelStep('laeser')

      // Bidder med begrænset samtidighed. Et link der fejler (eller et helt
      // kald der fejler) må ALDRIG stoppe importen — rækken beholder sine
      // Excel-data og markeres "Link kunne ikke læses".
      const svar: Record<string, LinkResult> = {}
      for (let i = 0; i < links.length; i += LINK_CHUNK) {
        const bid = links.slice(i, i + LINK_CHUNK)
        try {
          Object.assign(svar, await readImportLinks(bid))
        } catch (err) {
          console.error('import-link-bid fejlede:', err)
          for (const u of bid) svar[u] = { ok: false }
        }
        setLinkProgress({ laest: Math.min(i + LINK_CHUNK, links.length), ialt: links.length })
        setExcelRows(byggImportPreview(res.rows, svar))
      }
      setExcelStep('preview')
    } finally {
      setExcelBusy(false)
      setLinkProgress(null)
    }
  }

  async function handleExcelConfirm() {
    setError(null)
    setExcelBusy(true)
    try {
      const res = await confirmImportInventory(excelRows)
      if ('error' in res) { setError(res.error); return }
      setExcelResult(res); setExcelStep('done')
      router.refresh()
    } finally {
      setExcelBusy(false)
    }
  }

  const excelKlar = excelRows.filter(r => r.status === 'klar').length
  const excelDelvist = excelRows.filter(r => r.status === 'delvist').length
  const excelLinkFejl = excelRows.filter(r => r.status === 'link_fejl').length
  const excelErr = excelRows.filter(r => r.status === 'fejl').length
  const excelImporterbare = excelRows.length - excelErr

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        {mode === 'select' ? (
          <Button asChild variant="ghost" size="icon">
            <Link href={returnTo} aria-label="Tilbage">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button
            variant="ghost" size="icon" aria-label="Tilbage"
            onClick={() => {
              // Fra onboarding kom man DIREKTE til et mode (scan/excel) uden at
              // se select-menuen → tilbage skal føre helt tilbage til onboarding,
              // ikke lande i frøbank-tilføj-menuen. Normalt flow: tilbage til select.
              if (returnTo !== '/froebank') router.push(returnTo)
              else setMode('select')
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-2xl font-serif text-foreground">
          {mode === 'select' && 'Tilføj til Frøbanken'}
          {mode === 'camera' && 'Scan frøpose'}
          {mode === 'library' && 'Scan frøpose'}
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
              {mode === 'camera' ? 'Tag et billede af frøposen' : 'Vælg billeder af frøposens forside og bagside'}, så Potalot kan læse oplysningerne og oprette frøet i {scanTarget === 'oenskeliste' ? 'ønskelisten' : 'Frøbanken'}.
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
            {scanTarget === 'oenskeliste' && (
              <p className="text-[11px] text-muted-foreground -mt-2">Sorter på ønskelisten tæller ikke som frø, du allerede ejer.</p>
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
                    Læs {scanImages.length} billede{scanImages.length > 1 ? 'r' : ''}
                  </Button>
                )}
              </>
            )}

            {(scanStage === 'reading' || scanStage === 'creating') && (
              <div className="flex items-center gap-3 text-sm bg-secondary/40 rounded-lg p-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {scanStage === 'reading' ? 'Læser billedet …' : 'Opretter…'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scanStage === 'reading' ? 'Genkender navn, sort, leverandør osv.' : `Gemmer i ${scanTarget === 'oenskeliste' ? 'ønskelisten' : 'Frøbanken'}`}
                  </p>
                </div>
              </div>
            )}

            {/* REVIEW — navn aflæst (eller "skriv selv"): brugeren godkender/
                retter FØR oprettelse. Intet er gemt endnu. */}
            {scanStage === 'review' && (
              <div className="space-y-4">
                <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {scanExtracted?.name
                      ? 'Potalot læste posen. Tjek navnet, og ret det om nødvendigt, før du opretter.'
                      : 'Giv frøposen et navn, så du kan oprette den. Resten kan du udfylde på kortet bagefter.'}
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="scan-review-name">Navn</Label>
                    <Input id="scan-review-name" value={scanName} onChange={e => setScanName(e.target.value)} placeholder="fx Tomat, Gulerod …" autoFocus />
                  </div>
                  {scanExtracted && (scanExtracted.latinName || scanExtracted.variety || scanExtracted.supplier || scanExtracted.seedCount != null) && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                      {scanExtracted.latinName && <Field label="Latinsk" value={scanExtracted.latinName} />}
                      {scanExtracted.variety && <Field label="Sort" value={scanExtracted.variety} />}
                      {scanExtracted.supplier && <Field label="Leverandør" value={scanExtracted.supplier} />}
                      {scanExtracted.seedCount != null && <Field label="Antal frø" value={String(scanExtracted.seedCount)} />}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleReviewOpret} disabled={pending || !scanName.trim()}>
                    {pending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Opretter…</> : `Opret i ${scanTarget === 'oenskeliste' ? 'ønskelisten' : 'Frøbanken'}`}
                  </Button>
                  <Button variant="outline" onClick={() => resetScan()} disabled={pending}>Scan igen</Button>
                </div>
              </div>
            )}

            {/* FAILED — API-fejl ELLER ingen brugbar aflæsning. Intet oprettet.
                Ærlig besked + valg (spejler F5). "Gem kun foto" er det ENESTE
                der opretter noget — og da som en markeret kladde. */}
            {scanStage === 'failed' && (
              <div className="space-y-4">
                <div className="bg-destructive/5 border border-destructive/25 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-serif text-lg text-foreground">Vi kunne ikke læse frøposen</p>
                      <p className="text-sm text-muted-foreground">
                        Prøv med et skarpere billede i bedre lys, eller skriv plantens navn selv.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => resetScan('camera')} disabled={pending}>
                    <Camera className="h-4 w-4" /> Tag nyt billede
                  </Button>
                  <Button variant="outline" onClick={() => resetScan('library')} disabled={pending}>
                    <ImageIcon className="h-4 w-4" /> Vælg et andet foto
                  </Button>
                  <Button variant="outline" onClick={handleSkrivNavnSelv} disabled={pending}>
                    <FileText className="h-4 w-4" /> Skriv navn og udfyld selv
                  </Button>
                  <Button variant="ghost" onClick={handleGemKunFoto} disabled={pending}>
                    {pending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Gemmer…</> : <><ImageIcon className="h-4 w-4" /> Gem kun foto til senere</>}
                  </Button>
                </div>
              </div>
            )}

            {scanStage === 'done' && scanCreatedId && (
              <div className={cn('rounded-lg p-4 space-y-3 border', scanIncomplete ? 'bg-secondary/40 border-border' : 'bg-primary/5 border-primary/30')}>
                <div className="flex items-start gap-3">
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', scanIncomplete ? 'bg-muted' : 'bg-primary/10')}>
                    {scanIncomplete ? <ImageIcon className="h-5 w-5 text-muted-foreground" /> : <Check className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg text-foreground">
                      {scanIncomplete ? 'Foto gemt som kladde' : `Oprettet i ${scanTarget === 'oenskeliste' ? 'ønskelisten' : 'Frøbanken'}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {scanIncomplete ? 'Mangler oplysninger — åbn kortet og udfyld navn og detaljer.' : scanName}
                    </p>
                  </div>
                </div>
                {!scanIncomplete && scanExtracted && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-primary/20">
                    {scanExtracted.latinName && <Field label="Latinsk" value={scanExtracted.latinName} />}
                    {scanExtracted.variety && <Field label="Sort" value={scanExtracted.variety} />}
                    {scanExtracted.supplier && <Field label="Leverandør" value={scanExtracted.supplier} />}
                    {scanExtracted.seedCount != null && <Field label="Antal frø" value={String(scanExtracted.seedCount)} />}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button asChild>
                    <Link href={`/froebank/${scanCreatedId}`}>{scanIncomplete ? 'Åbn og udfyld' : 'Se i frøbank'}</Link>
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setScanImages([]); setScanPrimary(null); setScanStage('idle')
                    setScanExtracted(null); setScanCreatedId(null); setScanName('')
                    setScanIncomplete(false)
                  }}>
                    Scan en til
                  </Button>
                  {returnTo !== '/froebank' && (
                    <Button asChild variant="ghost">
                      <Link href={returnTo}>Færdig — tilbage til {returnLabel}</Link>
                    </Button>
                  )}
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
              Indsæt et link til en frøside hos fx Impecta, Nelson Garden eller Solhatt. Potalot læser oplysningerne og opretter frøet i {scanTarget === 'oenskeliste' ? 'ønskelisten' : 'Frøbanken'}.
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
                {scanTarget === 'oenskeliste' && (
                  <p className="text-[11px] text-muted-foreground -mt-2">Sorter på ønskelisten tæller ikke som frø, du allerede ejer.</p>
                )}

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
                    Læs oplysninger fra link
                  </Button>
                </form>
              </>
            )}

            {(scanStage === 'reading' || scanStage === 'creating') && (
              <div className="flex items-center gap-3 text-sm bg-secondary/40 rounded-lg p-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {scanStage === 'reading' ? 'Læser siden …' : 'Opretter…'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scanStage === 'reading' ? 'Henter side, billede og data.' : `Gemmer i ${scanTarget === 'oenskeliste' ? 'ønskelisten' : 'Frøbanken'}`}
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
                <p className="text-sm text-muted-foreground">
                  Upload .xlsx eller .csv. Kolonner mappes automatisk, og står der et
                  produktlink i en række, læser vi det med det samme.
                </p>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.csv,.xls"
                  onChange={handleExcelFile}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <Button onClick={() => excelInputRef.current?.click()} disabled={excelBusy}>
                    <Upload className="h-4 w-4" />
                    {excelBusy ? 'Læser…' : 'Vælg fil'}
                  </Button>
                </div>
                <a href="/api/inventory/template" className="flex items-center gap-2 text-sm text-primary hover:underline justify-center">
                  <Download className="h-3.5 w-3.5" />
                  Download skabelon
                </a>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
              </>
            )}

            {excelStep === 'laeser' && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="font-serif text-lg text-foreground">Vi læser dine links</p>
                <p className="text-sm text-muted-foreground">
                  {linkProgress
                    ? `${linkProgress.laest} af ${linkProgress.ialt} ${linkProgress.ialt === 1 ? 'link' : 'links'} læst`
                    : 'Et øjeblik…'}
                </p>
                {linkProgress && (
                  <div className="h-1.5 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.round((linkProgress.laest / Math.max(linkProgress.ialt, 1)) * 100)}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground max-w-xs">
                  Links, vi ikke kan læse, springes over — dine egne oplysninger går aldrig tabt.
                </p>
              </div>
            )}

            {excelStep === 'preview' && (
              <>
                <p className="text-sm">
                  {excelRows.length} {excelRows.length === 1 ? 'række' : 'rækker'} fundet.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {excelKlar > 0 && <Badge variant="success">{excelKlar} klar</Badge>}
                  {excelDelvist > 0 && <Badge variant="warning">{excelDelvist} delvist udfyldt</Badge>}
                  {excelLinkFejl > 0 && <Badge variant="warning">{excelLinkFejl} link kunne ikke læses</Badge>}
                  {excelErr > 0 && <Badge variant="muted">{excelErr} med fejl</Badge>}
                </div>
                {excelUnmapped.length > 0 && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs">
                    Kolonner uden match: {excelUnmapped.join(', ')}
                  </div>
                )}

                <ul className="max-h-80 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  {excelRows.map(r => {
                    const aaben = aabenRaekke === r.rowNumber
                    const detaljer =
                      r.konflikter.length + r.warnings.length + r.errors.length > 0 || !!r.flerePoserNote
                    return (
                      <li key={r.rowNumber}>
                        <button
                          type="button"
                          onClick={() => setAabenRaekke(aaben ? null : r.rowNumber)}
                          disabled={!detaljer}
                          className={cn(
                            'w-full text-left px-3 py-2.5 flex items-start gap-2',
                            detaljer && 'hover:bg-muted/50',
                          )}
                        >
                          <span className="shrink-0 pt-0.5">
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
                              {[r.values.supplier, r.values.purchaseYear]
                                .filter(Boolean).join(' · ') || IMPORT_STATUS_LABEL[r.status]}
                            </span>
                          </span>
                          {detaljer && (
                            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                          )}
                        </button>

                        {aaben && detaljer && (
                          <div className="px-3 pb-3 space-y-2 text-xs">
                            {r.errors.map((m, i) => (
                              <p key={`e${i}`} className="text-destructive">{m}</p>
                            ))}
                            {r.konflikter.map(k => (
                              <div key={k.felt} className="bg-muted/60 rounded-md p-2">
                                <p className="font-medium">{k.label}</p>
                                <p className="text-muted-foreground">Din fil: {k.fil}</p>
                                <p className="text-muted-foreground">Linket: {k.link}</p>
                                <p>Vi beholder {k.fil}.</p>
                              </div>
                            ))}
                            {r.flerePoserNote && (
                              <p className="text-muted-foreground">{r.flerePoserNote}</p>
                            )}
                            {r.warnings.map((m, i) => (
                              <p key={`w${i}`} className="text-muted-foreground">{m}</p>
                            ))}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>

                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setExcelStep('upload')} disabled={excelBusy}>Vælg anden fil</Button>
                  <Button onClick={handleExcelConfirm} disabled={excelBusy || excelImporterbare === 0}>
                    {excelBusy ? 'Importerer…' : `Importér ${excelImporterbare} ${excelImporterbare === 1 ? 'række' : 'rækker'}`}
                  </Button>
                </div>
              </>
            )}

            {excelStep === 'done' && excelResult && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Check className="h-7 w-7 text-primary" />
                <p className="font-serif text-xl text-foreground">Import gennemført</p>
                <p className="text-sm text-muted-foreground">
                  {excelResult.imported} {excelResult.imported === 1 ? 'række' : 'rækker'} importeret{excelResult.skipped > 0 && `, ${excelResult.skipped} sprunget over`}.
                </p>
                <Button asChild><Link href={returnTo}>Tilbage til {returnLabel}</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MANUEL — to-trins flow med autofill, eget komponent */}
      {mode === 'manuel' && <ManuelOpret returnTo={returnTo} initialName={initialName} initialVariety={initialVariety} />}

      {/* ØNSKELISTE — bor som kategori i Frøbanken (ingen blindgyder). */}
      {mode === 'oenskeliste' && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Din ønskeliste bor i Frøbanken. Gem sorter, du overvejer — og flyt
              dem til Frøbanken, når du er klar.
            </p>
            <Button asChild><Link href="/froebank?kategori=indkoebsliste">Se din ønskeliste</Link></Button>
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
