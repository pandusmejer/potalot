'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Check, Loader2, X } from 'lucide-react'
import { lookupPostnummer } from '@/actions/weather'
import { getProfile, updateProfile } from '@/actions/profil'

/**
 * "Havens placering" — sættes via dansk postnummer.
 *
 * Postnummer → koordinat via DAWA (officielt dansk adresse-API).
 * Vi gemmer kun postnummer-niveau koordinat, aldrig adresse.
 */
export function LocationSetting() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [current, setCurrent] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [postnr, setPostnr] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then(p => {
      setCurrent(p?.locationName ?? null)
      setLoaded(true)
    })
  }, [])

  function handleSave() {
    setError(null)
    const nr = postnr.trim()
    if (!/^\d{4}$/.test(nr)) {
      setError('Indtast et gyldigt dansk postnummer (4 cifre).')
      return
    }
    startTransition(async () => {
      const hit = await lookupPostnummer(nr)
      if (!hit) {
        setError(`Kunne ikke finde postnummer ${nr}. Tjek, om det er skrevet korrekt.`)
        return
      }
      const label = `${hit.postnr} ${hit.name}`
      const res = await updateProfile({
        latitude: hit.latitude,
        longitude: hit.longitude,
        locationName: label,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setCurrent(label)
      setPostnr('')
      router.refresh()
    })
  }

  function clearLocation() {
    setError(null)
    startTransition(async () => {
      const res = await updateProfile({
        latitude: null,
        longitude: null,
        locationName: null,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setCurrent(null)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Tilføj postnummer for lokale havevarsler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Så kan Potalot tilpasse vejr, frostvarsler og sæsonråd til
          lokale dyrkningsforhold.
        </p>
        <p className="text-xs text-muted-foreground italic">
          Vi skal ikke bruge din adresse. Vi interesserer os mere for dine
          tomater end dine persondata.
        </p>

        {loaded && current && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50/60 border border-green-200 px-3 py-2">
            <span className="text-sm text-green-900 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {current}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearLocation}
              disabled={pending}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Fjern
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={postnr}
            onChange={e => setPostnr(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            placeholder={current ? 'Skift postnummer…' : 'fx 8000'}
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleSave}
            disabled={pending || postnr.trim().length !== 4}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gem'}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
