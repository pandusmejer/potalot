'use server'

import { getProfile } from '@/actions/profil'
import { codeMeta, tidsbucket, type WeatherIcon } from '@/lib/weather-codes'

export interface LocationHit {
  name: string
  latitude: number
  longitude: number
  /** Postnummer (4 cifre) */
  postnr: string
}

/**
 * Slå et dansk postnummer op via DAWA (Danmarks Adressers Web API —
 * officielt, gratis, ingen nøgle). Returnerer postnummerets visuelle
 * center som koordinat. Ingen adresse — kun postnummer-niveau.
 */
export async function lookupPostnummer(postnr: string): Promise<LocationHit | null> {
  const nr = postnr.trim()
  if (!/^\d{4}$/.test(nr)) return null
  try {
    const res = await fetch(
      `https://api.dataforsyningen.dk/postnumre/${nr}`,
      { next: { revalidate: 604800 } } // postnumre ændrer sig stort set aldrig — cache en uge
    )
    if (!res.ok) return null
    const data = await res.json()
    // visueltcenter er [lon, lat]
    const center: [number, number] | undefined = data.visueltcenter
    if (!center || center.length !== 2) return null
    return {
      name: data.navn ?? nr,
      postnr: data.nr ?? nr,
      longitude: center[0],
      latitude: center[1],
    }
  } catch {
    return null
  }
}

export interface GardenWeather {
  tempC: number
  label: string
  icon: WeatherIcon
  /** Kort dansk opsummering, fx "Let regn i aften" eller "Skyfrit hele dagen" */
  summary: string
  locationName: string
}

/**
 * Hent vejr for brugerens have-placering. Returnerer null hvis
 * lokation ikke er sat (chip skjules da bare).
 *
 * Cachet 30 min via Next fetch-cache for ikke at hamre Open-Meteo
 * ved hver sidehentning.
 */
export async function getGardenWeather(): Promise<GardenWeather | null> {
  const profile = await getProfile()
  if (!profile?.latitude || !profile?.longitude) return null

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(profile.latitude))
    url.searchParams.set('longitude', String(profile.longitude))
    url.searchParams.set('current', 'temperature_2m,weather_code')
    url.searchParams.set('hourly', 'weather_code,precipitation_probability')
    url.searchParams.set('timezone', 'Europe/Copenhagen')
    url.searchParams.set('forecast_days', '2')

    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return null
    const data = await res.json()

    const tempC = Math.round(data.current?.temperature_2m ?? 0)
    const currentCode = data.current?.weather_code ?? 0
    const meta = codeMeta(currentCode)

    // ---- Generér dansk opsummering ud fra timeprognose ----
    const hourlyTimes: string[] = data.hourly?.time ?? []
    const hourlyCodes: number[] = data.hourly?.weather_code ?? []
    const nowIso = data.current?.time as string | undefined
    let summary = `${meta.label}`

    if (nowIso && hourlyTimes.length > 0) {
      const nowIdx = hourlyTimes.findIndex(t => t >= nowIso)
      const startIdx = nowIdx === -1 ? 0 : nowIdx
      const currentHour = new Date(nowIso).getHours()

      // Kig 12 timer frem efter første markante VÅDE skift
      let foundWet: { hoursAhead: number; label: string } | null = null
      for (let i = startIdx; i < Math.min(startIdx + 12, hourlyCodes.length); i++) {
        const m = codeMeta(hourlyCodes[i])
        if (m.wet && !meta.wet) {
          foundWet = { hoursAhead: i - startIdx, label: m.label }
          break
        }
      }

      if (foundWet) {
        const naar = tidsbucket(foundWet.hoursAhead, currentHour)
        summary = `${foundWet.label} ${naar}`
      } else if (meta.wet) {
        // Allerede vådt nu — sig hvornår det letter, ellers bare label
        let clears: number | null = null
        for (let i = startIdx; i < Math.min(startIdx + 12, hourlyCodes.length); i++) {
          if (!codeMeta(hourlyCodes[i]).wet) { clears = i - startIdx; break }
        }
        summary = clears !== null && clears > 1
          ? `${meta.label} — letter ${tidsbucket(clears, currentHour)}`
          : meta.label
      } else {
        summary = `${meta.label} det meste af dagen`
      }
    }

    return {
      tempC,
      label: meta.label,
      icon: meta.icon,
      summary,
      locationName: profile.locationName ?? 'Din have',
    }
  } catch {
    return null
  }
}
