'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { Pencil, Wand2, Loader2 } from 'lucide-react'
import type { InventoryItem, PrimaryCategoryId } from '@/lib/types'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS, SYSTEM_SUBCATEGORIES } from '@/lib/constants'
import { updateInventoryItem } from '@/actions/froebank'
import { extractSeedPacketFields } from '@/actions/seed-packet-extract'

interface Props {
  item: InventoryItem
}

export function EditInventoryDialog({ item }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(item.name)
  const [latinName, setLatinName] = useState(item.latinName ?? '')
  const [variety, setVariety] = useState(item.variety ?? '')
  const [supplier, setSupplier] = useState(item.supplier ?? '')
  const [primaryCat, setPrimaryCat] = useState<PrimaryCategoryId>(item.primaryCategoryId)
  const [subcat, setSubcat] = useState(item.subcategoryId ?? '')
  const [seedCount, setSeedCount] = useState(item.seedCount?.toString() ?? '')
  const [quantity, setQuantity] = useState(item.quantity?.toString() ?? '')
  const [purchaseYear, setPurchaseYear] = useState(item.purchaseYear?.toString() ?? '')
  const [purchaseUrl, setPurchaseUrl] = useState(item.purchaseUrl ?? '')
  const [expiryDate, setExpiryDate] = useState(item.expiryDate ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [images, setImages] = useState<string[]>(item.imageIds.length > 0 ? item.imageIds : item.primaryImageId ? [item.primaryImageId] : [])
  const [primaryImage, setPrimaryImage] = useState<string | null>(item.primaryImageId ?? null)

  const [aiPending, setAiPending] = useState(false)
  const [aiInfo, setAiInfo] = useState<string | null>(null)

  const isFroe = primaryCat === 'fro'
  const tilgaengeligeSubs = SYSTEM_SUBCATEGORIES.filter(s => s.parentCategoryIds.includes(primaryCat))

  async function handleReadWithAI() {
    if (images.length === 0) return
    setError(null)
    setAiInfo(null)
    setAiPending(true)
    try {
      const res = await extractSeedPacketFields(images)
      if ('error' in res) {
        setError(`AI: ${res.error}`)
        return
      }
      const f = res.fields
      const filled: string[] = []
      if (!name.trim() && f.name)              { setName(f.name); filled.push('navn') }
      if (!latinName.trim() && f.latinName)    { setLatinName(f.latinName); filled.push('latinsk navn') }
      if (!variety.trim() && f.variety)        { setVariety(f.variety); filled.push('sort') }
      if (!supplier.trim() && f.supplier)      { setSupplier(f.supplier); filled.push('leverandør') }
      if (isFroe && !seedCount && f.seedCount != null) { setSeedCount(String(f.seedCount)); filled.push('antal frø') }
      if (!notes.trim() && f.notes)            { setNotes(f.notes); filled.push('noter') }
      setAiInfo(filled.length > 0
        ? `Udfyldte: ${filled.join(', ')}. Klik Gem for at gemme.`
        : 'AI fandt ikke ny info som ikke allerede er udfyldt.')
    } finally {
      setAiPending(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await updateInventoryItem(item.id, {
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
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" />
          Rediger
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle>Rediger {item.name}</DialogTitle>
        <DialogDescription>Ret felter for denne frøpose/batch.</DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Navn *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>Sort</Label>
              <Input value={variety} onChange={e => setVariety(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Latinsk navn</Label>
            <Input value={latinName} onChange={e => setLatinName(e.target.value)} className="mt-1.5" />
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
              <Input value={supplier} onChange={e => setSupplier(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>{isFroe ? 'Antal frø' : 'Antal'}</Label>
              <Input
                type="number"
                value={isFroe ? seedCount : quantity}
                onChange={e => isFroe ? setSeedCount(e.target.value) : setQuantity(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Købsår</Label>
              <Input type="number" value={purchaseYear} onChange={e => setPurchaseYear(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Udløb</Label>
              <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Købt her</Label>
            <Input type="url" value={purchaseUrl} onChange={e => setPurchaseUrl(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label>Noter</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1.5" />
          </div>

          <div>
            <Label>Billeder</Label>
            <div className="mt-1.5 space-y-2">
              <MultiImageUpload
                value={images}
                primary={primaryImage}
                onChange={(imgs, p) => { setImages(imgs); setPrimaryImage(p) }}
                folder="froebank"
                label="Tilføj billede(r)"
              />
              {images.length > 0 && (
                <Button type="button" variant="outline" className="w-full" onClick={handleReadWithAI} disabled={aiPending}>
                  {aiPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {aiPending ? 'Læser…' : 'Genlæs billeder med AI'}
                </Button>
              )}
              {aiInfo && <p className="text-xs text-muted-foreground">{aiInfo}</p>}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Gemmer…' : 'Gem ændringer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
