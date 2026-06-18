'use client'

import Image from 'next/image'
import { CloudRain, Sprout, Thermometer, Sun } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

/**
 * Vejr-pools (billed-baseret) — Annas retning 18/6.
 *
 * Pytterne er IKKE bygget i CSS. De er færdige sæson-billed-assets (organiske
 * pytter på grynet creme-flade, lys + skygger baked ind). Vi lægger kun tekst +
 * ikoner ovenpå som absolut-positioneret overlay, mappet fast til hver pyt.
 *
 *   øverst venstre = regn      øverst højre = jord
 *   nederst venstre = temp     nederst højre = sol
 *
 * Den grynede baggrund bevares bevidst (frilæg ALDRIG pytterne) — underlaget
 * er det, der gør dem troværdige. Sæsonbilledet skifter automatisk med måneden.
 *
 * Overlayet skaleres med billedet via container-query-units (cqw), så teksten
 * holder proportion på alle skærmbredder uden ombygning.
 */

const serif = 'var(--font-cormorant), serif'
const INK = '#3C4632' // dæmpet varm olivengrå — konsistent på tværs af sæsoner

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/** Meteorologiske sæsoner: forår mar-maj, sommer jun-aug, efterår sep-nov, vinter dec-feb. */
export function monthToSeason(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

const SEASON_IMAGE: Record<Season, string> = {
  spring: '/images/weather-pools/weather-pools-spring.png',
  summer: '/images/weather-pools/weather-pools-summer.png',
  autumn: '/images/weather-pools/weather-pools-autumn.png',
  winter: '/images/weather-pools/weather-pools-winter.png',
}
const SEASON_ALT: Record<Season, string> = {
  spring: 'Forårets vejr-pools', summer: 'Sommerens vejr-pools',
  autumn: 'Efterårets vejr-pools', winter: 'Vinterens vejr-pools',
}

/** Creme-flade pr. sæson — sampled fra hvert assets baggrundshjørne, så
 *  sektionsfladen matcher den aktuelle sæsons asset og billedets egen creme
 *  smelter usynligt ind i den. JUSTÉR HER hvis et asset udskiftes. */
const SEASON_CREME: Record<Season, string> = {
  spring: '#E6DBCC',
  summer: '#EFDCBD',
  autumn: '#DFB882',
  winter: '#E4DFDA',
}

type Slot = 'rain' | 'soil' | 'temperature' | 'sun'

const SLOT_ICON: Record<Slot, ComponentType<SVGProps<SVGSVGElement>>> = {
  rain: CloudRain, soil: Sprout, temperature: Thermometer, sun: Sun,
}

/**
 * Pytternes centre i billedet (% af 1448×1086). JUSTÉR HER hvis et nyt
 * asset flytter pytterne. Rækkefølge matcher det faste 2x2-layout.
 */
const SLOT_POS: Record<Slot, { left: string; top: string }> = {
  rain:        { left: '31%', top: '31%' }, // øverst venstre — gruppen lidt ned
  soil:        { left: '67%', top: '28%' }, // øverst højre
  temperature: { left: '34%', top: '62%' }, // nederst venstre
  sun:         { left: '69%', top: '61%' }, // nederst højre — gruppen lidt op
}

export interface WeatherPoolsData {
  rain: { value: string; label: string }
  soil: { value: string; label: string }
  temperature: { value: string; label?: string }
  sun: { value: string; label: string }
}

interface Props {
  data: WeatherPoolsData
  /** 1-12. Falder tilbage til date, derefter dags dato. */
  month?: number
  date?: Date
  className?: string
  priority?: boolean
}

export function WeatherPoolsImage({ data, month, date, className, priority }: Props) {
  const m = month ?? (date ?? new Date()).getMonth() + 1
  const season = monthToSeason(m)
  const creme = SEASON_CREME[season]

  const slots: { slot: Slot; value: string; label?: string }[] = [
    { slot: 'rain', value: data.rain.value, label: data.rain.label },
    { slot: 'soil', value: data.soil.value, label: data.soil.label },
    { slot: 'temperature', value: data.temperature.value, label: data.temperature.label },
    { slot: 'sun', value: data.sun.value, label: data.sun.label },
  ]

  return (
    <div
      className={className}
      style={{
        // Fuld-bredde creme-FLADE (ikke en indsat plade): sektionen ER selv den
        // varme creme, så assetets egen creme smelter usynligt ind i den. Hele
        // fladen fader top/bund ind i siden (ingen hård billedkant), så pytterne
        // føles som en fortsættelse af heroens organiske flade. Træk op under
        // bølgen frem for at starte efter en tom cremeflade.
        // Full-bleed til content-kolonnens kant — samme greb som heroen
        // (-mx-4 i en max-w-[480px] px-4 container), så fladen flugter med
        // heroen og IKKE giver vandret scroll (undgår 100vw-scrollbar-fælden).
        width: 'calc(100% + 32px)',
        marginLeft: -16,
        marginRight: -16,
        marginTop: -28,
        marginBottom: -8,
        background: creme,
        maskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
        animation: 'vejr-pools-img-in 600ms ease-out both',
      }}
    >
      <style>{`@keyframes vejr-pools-img-in { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          marginInline: 'auto',
          aspectRatio: '1448 / 1086',
          containerType: 'inline-size', // → 1cqw = 1% af denne breddes, overlay skalerer med billedet
        }}
      >
        <Image
          src={SEASON_IMAGE[season]}
          alt={SEASON_ALT[season]}
          fill
          priority={priority}
          sizes="(max-width: 540px) 100vw, 520px"
          style={{ objectFit: 'contain' }}
        />

        {slots.map(({ slot, value, label }) => {
          const Icon = SLOT_ICON[slot]
          const pos = SLOT_POS[slot]
          return (
            <div
              key={slot}
              style={{
                position: 'absolute',
                left: pos.left, top: pos.top,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', color: INK, lineHeight: 1.04, pointerEvents: 'none',
              }}
            >
              <Icon style={{ width: '4.6cqw', height: '4.6cqw', opacity: 0.8, marginBottom: '1cqw' }} strokeWidth={1.7} aria-hidden />
              <span style={{ fontFamily: serif, fontWeight: 500, fontSize: '6cqw', letterSpacing: '0.01em' }}>{value}</span>
              {label ? (
                <span style={{ fontFamily: serif, fontWeight: 500, fontSize: '5cqw', opacity: 0.78, marginTop: '0.2cqw' }}>{label}</span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
