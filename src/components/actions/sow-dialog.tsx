'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Sprout, Check } from 'lucide-react'
import { saaFroe } from '@/actions/lifecycle'
import { CreateGroupPrompt } from '@/components/community/create-group-prompt'
import type { Seed, Variety, Placering } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  seeds: Seed[]
  varieties: Variety[]
  placeringer: Placering[]
  preSelectedSeedId?: string
  preSelectedVarietyId?: string
}

export function SowDialog({
  open,
  onClose,
  seeds,
  varieties,
  placeringer,
  preSelectedSeedId,
  preSelectedVarietyId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [communityPrompt, setCommunityPrompt] = useState<{
    speciesName: string
    varietyName: string | null
    hasProfile: boolean
  } | null>(null)

  // Mode: pick from frøbank (seed) eller bare sort-reference (variety)
  const [mode, setMode] = useState<'seed' | 'variety' | 'new'>(preSelectedSeedId ? 'seed' : preSelectedVarietyId ? 'variety' : 'seed')
  const [seedId, setSeedId] = useState(preSelectedSeedId ?? '')
  const [varietyId, setVarietyId] = useState(preSelectedVarietyId ?? '')
  const [newSpecies, setNewSpecies] = useState('')
  const [newVariety, setNewVariety] = useState('')

  const [antal, setAntal] = useState('1')
  const [placeringId, setPlaceringId] = useState(placeringer[0]?.id ?? '')
  const [dato, setDato] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const antalNum = parseInt(antal, 10)
    if (isNaN(antalNum) || antalNum < 1) {
      setError('Antal skal være mindst 1')
      return
    }

    startTransition(async () => {
      let result

      if (mode === 'seed' && seedId) {
        const seed = seeds.find(s => s.id === seedId)
        if (!seed) { setError('Frøpose ikke fundet'); return }
        result = await saaFroe({
          seedId: seed.id,
          varietyId: seed.variety_id,
          speciesName: seed.name,
          varietyName: seed.variety,
          botanicalName: seed.botanical_name,
          guideId: seed.guide_id,
          antal: antalNum,
          placeringId: placeringId || null,
          dato,
          notes: notes.trim() || undefined,
        })
      } else if (mode === 'variety' && varietyId) {
        result = await saaFroe({
          varietyId,
          antal: antalNum,
          placeringId: placeringId || null,
          dato,
          notes: notes.trim() || undefined,
        })
      } else if (mode === 'new' && newSpecies.trim()) {
        result = await saaFroe({
          speciesName: newSpecies.trim(),
          varietyName: newVariety.trim() || null,
          antal: antalNum,
          placeringId: placeringId || null,
          dato,
          notes: notes.trim() || undefined,
        })
      } else {
        setError('Vælg et frø, en sort, eller skriv et nyt navn')
        return
      }

      if ('error' in result) {
        setError(result.error)
        return
      }

      setDone(true)
      router.refresh()

      // Vis community-prompt efter bekræftelse (hvis relevant)
      setTimeout(() => {
        if (result.communityPrompt) {
          setDone(false)
          setCommunityPrompt(result.communityPrompt)
        } else {
          setDone(false)
          onClose()
        }
      }, 1000)
    })
  }

  if (communityPrompt) {
    return (
      <CreateGroupPrompt
        open={true}
        onClose={() => {
          setCommunityPrompt(null)
          onClose()
        }}
        speciesName={communityPrompt.speciesName}
        varietyName={communityPrompt.varietyName}
        hasProfile={communityPrompt.hasProfile}
      />
    )
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      {done ? (
        <div className="py-8 text-center">
          <div className="inline-flex h-12 w-12 rounded-full bg-primary/10 items-center justify-center mb-3">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-serif text-xl text-foreground">Sået.</h2>
          <p className="text-sm text-muted-foreground mt-1">Jeg har lagt de næste opgaver i kalenderen.</p>
        </div>
      ) : (
        <>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              Så et frø
            </span>
          </DialogTitle>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode-vælger */}
            <div className="flex gap-1.5 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setMode('seed')}
                className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${mode === 'seed' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                Fra frøbank
              </button>
              <button
                type="button"
                onClick={() => setMode('variety')}
                className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${mode === 'variety' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                Kendt sort
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${mode === 'new' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                Ny
              </button>
            </div>

            {mode === 'seed' && (
              <div>
                <label className="block text-sm font-medium mb-1">Frø</label>
                {seeds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Frøbanken er tom. Skift til &apos;Ny&apos; fane.</p>
                ) : (
                  <Select value={seedId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeedId(e.target.value)} required>
                    <option value="">Vælg en frøpose</option>
                    {seeds.filter(s => s.status !== 'depleted' && s.status !== 'expired').map(s => {
                      const rest = s.seeds_total != null ? ` — ${(s.seeds_total ?? 0) - (s.seeds_sown ?? 0)} tilbage` : ''
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name}{s.variety ? ` — ${s.variety}` : ''}{rest}
                        </option>
                      )
                    })}
                  </Select>
                )}
              </div>
            )}

            {mode === 'variety' && (
              <div>
                <label className="block text-sm font-medium mb-1">Sort</label>
                {varieties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen sorter endnu. Skift til &apos;Ny&apos; fane.</p>
                ) : (
                  <Select value={varietyId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVarietyId(e.target.value)} required>
                    <option value="">Vælg en sort</option>
                    {varieties.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.species_name}{v.variety_name ? ` — ${v.variety_name}` : ''}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            )}

            {mode === 'new' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Navn *</label>
                  <Input
                    value={newSpecies}
                    onChange={e => setNewSpecies(e.target.value)}
                    placeholder="fx. Tomat"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sort (valgfrit)</label>
                  <Input
                    value={newVariety}
                    onChange={e => setNewVariety(e.target.value)}
                    placeholder="fx. San Marzano"
                  />
                </div>
              </div>
            )}

            {/* Antal + Dato */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Antal</label>
                <Input
                  type="number"
                  min="1"
                  value={antal}
                  onChange={e => setAntal(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dato</label>
                <Input
                  type="date"
                  value={dato}
                  onChange={e => setDato(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Placering */}
            <div>
              <label className="block text-sm font-medium mb-1">Hvor?</label>
              {placeringer.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Ingen placeringer endnu. Tilføj en i indstillingerne.
                </p>
              ) : (
                <Select value={placeringId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlaceringId(e.target.value)}>
                  <option value="">Ingen placering</option>
                  {placeringer.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              )}
            </div>

            {/* Noter */}
            <div>
              <label className="block text-sm font-medium mb-1">Note (valgfrit)</label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="fx. prøve med ny jordblanding"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>Annuller</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Sår…' : 'Så'}
              </Button>
            </div>
          </form>
        </>
      )}
    </Dialog>
  )
}
