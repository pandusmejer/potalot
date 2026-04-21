'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  markerSpiret, pricleUd, plantUd, vand, goed, flyt, beskaer, hoest, afslut, tilfoejNote,
} from '@/actions/lifecycle'
import { HANDLING_LABEL, type HandlingType } from '@/lib/livscyklus/state-machine'
import { AARSAG_LABEL } from '@/lib/livscyklus/state-machine'
import type { AfsluttetAarsag, Placering } from '@/lib/types'

interface Props {
  plantId: string
  action: HandlingType | null
  open: boolean
  onClose: () => void
  placeringer: Placering[]
  currentPlaceringId?: string | null
}

export function ActionDialog({ plantId, action, open, onClose, placeringer, currentPlaceringId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Felter — bruges selektivt per action
  const [dato, setDato] = useState(new Date().toISOString().split('T')[0])
  const [antal, setAntal] = useState('1')
  const [placeringId, setPlaceringId] = useState(currentPlaceringId ?? placeringer[0]?.id ?? '')
  const [maengde, setMaengde] = useState('')
  const [enhed, setEnhed] = useState<'stk' | 'kg' | 'g'>('stk')
  const [noter, setNoter] = useState('')
  const [aarsag, setAarsag] = useState<AfsluttetAarsag>('faerdig')
  const [gemFroe, setGemFroe] = useState(false)

  if (!action) return null

  async function submit() {
    setError(null)
    startTransition(async () => {
      let result: { success?: boolean; error?: string } = {}

      switch (action) {
        case 'spiret':
          result = await markerSpiret(plantId, dato)
          break
        case 'prikle':
          result = await pricleUd(plantId, parseInt(antal) || 1, placeringId || undefined, dato)
          break
        case 'plant_ud':
          result = await plantUd(plantId, placeringId || undefined, dato)
          break
        case 'vand':
          result = await vand(plantId, dato)
          break
        case 'goed':
          result = await goed(plantId, dato)
          break
        case 'flyt':
          if (!placeringId) { setError('Vælg placering'); return }
          result = await flyt(plantId, placeringId, dato)
          break
        case 'beskaar':
          result = await beskaer(plantId, noter.trim() || undefined, dato)
          break
        case 'hoest':
          result = await hoest(plantId, maengde ? parseFloat(maengde) : undefined, enhed, dato)
          break
        case 'afslut':
          result = await afslut(plantId, aarsag, noter.trim() || undefined, gemFroe, dato)
          break
        case 'note':
          if (!noter.trim()) { setError('Skriv en note først'); return }
          result = await tilfoejNote(plantId, noter.trim())
          break
      }

      if (result.error) {
        setError(result.error)
        return
      }

      router.refresh()
      onClose()
    })
  }

  // Felter per action
  const showDato = action !== 'note'
  const showPlacering = ['prikle', 'plant_ud', 'flyt'].includes(action)
  const placeringRequired = action === 'flyt'
  const showAntal = action === 'prikle'
  const showMaengde = action === 'hoest'
  const showAarsag = action === 'afslut'
  const showGemFroe = action === 'afslut'
  const showNoter = ['beskaar', 'afslut', 'note'].includes(action)

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogTitle>{HANDLING_LABEL[action]}</DialogTitle>

      <div className="space-y-3">
        {showDato && (
          <div>
            <label className="block text-sm font-medium mb-1">Dato</label>
            <Input type="date" value={dato} onChange={e => setDato(e.target.value)} />
          </div>
        )}

        {showAntal && (
          <div>
            <label className="block text-sm font-medium mb-1">Antal</label>
            <Input type="number" min="1" value={antal} onChange={e => setAntal(e.target.value)} />
          </div>
        )}

        {showPlacering && placeringer.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">
              {placeringRequired ? 'Hvor flyttes den til?' : 'Ny placering (valgfri)'}
            </label>
            <Select value={placeringId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlaceringId(e.target.value)}>
              {!placeringRequired && <option value="">Behold nuværende</option>}
              {placeringer.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
        )}

        {showMaengde && (
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Mængde (valgfri)</label>
              <Input type="number" step="0.1" value={maengde} onChange={e => setMaengde(e.target.value)} placeholder="fx. 1.2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Enhed</label>
              <Select value={enhed} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEnhed(e.target.value as 'stk' | 'kg' | 'g')}>
                <option value="stk">stk</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
              </Select>
            </div>
          </div>
        )}

        {showAarsag && (
          <div>
            <label className="block text-sm font-medium mb-1">Årsag</label>
            <Select value={aarsag} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAarsag(e.target.value as AfsluttetAarsag)}>
              {Object.entries(AARSAG_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
        )}

        {showGemFroe && aarsag === 'gemt_til_froe' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={gemFroe}
              onChange={e => setGemFroe(e.target.checked)}
              className="rounded"
            />
            Opret en ny frøpose med lineage til denne plante
          </label>
        )}

        {showNoter && (
          <div>
            <label className="block text-sm font-medium mb-1">
              {action === 'note' ? 'Note *' : 'Noter (valgfri)'}
            </label>
            <Textarea
              rows={3}
              value={noter}
              onChange={e => setNoter(e.target.value)}
              placeholder={action === 'afslut' ? 'Hvad skete der?' : 'Kort bemærkning...'}
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuller</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? 'Gemmer…' : 'Gem'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
