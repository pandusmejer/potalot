'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Gift } from 'lucide-react'
import { createSwapListing, type SwapKind } from '@/actions/seed-swap'
import { cn } from '@/lib/utils'

interface Props {
  groupId: string
}

export function CreateSwapListingDialog({ groupId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [kind, setKind] = useState<SwapKind>('offer')
  const [plantName, setPlantName] = useState('')
  const [variety, setVariety] = useState('')
  const [seedCount, setSeedCount] = useState('')
  const [description, setDescription] = useState('')
  const [canSend, setCanSend] = useState(true)
  const [localSwap, setLocalSwap] = useState(true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createSwapListing({
        groupId,
        kind,
        plantName: plantName.trim(),
        variety: variety.trim() || undefined,
        seedCount: seedCount ? parseInt(seedCount, 10) : undefined,
        description: description.trim() || undefined,
        canSend,
        localSwap,
      })
      if ('error' in res) { setError(res.error); return }
      setOpen(false)
      setPlantName(''); setVariety(''); setSeedCount(''); setDescription('')
      setKind('offer'); setCanSend(true); setLocalSwap(true)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Nyt opslag
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Nyt frøbytte-opslag</DialogTitle>
        <DialogDescription>
          Tilbyd dine egne frø eller efterlys hvad du leder efter.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-2 block">Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind('offer')}
                className={cn(
                  'rounded-xl border p-2.5 text-left transition',
                  kind === 'offer' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30',
                )}
              >
                <Gift className="h-4 w-4 text-primary mb-1" />
                <span className="font-medium text-foreground text-sm block">Tilbydes</span>
                <span className="text-[10px] text-muted-foreground">Jeg har frø til bytte</span>
              </button>
              <button
                type="button"
                onClick={() => setKind('wanted')}
                className={cn(
                  'rounded-xl border p-2.5 text-left transition',
                  kind === 'wanted' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30',
                )}
              >
                <Gift className="h-4 w-4 text-primary mb-1" />
                <span className="font-medium text-foreground text-sm block">Søges</span>
                <span className="text-[10px] text-muted-foreground">Jeg leder efter frø</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plantenavn *</Label>
              <Input value={plantName} onChange={e => setPlantName(e.target.value)} placeholder="Fx. Tomat" required className="mt-1.5" />
            </div>
            <div>
              <Label>Sort</Label>
              <Input value={variety} onChange={e => setVariety(e.target.value)} placeholder="Fx. San Marzano" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Antal frø (valgfrit)</Label>
            <Input
              type="number"
              value={seedCount}
              onChange={e => setSeedCount(e.target.value)}
              placeholder="Fx. 20"
              className="mt-1.5"
              min="1"
            />
          </div>

          <div>
            <Label>Beskrivelse</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder={kind === 'offer' ? 'Sortsbeskrivelse, høst-år, særlige egenskaber…' : 'Hvad leder du efter? Hvilke specifikke sorter?'}
              className="mt-1.5"
            />
          </div>

          {kind === 'offer' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={canSend} onChange={e => setCanSend(e.target.checked)} className="h-4 w-4" />
                Kan sendes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={localSwap} onChange={e => setLocalSwap(e.target.checked)} className="h-4 w-4" />
                Lokalt bytte
              </label>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending || !plantName.trim()}>
              {pending ? 'Opretter…' : 'Opret opslag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
