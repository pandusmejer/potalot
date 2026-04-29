'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { Camera, FileText, Sparkles, Plus, Loader2 } from 'lucide-react'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS, SYSTEM_SUBCATEGORIES } from '@/lib/constants'
import type { PrimaryCategoryId } from '@/lib/types'
import { createInventoryItem } from '@/actions/froebank'
import { extractSeedPacketFields, type ExtractedSeedFields } from '@/actions/seed-packet-extract'

interface Props {
  children: React.ReactNode
}

export function AddInventoryDialog({ children }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Manuel form state
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

  // Scan-tab state — minimum: navn + billeder
  const [scanName, setScanName] = useState('')
  const [scanImages, setScanImages] = useState<string[]>([])
  const [scanPrimary, setScanPrimary] = useState<string | null>(null)
  const [scanExtracting, setScanExtracting] = useState(false)
  const [scanExtracted, setScanExtracted] = useState<ExtractedSeedFields | null>(null)

  const isFroe = primaryCat === 'fro'

  function reset() {
    setName(''); setLatinName(''); setVariety(''); setSupplier(''); setPrimaryCat('fro')
    setSubcat(''); setQuantity(''); setSeedCount(''); setPurchaseYear(''); setPurchaseUrl('')
    setExpiryDate(''); setNotes(''); setImages([]); setPrimaryImage(null); setError(null)
    setScanName(''); setScanImages([]); setScanPrimary(null)
    setScanExtracting(false); setScanExtracted(null)
  }

  async function runScanExtraction(images: string[]) {
    if (images.length === 0) return
    setScanExtracting(true)
    setError(null)
    const res = await extractSeedPacketFields(images)
    setScanExtracting(false)
    if ('error' in res) {
      setError(`AI kunne ikke læse frøposen: ${res.error}`)
      return
    }
    setScanExtracted(res.fields)
    if (res.fields.name && !scanName) setScanName(res.fields.name)
  }

  function handleScanImagesChange(imgs: string[], p: string | null) {
    const newImage = imgs.find(u => !scanImages.includes(u))
    setScanImages(imgs)
    setScanPrimary(p)
    // Auto-trigger AI når første billede tilføjes
    if (newImage && scanImages.length === 0) {
      runScanExtraction(imgs)
    }
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

      setOpen(false)
      reset()
      router.refresh()
      router.push(`/froebank/${res.id}`)
    })
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
      setOpen(false)
      reset()
      router.refresh()
      router.push(`/froebank/${res.id}`)
    })
  }

  const tilgaengeligeSubs = SYSTEM_SUBCATEGORIES.filter(s => s.parentCategoryIds.includes(primaryCat))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle>Tilføj til frøbank</DialogTitle>
        <DialogDescription>
          Scan en frøpose, opret manuelt, eller hent fra ønskelisten.
        </DialogDescription>

        <Tabs defaultValue="manuel">
          <TabsList className="w-full">
            <TabsTrigger value="scan" className="flex-1">
              <Camera className="h-3.5 w-3.5" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="manuel" className="flex-1">
              <FileText className="h-3.5 w-3.5" />
              Manuel
            </TabsTrigger>
            <TabsTrigger value="oenskeliste" className="flex-1">
              <Sparkles className="h-3.5 w-3.5" />
              Ønskeliste
            </TabsTrigger>
          </TabsList>

          {/* SCAN — billeder + AI auto-udfyldning */}
          <TabsContent value="scan">
            <form onSubmit={handleScanSubmit} className="space-y-3">
              <div>
                <Label>Billeder af frøposen (forside, bagside)</Label>
                <div className="mt-1.5">
                  <MultiImageUpload
                    value={scanImages}
                    primary={scanPrimary}
                    onChange={handleScanImagesChange}
                    folder="froebank"
                    maxImages={6}
                    label="Tag eller vælg billeder"
                  />
                </div>
              </div>

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
                <p className="text-xs text-muted-foreground mt-1">
                  {scanExtracted ? 'Tjek og rediger om nødvendigt.' : 'Bliver auto-udfyldt når billede uploades.'}
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
                <Button type="submit" disabled={pending || scanExtracting}>
                  <Plus className="h-4 w-4" />
                  {pending ? 'Opretter…' : 'Opret'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* MANUEL — gemmer rigtigt nu */}
          <TabsContent value="manuel">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Navn *</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Fx. Tomat"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Sort</Label>
                  <Input
                    value={variety}
                    onChange={e => setVariety(e.target.value)}
                    placeholder="Fx. San Marzano"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label>Latinsk navn</Label>
                <Input
                  value={latinName}
                  onChange={e => setLatinName(e.target.value)}
                  placeholder="Fx. Solanum lycopersicum"
                  className="mt-1.5"
                />
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
                    {tilgaengeligeSubs.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Leverandør</Label>
                  <Input
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="Fx. Impecta, Plantorama"
                    className="mt-1.5"
                  />
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
                  <Input
                    type="number"
                    value={purchaseYear}
                    onChange={e => setPurchaseYear(e.target.value)}
                    placeholder="Fx. 2026"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Udløb</Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label>Købt her</Label>
                <Input
                  type="url"
                  value={purchaseUrl}
                  onChange={e => setPurchaseUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Noter</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Egen note, fx. 'kun dyrket i drivhus'"
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              <MultiImageUpload
                value={images}
                primary={primaryImage}
                onChange={(imgs, p) => { setImages(imgs); setPrimaryImage(p) }}
                folder="froebank"
                label="Tilføj billede(r)"
              />

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Annullér
                </Button>
                <Button type="submit" disabled={pending}>
                  <Plus className="h-4 w-4" />
                  {pending ? 'Opretter…' : 'Opret'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="oenskeliste">
            <div className="text-center py-8 space-y-3 bg-pattern-botanical rounded-2xl">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-medium text-foreground">Hent fra ønskeliste</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Når du tilføjer planter til din ønskeliste i frøbanken, kan du flytte dem hertil når de er købt.
              </p>
              <Button variant="outline" disabled>Vælg fra ønskeliste (TODO)</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
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
