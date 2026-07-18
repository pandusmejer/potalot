'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Plus, Sprout, Leaf, Flower2, Search, ArrowLeft, Package, ArrowRight,
} from 'lucide-react'
import { saaFroeFraInventory } from '@/actions/mine-planter'
import { getGardenLocations } from '@/actions/garden-locations'
import { idag, formatDatoKort } from '@/lib/datetime'
import { GROWING_LOCATION_META, PRIMARY_CATEGORIES } from '@/lib/constants'
import type { InventoryItem, GrowingLocation, GardenLocation } from '@/lib/types'

interface Props {
  inventory: InventoryItem[]
  /** Custom trigger button (default: 'Tilføj plante'). */
  children?: React.ReactNode
}

type Step = 'pick' | 'form' | 'mergePrompt' | 'success'

/**
 * NewPlantDialog — integreret flow til at oprette en plante uden at
 * navigere væk fra /mine-planter.
 *
 * Erstatter den tidligere omvej: 'Tilføj plante' → /froebank → klik et
 * frø → SowDialog. Nu er det én dialog med valg af frø + sowing-form
 * i samme oplevelse.
 *
 * Genbruger saaFroeFraInventory-action og merge-prompt-logikken fra
 * SowDialog.
 */
export function NewPlantDialog({ inventory, children }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('pick')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Valgt frø fra frøbanken
  const [selected, setSelected] = useState<InventoryItem | null>(null)

  // Sowing-form state
  const [date, setDate] = useState(idag())
  const [quantity, setQuantity] = useState('1')
  const [containerType, setContainerType] = useState('')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')

  // Søgning i frø-listen
  const [search, setSearch] = useState('')

  // Brugerens eksisterende dyrkningssteder — så placering kan VÆLGES, ikke
  // kun skrives (persistens-sprint, sti b). Tom i demo (anonym → []).
  const [savedLocations, setSavedLocations] = useState<GardenLocation[]>([])
  useEffect(() => {
    if (!open) return
    getGardenLocations().then(setSavedLocations).catch(() => {})
  }, [open])

  // Resultat-state
  const [success, setSuccess] = useState<{ plantId: string; tasksCreated: number; merged: boolean } | null>(null)

  function reset() {
    setStep('pick')
    setSelected(null)
    setSearch('')
    setDate(idag())
    setQuantity('1')
    setContainerType('')
    setLocation('')
    setNote('')
    setError(null)
    setSuccess(null)
  }

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) reset()
  }

  function pickItem(item: InventoryItem) {
    setSelected(item)
    // Forudfyld placering fra item's growing_locations hvis tilgængeligt
    const firstLoc: GrowingLocation | undefined = item.growingLocations?.[0]
    setLocation(firstLoc ? GROWING_LOCATION_META[firstLoc].label : '')
    setStep('form')
  }

  function submitSowing(strategy?: 'merge' | 'new') {
    if (!selected) return
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty < 1) {
      setError('Antal skal være et positivt tal')
      return
    }
    setError(null)

    startTransition(async () => {
      const res = await saaFroeFraInventory({
        inventoryItemId: selected.id,
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
        setStep('mergePrompt')
        return
      }

      setSuccess({
        plantId: res.id,
        tasksCreated: res.tasksCreated,
        merged: res.mergedIntoExisting,
      })
      setStep('success')
      setTimeout(() => {
        setOpen(false)
        router.push(`/mine-planter/${res.id}`)
      }, 1800)
    })
  }

  // Filtrerede frø — søg i navn, sort, latinsk
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return inventory
    return inventory.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.variety?.toLowerCase().includes(q) ||
      i.latinName?.toLowerCase().includes(q)
    )
  }, [inventory, search])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Plus className="h-4 w-4" />
            Tilføj plante
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {step === 'pick' && (
          <>
            <DialogTitle>Vælg fra frøbanken</DialogTitle>
            <DialogDescription>
              Hvilken sort vil du sætte i gang? Vælg et frø, en knold eller
              andet fra dit lager.
            </DialogDescription>

            {inventory.length === 0 ? (
              <EmptyState
                icon={<Package className="h-8 w-8" />}
                title="Din frøbank er tom"
                description="Tilføj først noget til frøbanken."
                action={
                  <Button asChild>
                    <Link href="/froebank/tilfoej">
                      <Plus className="h-4 w-4" />
                      Til frøbank
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Søg navn, sort, latinsk…"
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1">
                  {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-3">
                      Intet matcher.
                    </p>
                  ) : (
                    filtered.map(item => {
                      const cat = PRIMARY_CATEGORIES[item.primaryCategoryId]
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => pickItem(item)}
                          className="w-full text-left p-2.5 rounded-lg border border-border hover:bg-accent/40 hover:border-primary/40 transition-colors flex items-center gap-3"
                        >
                          <Sprout className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.name}
                              {item.variety && (
                                <span className="text-muted-foreground"> — {item.variety}</span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {cat?.name ?? item.primaryCategoryId}
                            </p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Annullér
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'form' && selected && (
          <>
            <DialogTitle className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-primary" />
              Så {selected.name}{selected.variety ? ` — ${selected.variety}` : ''}
            </DialogTitle>
            <DialogDescription>
              Opretter en plante i Mine planter og kobler den til denne frøpost.
              Vælg den faktiske sådato — også en tidligere — så kalender og
              Havebog regner fra den. Har frøet en guide, lægges kommende
              gøremål i kalenderen.
            </DialogDescription>

            <form onSubmit={(e) => { e.preventDefault(); submitSowing() }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Dato</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    max={idag()}
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
                  list="garden-locations-dl"
                />
                {/* Eksisterende dyrkningssteder — tap for at vælge (vælg
                    eksisterende eller skriv et nyt, som så oprettes ved såning). */}
                {savedLocations.length > 0 && (
                  <datalist id="garden-locations-dl">
                    {savedLocations.map(loc => (
                      <option key={loc.id} value={loc.name} />
                    ))}
                  </datalist>
                )}
                {savedLocations.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Dine steder:
                    </span>
                    {savedLocations.map(loc => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => setLocation(loc.name)}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors"
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                )}
                {selected.growingLocations.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Foreslået:
                    </span>
                    {selected.growingLocations.map(loc => (
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
                <Button type="button" variant="ghost" onClick={() => { setStep('pick'); setSelected(null) }}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Tilbage
                </Button>
                <Button type="submit" disabled={pending}>
                  <Sprout className="h-4 w-4" />
                  {pending ? 'Sår…' : 'Så'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {step === 'mergePrompt' && (
          <div className="space-y-4 py-2">
            <DialogTitle>Eksisterende dyrkning fundet</DialogTitle>
            <DialogDescription>
              Du har allerede en aktiv dyrkning af denne sort i {parseInt(date.split('-')[0], 10)}.
              Vil du tilføje denne såning til samme dyrkning, eller oprette et nyt hold?
            </DialogDescription>
            <div className="flex flex-col gap-2">
              <Button onClick={() => submitSowing('merge')} disabled={pending}>
                Tilføj til eksisterende dyrkning
              </Button>
              <Button variant="outline" onClick={() => submitSowing('new')} disabled={pending}>
                Opret nyt hold
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep('form')} disabled={pending}>
                Annullér
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && success && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="relative h-20 w-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 sprout-ring" />
              <div className="relative h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center sprout-celebrate">
                <Sprout className="h-7 w-7 text-primary" />
              </div>
              <Leaf
                className="absolute h-4 w-4 text-green-600 sprout-confetti"
                style={{ ['--end-transform' as string]: 'translate(-60px, -70px) rotate(-45deg)' }}
              />
              <Leaf
                className="absolute h-3 w-3 text-emerald-700 sprout-confetti"
                style={{ ['--end-transform' as string]: 'translate(70px, -50px) rotate(60deg)', animationDelay: '0.1s' }}
              />
              <Sprout
                className="absolute h-3 w-3 text-lime-600 sprout-confetti"
                style={{ ['--end-transform' as string]: 'translate(-50px, 40px) rotate(-30deg)', animationDelay: '0.15s' }}
              />
              <Flower2
                className="absolute h-3.5 w-3.5 text-rose-400 sprout-confetti"
                style={{ ['--end-transform' as string]: 'translate(55px, 50px) rotate(90deg)', animationDelay: '0.05s' }}
              />
              <Leaf
                className="absolute h-3 w-3 text-green-700 sprout-confetti"
                style={{ ['--end-transform' as string]: 'translate(0, -80px) rotate(180deg)', animationDelay: '0.2s' }}
              />
            </div>
            <div>
              <p className="font-serif text-2xl text-foreground">
                {success.merged ? 'Såning tilføjet' : `${selected?.variety ?? selected?.name ?? 'Planten'} er i Mine planter`}
              </p>
              {/* Ærlig kvittering — kun handlinger der faktisk skete. */}
              <div className="text-sm text-muted-foreground mt-1.5 space-y-0.5">
                {success.merged ? (
                  <p>Føjet til din eksisterende dyrkning af samme sort.</p>
                ) : (
                  <>
                    <p>Sået {formatDatoKort(date)} · koblet til din frøpost.</p>
                    <p>
                      {success.tasksCreated > 0
                        ? `${success.tasksCreated} gøremål lagt i kalenderen.`
                        : 'Kalenderen regner fra sådatoen.'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
