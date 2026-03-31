'use client'

import { createPlant, updatePlant, deletePlant, linkGuideToPlant } from '@/actions/inventory'
import { createGuideFromAI } from '@/actions/guides'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { PLANT_STATUSES } from '@/lib/constants'
import type { Plant, PlantGuide, Seed } from '@/lib/types'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'

interface PlantFormProps {
  open: boolean
  onClose: () => void
  plant?: Plant | null
  guides: PlantGuide[]
  seeds: Seed[]
}

export function PlantForm({ open, onClose, plant, guides, seeds }: PlantFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [plantName, setPlantName] = useState<string>(plant?.name ?? '')
  const [selectedGuideId, setSelectedGuideId] = useState<string>(plant?.guide_id ?? '')

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = plant
        ? await updatePlant(plant.id, formData)
        : await createPlant(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        // Auto-generate guide for new plants without a guide
        if (!plant && !formData.get('guide_id') && plantName.trim()) {
          const plantId = 'plantId' in result ? (result as { plantId: string }).plantId : null
          autoGenerateGuide(plantName.trim(), plantId)
        }
        onClose()
      }
    })
  }

  // Fire-and-forget: generate guide in background, then link to plant
  function autoGenerateGuide(name: string, plantId: string | null) {
    fetch('/api/ai/generate-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category: 'vegetable' }),
    })
      .then(res => res.json())
      .then(async aiData => {
        if (!aiData.error) {
          const result = await createGuideFromAI(name, 'vegetable', aiData)
          // Link the new guide to the plant
          if (result.guideId && plantId) {
            await linkGuideToPlant(plantId, result.guideId)
          }
        }
      })
      .catch(() => { /* silent fail — guide generation is best-effort */ })
  }

  function handleDelete() {
    if (!plant) return
    startTransition(async () => {
      await deletePlant(plant.id)
      onClose()
    })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{plant ? 'Rediger plante' : 'Tilføj plante'}</DialogTitle>
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Navn *</label>
            <Input name="name" required defaultValue={plant?.name ?? ''} placeholder="fx. Tomat" onChange={e => setPlantName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort</label>
            <Input name="variety" defaultValue={plant?.variety ?? ''} placeholder="fx. San Marzano" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Guide</label>
            <Select
              name="guide_id"
              value={selectedGuideId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedGuideId(e.target.value)}
            >
              <option value="">Oprettes automatisk</option>
              {guides.map((g) => (
                <option key={g.id} value={g.id}>{g.name_da}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fra frø</label>
            <Select name="seed_id" defaultValue={plant?.seed_id ?? ''}>
              <option value="">Intet frø</option>
              {seeds.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.variety ? ` — ${s.variety}` : ''}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select name="status" defaultValue={plant?.status ?? 'planned'}>
              {Object.entries(PLANT_STATUSES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Placering</label>
            <Input name="location" defaultValue={plant?.location ?? ''} placeholder="fx. Drivhus" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Sådato</label>
            <Input name="sow_date" type="date" defaultValue={plant?.sow_date ?? ''} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Antal</label>
            <Input name="quantity" type="number" defaultValue={plant?.quantity ?? 1} min={1} />
          </div>
        </div>

        {plant && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Spiringsdato</label>
              <Input name="germination_date" type="date" defaultValue={plant?.germination_date ?? ''} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priklingsdato</label>
              <Input name="prick_date" type="date" defaultValue={plant?.prick_date ?? ''} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Noter</label>
          <Textarea name="notes" rows={2} defaultValue={plant?.notes ?? ''} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <div>
            {plant && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                <Trash2 className="h-4 w-4 mr-1" /> Slet
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuller</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Gemmer...' : plant ? 'Opdater' : 'Tilføj'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
