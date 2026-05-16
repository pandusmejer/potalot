'use server'

import { getProfile } from '@/actions/profil'
import { codeMeta, tidsbucket, type WeatherIcon } from '@/lib/weather-codes'

export interface LocationHit {
  name: string
  latitude: number
  longitude: number
  admin: string | null
}

/**
 * By-søgning via Open-Meteo geocoding (gratis, ingen nøgle).
 * Bruges i indstillinger til at sætte havens placering.
 */
export async function searchLocation(query: string): Promise<LocationHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
    url.searchParams.set('name', q)
    url.searchParams.set('count', '6')
    url.searchParams.set('language', 'da')
    // Prioritér Danmark men tillad andre lande
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const data = await res.json()
    type Result = {
      name: string
      latitude: number
      longitude: number
      admin1?: string
      country_code?: string
    }
    const results: Result[] = data.results ?? []
    // Sortér danske resultater først
    return results
      .sort((a, b) => {
        const aDk = a.country_code === 'DK' ? 0 : 1
        const bDk = b.country_code === 'DK' ? 0 : 1
        return aDk - bDk
      })
      .map(r => ({
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        admin: r.admin1 ?? null,
      }))
  } catch {
    return []
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
