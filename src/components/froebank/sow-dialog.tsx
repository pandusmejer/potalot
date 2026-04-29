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
import { Sprout } from 'lucide-react'
import { saaFroeFraInventory } from '@/actions/mine-planter'
import { idag } from '@/lib/datetime'
import { GROWING_LOCATION_META } from '@/lib/constants'
import type { GrowingLocation } from '@/lib/types'

interface Props {
  inventoryItemId: string
  /** Foreslåede placeringer fra inventory item */
  suggestedLocations?: GrowingLocation[]
  children?: React.ReactNode
}

export function SowDialog({ inventoryItemId, suggestedLocations = [], children }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [date, setDate] = useState(idag())
  const [quantity, setQuantity] = useState('1')
  const [containerType, setContainerType] = useState('')
  const [location, setLocation] = useState(suggestedLocations[0] ? GROWING_LOCATION_META[suggestedLocations[0]].label : '')
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState<{ plantId: string; tasksCreated: number; merged: boolean } | null>(null)
  const [mergePrompt, setMergePrompt] = useState<{ existingPlantId: string } | null>(null)

  function submit(strategy?: 'merge' | 'new') {
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty < 1) {
      setError('Antal skal være et positivt tal')
      return
    }

    startTransition(async () => {
      const res = await saaFroeFraInventory({
        inventoryItemId,
        date,
        quantity: qty,
        containerType: containerType.trim() || undefined,
        location: location.trim() || undefined,
        note: note.trim() || undefined,
        mergeStrategy: strategy,
      })

      if ('error' in res) {
        setError(res.error)
        return
      }

      if ('needsMergeChoice' in res) {
        setMergePrompt({ existingPlantId: res.existingPlantId })
        return
      }

      setSuccess({ plantId: res.id, tasksCreated: res.tasksCreated, merged: res.mergedIntoExisting })
      setTimeout(() => {
        setOpen(false)
        router.push(`/mine-planter/${res.id}`)
      }, 1800)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    submit()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Sprout className="h-4 w-4" />
            Så et frø
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sprout className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-serif text-xl text-foreground">
                {success.merged ? 'Såning tilføjet' : 'Plante oprettet'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {success.merged
                  ? 'Føjet til din eksisterende dyrkning af samme sort.'
                  : `${success.tasksCreated} ${success.tasksCreated === 1 ? 'opgave er' : 'opgaver er'} lagt i kalenderen.`}
              </p>
            </div>
          </div>
        ) : mergePrompt ? (
          <div className="space-y-4 py-2">
            <DialogTitle>Eksisterende dyrkning fundet</DialogTitle>
            <DialogDescription>
              Du har allerede en aktiv dyrkning af denne sort i {parseInt(date.split('-')[0], 10)}.
              Vil du tilføje denne såning til samme dyrkning, eller oprette et nyt hold?
            </DialogDescription>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { setMergePrompt(null); submit('merge') }} disabled={pending}>
                Tilføj til eksisterende dyrkning
              </Button>
              <Button variant="outline" onClick={() => { setMergePrompt(null); submit('new') }} disabled={pending}>
                Opret nyt hold
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMergePrompt(null)} disabled={pending}>
                Annullér
              </Button>
            </div>
          </div>
        ) : (
          <>
        <DialogTitle>Så et frø</DialogTitle>
        <DialogDescription>
          Opretter en aktiv plante i Mine planter med en initial log-entry.
          Hvis der er en tilknyttet guide, oprettes også relevante opgaver i kalenderen.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dato</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Antal</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Sået i</Label>
            <select
              value={containerType}
              onChange={e => setContainerType(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="">Vælg…</option>
              <option value="Såbakke">Såbakke</option>
              <option value="Potte">Potte</option>
              <option value="Plugbox">Plugbox</option>
              <option value="Direkte friland">Direkte friland</option>
              <option value="Drivhus">Drivhus</option>
              <option value="Højbed">Højbed</option>
              <option value="Andet">Andet</option>
            </select>
          </div>

          <div>
            <Label>Placering</Label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Fx. Drivhus, Vindueskarm, Højbed 2"
              className="mt-1.5"
            />
            {suggestedLocations.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Foreslået:
                </span>
                {suggestedLocations.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(GROWING_LOCATION_META[loc].label)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors"
                  >
                    {GROWING_LOCATION_META[loc].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Note (valgfri)</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Fx. 'I forspiringsbakke med bundvarme'"
              rows={2}
              className="mt-1.5"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annullér
            </Button>
            <Button type="submit" disabled={pending}>
              <Sprout className="h-4 w-4" />
              {pending ? 'Sår…' : 'Så'}
            </Button>
          </DialogFooter>
        </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  )
}
