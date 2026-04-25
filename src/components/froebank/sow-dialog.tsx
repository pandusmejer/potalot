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
  const [location, setLocation] = useState(suggestedLocations[0] ? GROWING_LOCATION_META[suggestedLocations[0]].label : '')
  const [note, setNote] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

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
        location: location.trim() || undefined,
        note: note.trim() || undefined,
      })

      if ('error' in res) {
        setError(res.error)
        return
      }

      setOpen(false)
      router.push(`/mine-planter/${res.id}`)
    })
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
        <DialogTitle>Så et frø</DialogTitle>
        <DialogDescription>
          Opretter en aktiv plante i Mine planter med en initial log-entry.
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
      </DialogContent>
    </Dialog>
  )
}
