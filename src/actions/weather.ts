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

// ============================================
// Natur-varsler: frost / tørke / skybrud / storm
// ============================================

export type AlertKind = 'frost' | 'toerke' | 'skybrud' | 'storm'

export interface GardenAlert {
  kind: AlertKind
  /** 'warning' = handl nu, 'info' = vær opmærksom */
  severity: 'warning' | 'info'
  /** lucide-ikon-navn */
  icon: 'Snowflake' | 'Sun' | 'CloudRain' | 'Wind'
  title: string
  detail: string
}

/** Dansk dag-label: 'i nat', 'i morgen', 'om 3 dage' osv. */
function dagLabel(daysAhead: number): string {
  if (daysAhead === 0) return 'i nat'
  if (daysAhead === 1) return 'i morgen'
  if (daysAhead === 2) return 'i overmorgen'
  return `om ${daysAhead} dage`
}

/**
 * Aktive natur-varsler for havens placering.
 *
 * - Frost:   min-temp ≤ 2 °C indenfor 3 dage (kritisk for sarte planter)
 * - Storm:   vindstød ≥ 17 m/s indenfor 2 dage (bind op, sikre krukker)
 * - Skybrud: ≥ 15 mm nedbør på én time indenfor 2 dage
 * - Tørke:   < 1 mm samlet nedbør de næste 6 dage (husk at vande)
 *
 * Returnerer tom liste hvis lokation ikke sat. Cachet 30 min.
 */
export async function getGardenAlerts(): Promise<GardenAlert[]> {
  const profile = await getProfile()
  if (!profile?.latitude || !profile?.longitude) return []

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(profile.latitude))
    url.searchParams.set('longitude', String(profile.longitude))
    url.searchParams.set('daily', 'temperature_2m_min,precipitation_sum,wind_gusts_10m_max')
    url.searchParams.set('hourly', 'precipitation')
    url.searchParams.set('wind_speed_unit', 'ms')
    url.searchParams.set('timezone', 'Europe/Copenhagen')
    url.searchParams.set('forecast_days', '7')

    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const data = await res.json()

    const minTemps: number[] = data.daily?.temperature_2m_min ?? []
    const precipSum: number[] = data.daily?.precipitation_sum ?? []
    const gustMax: number[] = data.daily?.wind_gusts_10m_max ?? []
    const hourlyPrecip: number[] = data.hourly?.precipitation ?? []

    const alerts: GardenAlert[] = []

    // ---- FROST: min ≤ 2°C indenfor de næste 3 dage ----
    for (let d = 0; d < Math.min(3, minTemps.length); d++) {
      if (minTemps[d] <= 2) {
        const t = Math.round(minTemps[d])
        alerts.push({
          kind: 'frost',
          severity: 'warning',
          icon: 'Snowflake',
          title: `Nattefrost ${dagLabel(d)}`,
          detail: `Ned til ${t}°. Dæk sarte planter (tomater, georginer, squash) eller tag dem ind.`,
        })
        break // ét frost-varsel er nok
      }
    }

    // ---- STORM: vindstød ≥ 17 m/s indenfor 2 dage ----
    for (let d = 0; d < Math.min(2, gustMax.length); d++) {
      if (gustMax[d] >= 17) {
        const ms = Math.round(gustMax[d])
        alerts.push({
          kind: 'storm',
          severity: 'warning',
          icon: 'Wind',
          title: `Hård vind ${dagLabel(d)}`,
          detail: `Vindstød op til ${ms} m/s. Bind høje planter op, sikre krukker og let drivhus-ventilation.`,
        })
        break
      }
    }

    // ---- SKYBRUD: ≥ 15 mm nedbør på én time indenfor 2 dage (48 timer) ----
    const maxHour = Math.min(48, hourlyPrecip.length)
    let skybrud = false
    for (let h = 0; h < maxHour; h++) {
      if (hourlyPrecip[h] >= 15) { skybrud = true; break }
    }
    if (skybrud) {
      alerts.push({
        kind: 'skybrud',
        severity: 'warning',
        icon: 'CloudRain',
        title: 'Skybrud på vej',
        detail: 'Kraftig regn forventet det næste døgn. Tjek dræn, flyt sarte potter i læ, og vent med at gøde (det skyller væk).',
      })
    }

    // ---- TØRKE: < 1 mm samlet de næste 6 dage ----
    const next6 = precipSum.slice(0, 6)
    if (next6.length >= 5) {
      const total = next6.reduce((s, v) => s + (v ?? 0), 0)
      if (total < 1) {
        alerts.push({
          kind: 'toerke',
          severity: 'info',
          icon: 'Sun',
          title: 'Tør periode forude',
          detail: 'Stort set ingen regn de næste 6 dage. Husk at vande grundigt — særligt krukker, nysåede bede og drivhus.',
        })
      }
    }

    return alerts
  } catch {
    return []
  }
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
