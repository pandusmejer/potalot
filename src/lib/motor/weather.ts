/**
 * Vejr-service.
 *
 * Bruger Open-Meteo (gratis, ingen API-nøgle) som primær.
 * DMI kan indsættes som fallback hvis DMI_API_KEY er sat.
 */

export interface Forecast {
  coords: { latitude: number; longitude: number }
  now: {
    temperature_c: number
    precipitation_mm: number
    wind_ms: number
  }
  hourly: ForecastHour[]
  daily: ForecastDay[]
  fetched_at: string
}

export interface ForecastHour {
  time: string
  temperature_c: number
  precipitation_mm: number
  wind_ms: number
}

export interface ForecastDay {
  date: string
  min_temp_c: number
  max_temp_c: number
  precipitation_sum_mm: number
  max_wind_ms: number
}

const CACHE = new Map<string, { data: Forecast; expires: number }>()
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 timer (jf. spec)

export async function hentForecast(lat: number, lng: number): Promise<Forecast | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = CACHE.get(key)
  if (cached && cached.expires > Date.now()) return cached.data

  try {
    // Open-Meteo — gratis, ingen nøgle
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lng))
    url.searchParams.set('current', 'temperature_2m,precipitation,wind_speed_10m')
    url.searchParams.set('hourly', 'temperature_2m,precipitation,wind_speed_10m')
    url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max,precipitation_sum,wind_speed_10m_max')
    url.searchParams.set('timezone', 'Europe/Copenhagen')
    url.searchParams.set('forecast_days', '7')
    url.searchParams.set('wind_speed_unit', 'ms')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    const json = await res.json()

    const forecast: Forecast = {
      coords: { latitude: lat, longitude: lng },
      now: {
        temperature_c: json.current?.temperature_2m ?? 0,
        precipitation_mm: json.current?.precipitation ?? 0,
        wind_ms: json.current?.wind_speed_10m ?? 0,
      },
      hourly: (json.hourly?.time ?? []).slice(0, 48).map((t: string, i: number) => ({
        time: t,
        temperature_c: json.hourly.temperature_2m[i],
        precipitation_mm: json.hourly.precipitation[i],
        wind_ms: json.hourly.wind_speed_10m[i],
      })),
      daily: (json.daily?.time ?? []).map((d: string, i: number) => ({
        date: d,
        min_temp_c: json.daily.temperature_2m_min[i],
        max_temp_c: json.daily.temperature_2m_max[i],
        precipitation_sum_mm: json.daily.precipitation_sum[i],
        max_wind_ms: json.daily.wind_speed_10m_max[i],
      })),
      fetched_at: new Date().toISOString(),
    }

    CACHE.set(key, { data: forecast, expires: Date.now() + CACHE_TTL_MS })
    return forecast
  } catch {
    return null
  }
}

// ============================================
// Afledte vejr-signaler
// ============================================

export function kommerFrost(forecast: Forecast, tempThreshold = 2): { ja: boolean; hvornaar?: string } {
  // Frost inden for 48 timer?
  const frost = forecast.hourly.find(h => h.temperature_c <= tempThreshold)
  if (!frost) return { ja: false }
  return { ja: true, hvornaar: frost.time }
}

export function kommerKraftigRegn(forecast: Forecast, mmThreshold = 5): { ja: boolean; dato?: string; mm?: number } {
  const day = forecast.daily.find(d => d.precipitation_sum_mm >= mmThreshold)
  if (!day) return { ja: false }
  return { ja: true, dato: day.date, mm: day.precipitation_sum_mm }
}

export function kommerStorm(forecast: Forecast, msThreshold = 15): { ja: boolean; hvornaar?: string } {
  const storm = forecast.hourly.find(h => h.wind_ms >= msThreshold)
  if (!storm) return { ja: false }
  return { ja: true, hvornaar: storm.time }
}

export function kommerHede(forecast: Forecast, tempThreshold = 28): { ja: boolean; hvornaar?: string } {
  const hede = forecast.daily.find(d => d.max_temp_c >= tempThreshold)
  if (!hede) return { ja: false }
  return { ja: true, hvornaar: hede.date }
}

/**
 * Kumuleret regn de næste N dage.
 */
export function kumulertRegn(forecast: Forecast, dage: number): number {
  return forecast.daily.slice(0, dage).reduce((sum, d) => sum + d.precipitation_sum_mm, 0)
}

/**
 * Behøver plante vanding? (Ingen regn + varmt).
 */
export function behoeverVanding(forecast: Forecast, dageFremad = 3): boolean {
  const regn = kumulertRegn(forecast, dageFremad)
  const maxTemp = Math.max(...forecast.daily.slice(0, dageFremad).map(d => d.max_temp_c))
  // Tommelfingerregel: under 5mm regn + over 18°C = kandidat til vanding
  return regn < 5 && maxTemp > 18
}
