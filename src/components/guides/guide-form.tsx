'use client'

import { createGuideManual, updateGuideManual } from '@/actions/guides'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { GUIDE_CATEGORIES } from '@/lib/constants'
import type { PlantGuide } from '@/lib/types'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface GuideFormProps {
  open: boolean
  onClose: () => void
  guide?: PlantGuide | null
}

export function GuideForm({ open, onClose, guide }: GuideFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = guide
        ? await updateGuideManual(guide.id, formData)
        : await createGuideManual(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
        if (!guide && 'slug' in result && result.slug) {
          router.push(`/guides/${result.slug}`)
        }
      }
    })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{guide ? 'Rediger guide' : 'Ny dyrkningsguide'}</DialogTitle>
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Dansk navn *</label>
            <Input name="name_da" required defaultValue={guide?.name_da ?? ''} placeholder="fx. Tomat" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Engelsk navn</label>
            <Input name="name_en" defaultValue={guide?.name_en ?? ''} placeholder="fx. Tomato" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Botanisk navn</label>
            <Input name="botanical_name" defaultValue={guide?.botanical_name ?? ''} placeholder="fx. Solanum lycopersicum" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <Select name="category" defaultValue={guide?.category ?? 'vegetable'}>
              {Object.entries(GUIDE_CATEGORIES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Intro / beskrivelse</label>
          <Textarea
            name="description"
            rows={3}
            defaultValue={guide?.description ?? ''}
            placeholder="Kort intro om planten – skrivestil: konkret, levende, praktisk"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuller</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Gemmer...' : guide ? 'Opdater' : 'Opret guide'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
