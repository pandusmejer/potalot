import Link from 'next/link'
import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain,
  CloudSnow, CloudLightning, CloudHail,
} from 'lucide-react'
import type { GardenWeather } from '@/actions/weather'
import type { WeatherIcon } from '@/lib/weather-codes'
import type { ComponentType, SVGProps } from 'react'

const ICON_MAP: Record<WeatherIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain,
  CloudSnow, CloudLightning, CloudHail,
}

/**
 * Lille vejr-chip til topbaren. Vises kun hvis lokation er sat
 * (weather != null). Linker til indstillinger så man kan rette
 * placeringen.
 */
export function WeatherChip({ weather }: { weather: GardenWeather | null }) {
  if (!weather) return null
  const Icon = ICON_MAP[weather.icon] ?? Cloud

  return (
    <Link
      href="/indstillinger"
      title={`${weather.locationName} · ${weather.label}`}
      className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 hover:bg-accent/40 transition-colors"
    >
      <span className="text-sm font-medium text-foreground tabular-nums">
        {weather.tempC}°
      </span>
      <Icon className="h-4 w-4 text-accent-copper" style={{ color: 'var(--accent-copper)' }} />
      <span className="text-xs text-muted-foreground max-w-[140px] truncate">
        {weather.summary}
      </span>
    </Link>
  )
}
