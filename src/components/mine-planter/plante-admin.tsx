'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Archive, Trash2, ChevronDown, Loader2 } from 'lucide-react'
import { updatePlant, deletePlant, archivePlant } from '@/actions/mine-planter'

interface Props {
  plantId: string
  name: string
  variety: string | null
  location: string | null
  isArchived: boolean
}

/**
 * ADMINISTRER PLANTE — stille bund-utility. Rediger (navn/sort/sted), Arkivér
 * (flyt til sæsonarkiv) og Slet helt (permanent, rydder log + opgaver). Anna
 * 15/7: plante-siden er ikke længere kun læse — en fejl skal kunne rettes eller
 * fjernes. Arkivér forbliver den bløde "væk fra hverdagen", Slet er den hårde.
 */
export function PlanteAdmin({ plantId, name, variety, location, isArchived }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [fName, setFName] = useState(name)
  const [fVariety, setFVariety] = useState(variety ?? '')
  const [fLocation, setFLocation] = useState(location ?? '')

  const [deleteOpen, setDeleteOpen] = useState(false)

  function gemRedigering() {
    setError(null)
    if (!fName.trim()) { setError('Angiv mindst en art.'); return }
    startTransition(async () => {
      const res = await updatePlant(plantId, { name: fName, variety: fVariety, location: fLocation })
      if ('error' in res) { setError(res.error); return }
      setEditOpen(false)
      router.refresh()
    })
  }

  function arkiver() {
    setError(null)
    startTransition(async () => {
      const res = await archivePlant(plantId)
      if ('error' in res) { setError(res.error); return }
      router.refresh()
    })
  }

  function slet() {
    setError(null)
    startTransition(async () => {
      const res = await deletePlant(plantId)
      if ('error' in res) { setError(res.error); return }
      router.push('/mine-planter')
      router.refresh()
    })
  }

  return (
    <details className="group mt-3 border-t pt-4" style={{ borderColor: 'rgba(36,48,31,0.10)' }}>
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 uppercase [&::-webkit-details-marker]:hidden"
        style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.42)' }}
      >
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        Planteindstillinger
      </summary>

      <div className="mt-2 flex flex-col items-start gap-0.5">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => { setError(null); setEditOpen(true) }}>
          <Pencil className="h-4 w-4" /> Rediger plante
        </Button>
        {!isArchived && (
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={arkiver} disabled={pending}>
            <Archive className="h-4 w-4" /> Arkivér plante
          </Button>
        )}
        <Button variant="ghost" size="sm" className="-ml-2 text-destructive hover:text-destructive" onClick={() => { setError(null); setDeleteOpen(true) }}>
          <Trash2 className="h-4 w-4" /> Slet plante
        </Button>
      </div>

      {/* Rediger */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogTitle>Rediger plante</DialogTitle>
          <DialogDescription>Ret navn, sort eller sted. Status og log ændres andre steder.</DialogDescription>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pa-name">Art</Label>
              <Input id="pa-name" value={fName} onChange={e => setFName(e.target.value)} placeholder="Fx Tomat" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pa-variety">Sort (valgfri)</Label>
              <Input id="pa-variety" value={fVariety} onChange={e => setFVariety(e.target.value)} placeholder="Fx San Marzano" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pa-location">Sted (valgfri)</Label>
              <Input id="pa-location" value={fLocation} onChange={e => setFLocation(e.target.value)} placeholder="Fx Drivhus, Højbed 2" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={pending}>Annullér</Button>
            <Button onClick={gemRedigering} disabled={pending || !fName.trim()}>
              {pending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Gemmer…</> : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slet */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogTitle>Slet {name}?</DialogTitle>
          <DialogDescription>
            Planten og dens log slettes permanent — det kan ikke fortrydes. Vil du
            bare have den væk fra dine aktive planter, så brug Arkivér i stedet.
          </DialogDescription>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={pending}>Annullér</Button>
            <Button variant="destructive" onClick={slet} disabled={pending}>
              {pending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sletter…</> : 'Slet permanent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </details>
  )
}
