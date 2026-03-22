'use client'

import { createSeed, updateSeed, deleteSeed } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { DEFAULT_SUBCATEGORIES } from '@/lib/constants'
import { formatDanishDate, validateDanishDate } from '@/lib/date-utils'
import type { Seed, PlantGuide } from '@/lib/types'
import { useState, useTransition, useMemo } from 'react'
import { Trash2 } from 'lucide-react'

interface SeedFormProps {
  open: boolean
  onClose: () => void
  seed?: Seed | null
  guides: PlantGuide[]
  defaultSubcategory?: string | null
}

export function SeedForm({ open, onClose, seed, guides, defaultSubcategory }: SeedFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [quantityError, setQuantityError] = useState<string | null>(null)

  // Seed quantity tracking
  const [seedsTotal, setSeedsTotal] = useState<string>(seed?.seeds_total?.toString() ?? '')
  const [seedsSown, setSeedsSown] = useState<string>(seed?.seeds_sown?.toString() ?? '0')

  const seedsRemaining = useMemo(() => {
    const total = parseInt(seedsTotal, 10)
    const sown = parseInt(seedsSown, 10)
    if (isNaN(total)) return null
    return total - (isNaN(sown) ? 0 : sown)
  }, [seedsTotal, seedsSown])

  const initialExpiryDate = seed?.expiry_date ? formatDanishDate(seed.expiry_date) : ''

  function handleSubmit(formData: FormData) {
    setError(null)
    setDateError(null)
    setQuantityError(null)

    // Validate date format
    const expiryDateVal = formData.get('expiry_date') as string
    if (expiryDateVal && !validateDanishDate(expiryDateVal)) {
      setDateError('Ugyldig dato — brug format DD.MM.ÅÅÅÅ')
      return
    }

    // Validate sown <= total
    const totalVal = formData.get('seeds_total') ? Number(formData.get('seeds_total')) : null
    const sownVal = formData.get('seeds_sown') ? Number(formData.get('seeds_sown')) : 0
    if (totalVal != null && sownVal > totalVal) {
      setQuantityError('Antal sået kan ikke være større end antal total')
      return
    }

    // Always set primary_category to 'froe' for frøbank
    formData.set('primary_category', 'froe')

    startTransition(async () => {
      const result = seed
        ? await updateSeed(seed.id, formData)
        : await createSeed(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  function handleDelete() {
    if (!seed) return
    if (!confirm('Slet dette frø?')) return
    startTransition(async () => {
      await deleteSeed(seed.id)
      onClose()
    })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{seed ? 'Rediger frø' : 'Tilføj frø'}</DialogTitle>
      <form action={handleSubmit} className="space-y-4">

        {/* Identitet */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Dansk navn *</label>
            <Input name="name" required defaultValue={seed?.name ?? ''} placeholder="fx. Tomat" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort</label>
            <Input name="variety" defaultValue={seed?.variety ?? ''} placeholder="fx. San Marzano" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Botanisk navn</label>
            <Input name="botanical_name" defaultValue={seed?.botanical_name ?? ''} placeholder="fx. Solanum lycopersicum" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Underkategori</label>
            <Select name="subcategory" defaultValue={seed?.subcategory ?? defaultSubcategory ?? ''}>
              <option value="">Ingen</option>
              {DEFAULT_SUBCATEGORIES.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Guide kobling */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Dyrkningsguide</label>
            <Select name="guide_id" defaultValue={seed?.guide_id ?? ''}>
              <option value="">Ingen</option>
              {guides.map((g) => (
                <option key={g.id} value={g.id}>{g.name_da}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select name="status" defaultValue={seed?.status ?? 'in_stock'}>
              <option value="in_stock">På lager</option>
              <option value="sown">Sået</option>
              <option value="depleted">Opbrugt</option>
              <option value="expired">Udløbet</option>
            </Select>
          </div>
        </div>

        {/* Lager og køb */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Antal frø (total)</label>
            <Input
              name="seeds_total"
              type="number"
              min="0"
              value={seedsTotal}
              onChange={e => setSeedsTotal(e.target.value)}
              placeholder="fx. 50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Antal sået</label>
            <Input
              name="seeds_sown"
              type="number"
              min="0"
              value={seedsSown}
              onChange={e => setSeedsSown(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tilbage</label>
            <div className="h-9 flex items-center px-3 rounded-lg border border-border bg-muted/50 text-sm">
              {seedsRemaining != null ? (
                <span className={seedsRemaining <= 0 ? 'text-destructive font-medium' : 'text-foreground font-medium'}>
                  {seedsRemaining}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </div>
        {quantityError && <p className="text-xs text-destructive -mt-2">{quantityError}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Mærke / leverandør</label>
            <Input name="brand" defaultValue={seed?.brand ?? ''} placeholder="fx. Impecta" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Købt her (URL)</label>
            <Input name="purchase_url" type="url" defaultValue={seed?.purchase_url ?? ''} placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Købsår</label>
            <Input name="year_purchased" type="number" defaultValue={seed?.year_purchased ?? new Date().getFullYear()} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Udløbsdato</label>
            <Input name="expiry_date" defaultValue={initialExpiryDate} placeholder="DD.MM.ÅÅÅÅ" maxLength={10} />
            {dateError && <p className="text-xs text-destructive mt-1">{dateError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lokation</label>
            <Input name="location" defaultValue={seed?.location ?? ''} placeholder="fx. Skuffe 2" />
          </div>
        </div>

        {/* Performance */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Spireprocent (%)</label>
            <Input name="germination_rate" type="number" min="0" max="100" step="0.1" defaultValue={seed?.germination_rate ?? ''} placeholder="fx. 85" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <Input name="plant_type" defaultValue={seed?.plant_type ?? ''} placeholder="fx. F1, heirloom" />
          </div>
        </div>

        {/* Noter */}
        <div>
          <label className="block text-sm font-medium mb-1">Noter</label>
          <Textarea name="notes" rows={2} defaultValue={seed?.notes ?? ''} placeholder="Kvalitet, afvigelser, erfaringer..." />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <div>
            {seed && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                <Trash2 className="h-4 w-4 mr-1" /> Slet
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuller</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Gemmer...' : seed ? 'Opdater' : 'Tilføj'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
