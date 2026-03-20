'use client'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { PRIMARY_CATEGORIES, DEFAULT_SUBCATEGORIES } from '@/lib/constants'
import { bulkUpdateSeeds } from '@/actions/inventory'
import { useState, useTransition } from 'react'

interface BulkEditDialogProps {
  open: boolean
  onClose: () => void
  selectedIds: string[]
  onSuccess: () => void
}

export function BulkEditDialog({ open, onClose, selectedIds, onSuccess }: BulkEditDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Which fields to apply
  const [applyStatus, setApplyStatus] = useState(false)
  const [applyCategory, setApplyCategory] = useState(false)
  const [applySubcategory, setApplySubcategory] = useState(false)
  const [applyBrand, setApplyBrand] = useState(false)

  // Field values
  const [status, setStatus] = useState('in_stock')
  const [category, setCategory] = useState('froe')
  const [subcategory, setSubcategory] = useState('')
  const [brand, setBrand] = useState('')

  function handleSubmit() {
    setError(null)

    const updates: Record<string, string> = {}
    if (applyStatus) updates.status = status
    if (applyCategory) updates.primary_category = category
    if (applySubcategory) updates.subcategory = subcategory || ''
    if (applyBrand) updates.brand = brand || ''

    if (Object.keys(updates).length === 0) {
      setError('Vælg mindst ét felt at opdatere')
      return
    }

    startTransition(async () => {
      const result = await bulkUpdateSeeds(selectedIds, updates)
      if (result?.error) {
        setError(result.error)
      } else {
        onSuccess()
        onClose()
      }
    })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Rediger {selectedIds.length} frø</DialogTitle>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Vælg hvilke felter der skal opdateres. Kun markerede felter ændres.
        </p>

        {/* Status */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={applyStatus}
            onChange={e => setApplyStatus(e.target.checked)}
            className="mt-2 accent-primary"
          />
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select value={status} onChange={e => setStatus(e.target.value)} disabled={!applyStatus}>
              <option value="in_stock">På lager</option>
              <option value="sown">Sået</option>
              <option value="depleted">Opbrugt</option>
            </Select>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={applyCategory}
            onChange={e => setApplyCategory(e.target.checked)}
            className="mt-2 accent-primary"
          />
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <Select value={category} onChange={e => setCategory(e.target.value)} disabled={!applyCategory}>
              {Object.entries(PRIMARY_CATEGORIES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Subcategory */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={applySubcategory}
            onChange={e => setApplySubcategory(e.target.checked)}
            className="mt-2 accent-primary"
          />
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Underkategori</label>
            <Select value={subcategory} onChange={e => setSubcategory(e.target.value)} disabled={!applySubcategory}>
              <option value="">Ingen</option>
              {DEFAULT_SUBCATEGORIES.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Brand */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={applyBrand}
            onChange={e => setApplyBrand(e.target.checked)}
            className="mt-2 accent-primary"
          />
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Mærke</label>
            <Input
              value={brand}
              onChange={e => setBrand(e.target.value)}
              disabled={!applyBrand}
              placeholder="fx. Impecta"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuller</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Opdaterer...' : `Opdater ${selectedIds.length} frø`}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
