/**
 * WMO weather code → dansk label + lucide-ikon.
 * Open-Meteo bruger WMO-koder (https://open-meteo.com/en/docs).
 */

export type WeatherIcon =
  | 'Sun' | 'CloudSun' | 'Cloud' | 'CloudFog'
  | 'CloudDrizzle' | 'CloudRain' | 'CloudSnow'
  | 'CloudLightning' | 'CloudHail'

interface CodeMeta {
  label: string
  icon: WeatherIcon
  /** Er det "vådt" vejr (regn/sne/torden)? Bruges til varsel-logik. */
  wet: boolean
}

export const WEATHER_CODES: Record<number, CodeMeta> = {
  0: { label: 'Skyfrit', icon: 'Sun', wet: false },
  1: { label: 'Overvejende klart', icon: 'CloudSun', wet: false },
  2: { label: 'Delvist skyet', icon: 'CloudSun', wet: false },
  3: { label: 'Overskyet', icon: 'Cloud', wet: false },
  45: { label: 'Tåge', icon: 'CloudFog', wet: false },
  48: { label: 'Rimtåge', icon: 'CloudFog', wet: false },
  51: { label: 'Let støvregn', icon: 'CloudDrizzle', wet: true },
  53: { label: 'Støvregn', icon: 'CloudDrizzle', wet: true },
  55: { label: 'Kraftig støvregn', icon: 'CloudDrizzle', wet: true },
  56: { label: 'Isslag', icon: 'CloudDrizzle', wet: true },
  57: { label: 'Kraftigt isslag', icon: 'CloudDrizzle', wet: true },
  61: { label: 'Let regn', icon: 'CloudRain', wet: true },
  63: { label: 'Regn', icon: 'CloudRain', wet: true },
  65: { label: 'Kraftig regn', icon: 'CloudRain', wet: true },
  66: { label: 'Isregn', icon: 'CloudRain', wet: true },
  67: { label: 'Kraftig isregn', icon: 'CloudRain', wet: true },
  71: { label: 'Let sne', icon: 'CloudSnow', wet: true },
  73: { label: 'Sne', icon: 'CloudSnow', wet: true },
  75: { label: 'Kraftig sne', icon: 'CloudSnow', wet: true },
  77: { label: 'Snekorn', icon: 'CloudSnow', wet: true },
  80: { label: 'Lette regnbyger', icon: 'CloudRain', wet: true },
  81: { label: 'Regnbyger', icon: 'CloudRain', wet: true },
  82: { label: 'Kraftige regnbyger', icon: 'CloudRain', wet: true },
  85: { label: 'Lette snebyger', icon: 'CloudSnow', wet: true },
  86: { label: 'Snebyger', icon: 'CloudSnow', wet: true },
  95: { label: 'Tordenvejr', icon: 'CloudLightning', wet: true },
  96: { label: 'Tordenvejr med hagl', icon: 'CloudHail', wet: true },
  99: { label: 'Kraftigt tordenvejr', icon: 'CloudHail', wet: true },
}

export function codeMeta(code: number): CodeMeta {
  return WEATHER_CODES[code] ?? { label: 'Ukendt vejr', icon: 'Cloud', wet: false }
}

/**
 * Dansk tids-bucket ud fra hvor mange timer frem en hændelse er.
 */
export function tidsbucket(hoursAhead: number, currentHour: number): string {
  const targetHour = (currentHour + hoursAhead) % 24
  const sameDay = currentHour + hoursAhead < 24
  if (hoursAhead <= 2) return 'snart'
  if (sameDay) {
    if (targetHour < 12) return 'i formiddag'
    if (targetHour < 18) return 'i eftermiddag'
    if (targetHour < 23) return 'i aften'
    return 'i nat'
  }
  if (targetHour < 6) return 'i nat'
  if (targetHour < 12) return 'i morgen tidlig'
  return 'i morgen'
}
