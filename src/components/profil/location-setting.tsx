'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Check, Loader2, X } from 'lucide-react'
import { searchLocation, type LocationHit } from '@/actions/weather'
import { getProfile, updateProfile } from '@/actions/profil'

/**
 * "Havens placering" — sættes i indstillinger.
 *
 * By-søgning via Open-Meteo geocoding. Når valgt gemmes lat/lon +
 * navn på profilen, og vejr-chippen i topbaren begynder at virke.
 */
export function LocationSetting() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [current, setCurrent] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationHit[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hent nuværende placering ved mount
  useEffect(() => {
    getProfile().then(p => {
      setCurrent(p?.locationName ?? null)
      setLoaded(true)
    })
  }, [])

  // Debounced søgning
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const id = setTimeout(async () => {
      const hits = await searchLocation(query)
      setResults(hits)
      setSearching(false)
    }, 350)
    return () => clearTimeout(id)
  }, [query])

  function pick(hit: LocationHit) {
    setError(null)
    startTransition(async () => {
      const res = await updateProfile({
        latitude: hit.latitude,
        longitude: hit.longitude,
        locationName: hit.admin ? `${hit.name}, ${hit.admin}` : hit.name,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setCurrent(hit.admin ? `${hit.name}, ${hit.admin}` : hit.name)
      setQuery('')
      setResults([])
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
          Havens placering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Bruges til vejr i toppen — og senere frostvarsel og jordtemp.
          Søg din by, ikke en præcis adresse.
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={current ? 'Skift by…' : 'Søg din by (fx Aarhus, Vejle)…'}
            className="pl-9"
          />
          {(searching || pending) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {results.length > 0 && (
          <div className="rounded-lg border border-border bg-card divide-y divide-border max-h-56 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={`${r.name}-${r.latitude}-${i}`}
                type="button"
                onClick={() => pick(r)}
                disabled={pending}
                className="w-full text-left px-3 py-2 hover:bg-accent/40 transition-colors flex items-center gap-2"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">
                  {r.name}
                  {r.admin && <span className="text-muted-foreground"> · {r.admin}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {query.trim().length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Ingen byer matcher.</p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
