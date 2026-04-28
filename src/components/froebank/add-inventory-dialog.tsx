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
import { ImageUpload } from '@/components/ui/image-upload'
import { Camera, FileText, Sparkles, Plus } from 'lucide-react'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS, SYSTEM_SUBCATEGORIES } from '@/lib/constants'
import type { PrimaryCategoryId } from '@/lib/types'
import { createInventoryItem } from '@/actions/froebank'

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
  const [variety, setVariety] = useState('')
  const [supplier, setSupplier] = useState('')
  const [primaryCat, setPrimaryCat] = useState<PrimaryCategoryId>('fro')
  const [subcat, setSubcat] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  function reset() {
    setName(''); setVariety(''); setSupplier(''); setPrimaryCat('fro')
    setSubcat(''); setQuantity(''); setNotes(''); setImageUrl(null); setError(null)
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await createInventoryItem({
        name: name.trim(),
        variety: variety.trim() || undefined,
        supplier: supplier.trim() || undefined,
        primaryCategoryId: primaryCat,
        subcategoryId: subcat || undefined,
        quantity: quantity ? parseInt(quantity, 10) : undefined,
        notes: notes.trim() || undefined,
        imageUrls: imageUrl ? [imageUrl] : undefined,
        primaryImageUrl: imageUrl ?? undefined,
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

          {/* SCAN — placeholder */}
          <TabsContent value="scan">
            <div className="text-center py-8 space-y-3 bg-pattern-botanical rounded-2xl">
              <Camera className="h-10 w-10 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium text-foreground">Scan frøpose</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Tag et eller flere fotos af frøposen. Billederne gemmes som dokumentation.
                </p>
              </div>
              <Button disabled>
                <Camera className="h-4 w-4" />
                Tag foto (TODO storage)
              </Button>
              <p className="text-xs text-muted-foreground italic">
                AI-foreslåede felter kommer senere — i første version kun billede-upload.
              </p>
            </div>
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
                  <Label>Antal</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="0"
                    className="mt-1.5"
                  />
                </div>
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

              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                folder="froebank"
                label="Tilføj billede"
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
