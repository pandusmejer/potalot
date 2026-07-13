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
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { Sprout, Plus } from 'lucide-react'
import { opretEgenPlante } from '@/actions/mine-planter'
import { idag } from '@/lib/datetime'
import type { GardenLocation } from '@/lib/types'

interface Props {
  /** Brugerens eksisterende dyrkningssteder — til hurtig-valg. */
  gardenLocations: GardenLocation[]
  /** Custom trigger (default: en "Tilføj en plante du allerede har"-knap). */
  children?: React.ReactNode
}

type DatoMode = 'exact' | 'approx' | 'unknown'

/**
 * EgenPlanteDialog (V1A) — opret en plante brugeren ALLEREDE har i haven,
 * uden at gå gennem frøbanken. Fjerner launch-barrieren for midt-sæson-
 * brugere ("jeg har bare tomater i drivhuset").
 *
 * Kalder opretEgenPlante (source_inventory_id = null). Ingen frøbank-element,
 * ingen falske placeholder-poster. Startdato kan være præcis, cirka (måned)
 * eller ukendt — vi opfinder ikke en dato.
 */
export function EgenPlanteDialog({ gardenLocations, children }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [location, setLocation] = useState('')
  const [datoMode, setDatoMode] = useState<DatoMode>('approx')
  const [exactDate, setExactDate] = useState(idag())
  const [approxMonth, setApproxMonth] = useState(idag().slice(0, 7)) // YYYY-MM
  const [images, setImages] = useState<string[]>([])
  const [primary, setPrimary] = useState<string | null>(null)
  const [observation, setObservation] = useState('')

  function reset() {
    setName(''); setType(''); setSort(''); setQuantity('1'); setLocation('')
    setDatoMode('approx'); setExactDate(idag()); setApproxMonth(idag().slice(0, 7))
    setImages([]); setPrimary(null); setObservation(''); setError(null)
  }

  function sowDateFromMode(): string | null {
    if (datoMode === 'exact') return exactDate || null
    if (datoMode === 'approx') return approxMonth ? `${approxMonth}-01` : null
    return null
  }

  function submit() {
    setError(null)
    if (!name.trim()) { setError('Skriv mindst en art, fx "Tomat".'); return }
    startTransition(async () => {
      const res = await opretEgenPlante({
        name: name.trim(),
        // Sort vinder over type; begge tomme = ukendt sort (variety = null).
        variety: sort.trim() || type.trim() || null,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        location: location.trim() || undefined,
        sowDate: sowDateFromMode(),
        imageUrl: primary,
        observation: observation.trim() || undefined,
      })
      if ('error' in res) { setError(res.error); return }
      reset()
      setOpen(false)
      router.push(`/mine-planter/${res.id}`)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null) }}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Tilføj en plante du allerede har
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Sprout className="h-4 w-4 text-primary" /> En plante du allerede har
        </DialogTitle>
        <DialogDescription>
          Til det, der allerede står i haven. Du behøver ikke kende sorten eller
          den præcise dato — udfyld det, du ved.
        </DialogDescription>

        <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-3.5">
          <div>
            <Label>Hvad er det? <span className="text-muted-foreground font-normal">(art)</span></Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Fx. Tomat, Agurk, Dahlia"
              autoFocus
              required
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type <span className="text-muted-foreground font-normal">(valgfri)</span></Label>
              <Input value={type} onChange={e => setType(e.target.value)} placeholder="Fx. Cherrytomat" className="mt-1.5" />
            </div>
            <div>
              <Label>Sort <span className="text-muted-foreground font-normal">(valgfri)</span></Label>
              <Input value={sort} onChange={e => setSort(e.target.value)} placeholder="Fx. San Marzano" className="mt-1.5" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-1.5">
            Lad begge stå tomme, hvis du ikke kender sorten — det er helt fint.
          </p>

          <div>
            <Label>Antal planter</Label>
            <Input
              type="number" min="1" value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="mt-1.5 w-28"
            />
          </div>

          <div>
            <Label>Hvor står den? <span className="text-muted-foreground font-normal">(valgfri)</span></Label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Fx. Drivhus, Højbed 2, Krukke på terrassen"
              className="mt-1.5"
              list="egen-plante-locations"
            />
            {gardenLocations.length > 0 && (
              <>
                <datalist id="egen-plante-locations">
                  {gardenLocations.map(loc => <option key={loc.id} value={loc.name} />)}
                </datalist>
                <div className="flex gap-1 flex-wrap mt-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center">Dine steder:</span>
                  {gardenLocations.map(loc => (
                    <button
                      key={loc.id} type="button" onClick={() => setLocation(loc.name)}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors"
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <Label>Hvornår kom den i jorden?</Label>
            <div className="mt-1.5 flex gap-1.5">
              {([['approx', 'Cirka'], ['exact', 'Præcis dato'], ['unknown', 'Ved ikke']] as [DatoMode, string][]).map(([m, label]) => (
                <button
                  key={m} type="button" onClick={() => setDatoMode(m)}
                  className={`text-[12.5px] px-3 py-1.5 rounded-full border transition-colors ${
                    datoMode === m
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-input hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {datoMode === 'approx' && (
              <Input type="month" value={approxMonth} max={idag().slice(0, 7)}
                onChange={e => setApproxMonth(e.target.value)} className="mt-2" />
            )}
            {datoMode === 'exact' && (
              <Input type="date" value={exactDate} max={idag()}
                onChange={e => setExactDate(e.target.value)} className="mt-2" />
            )}
            {datoMode === 'unknown' && (
              <p className="text-[11px] text-muted-foreground mt-2">Vi opfinder ikke en dato — planten oprettes uden startdato.</p>
            )}
          </div>

          <div>
            <Label>Billede <span className="text-muted-foreground font-normal">(valgfri)</span></Label>
            <div className="mt-1.5">
              <MultiImageUpload
                value={images} primary={primary}
                onChange={(imgs, prim) => { setImages(imgs); setPrimary(prim) }}
                folder="planter" maxImages={1} label=""
              />
            </div>
          </div>

          <div>
            <Label>Kort observation <span className="text-muted-foreground font-normal">(valgfri)</span></Label>
            <Textarea
              value={observation} onChange={e => setObservation(e.target.value)}
              placeholder="Fx. 'Ser sund ud, første blomster'"
              rows={2} className="mt-1.5"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Annullér</Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? 'Opretter…' : 'Tilføj plante'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
