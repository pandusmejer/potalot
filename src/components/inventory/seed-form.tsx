'use client'

import { createSeed, updateSeed, deleteSeed } from '@/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import type { Seed, PlantGuide } from '@/lib/types'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'

interface SeedFormProps {
  open: boolean
  onClose: () => void
  seed?: Seed | null
  guides: PlantGuide[]
}

export function SeedForm({ open, onClose, seed, guides }: SeedFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
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
    startTransition(async () => {
      await deleteSeed(seed.id)
      onClose()
    })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{seed ? 'Rediger frø' : 'Tilføj frø'}</DialogTitle>
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Navn *</label>
            <Input name="name" required defaultValue={seed?.name ?? ''} placeholder="fx. Tomat" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort</label>
            <Input name="variety" defaultValue={seed?.variety ?? ''} placeholder="fx. San Marzano" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Guide</label>
            <Select name="guide_id" defaultValue={seed?.guide_id ?? ''}>
              <option value="">Ingen</option>
              {guides.map((g) => (
                <option key={g.id} value={g.id}>{g.name_da}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mærke</label>
            <Input name="brand" defaultValue={seed?.brand ?? ''} placeholder="fx. Impecta" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Antal</label>
            <Input name="quantity" type="number" defaultValue={seed?.quantity ?? ''} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Købsår</label>
            <Input name="year_purchased" type="number" defaultValue={seed?.year_purchased ?? new Date().getFullYear()} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Udløb</label>
            <Input name="expiry_year" type="number" defaultValue={seed?.expiry_year ?? ''} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select name="status" defaultValue={seed?.status ?? 'in_stock'}>
            <option value="in_stock">På lager</option>
            <option value="sown">Sået</option>
            <option value="depleted">Opbrugt</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Noter</label>
          <Textarea name="notes" rows={2} defaultValue={seed?.notes ?? ''} placeholder="Evt. noter om frøet" />
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
