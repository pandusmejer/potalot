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
  sun:         { left: '72.5%', top: '67%' }, // nederst højre — centreret på pyttens centroid
}

/**
 * Ikon-placering pr. pyt (Annas finjustering 18/6) — pytterne har forskellig
 * form, så ikonet sidder forskelligt:
 *   temperature  'top'              ikon over 14° (uændret)
 *   rain         'left-of-primary'  regnsky til venstre for "8 mm", "i nat" under
 *   soil         'right-of-second'  "Jord" øverst, spire til højre for "12°"
 *   sun          'right-centered'   sol-ikon til højre, centreret mellem Sol/05.15
 */
type IconArrange = 'top' | 'left-of-primary' | 'right-of-second' | 'right-centered'
const SLOT_LAYOUT: Record<Slot, IconArrange> = {
  rain: 'left-of-primary',
  soil: 'right-of-second',
  temperature: 'top',
  sun: 'right-centered',
}
/** Ikon-skala pr. pyt (1 = basis). Sol-ikonet 10% større. */
const SLOT_ICON_SCALE: Record<Slot, number> = { rain: 1, soil: 1, temperature: 1, sun: 1.1 }

/** Ikon-farve pr. pyt: en MØRKERE nuance af pyttens egen tone (tone-i-tone),
 *  så ikonet harmonerer med pytten men stadig læses. Teksten forbliver INK. */
const SLOT_ICON_COLOR: Record<Slot, string> = {
  rain: '#4E5A55',        // kølig slate (regn-pyttens blågrå, mørkere)
  soil: '#6E5630',        // dyb oliven-tan (jord-pyttens sand, mørkere)
  temperature: '#8A5230', // terracotta (temp-pyttens fersken/ler, mørkere)
  sun: '#7A5E22',         // okker (sol-pyttens honning, mørkere)
}

/** Finjustering pr. pyt (Anna, i mm). Blok = hele indholdets position på
 *  pytten; ikon = ikonets placering relativt i blokken. */
const SLOT_BLOCK_OFFSET: Record<Slot, { x: number; y: number }> = {
  rain: { x: -3, y: 0 },        // hele indholdet 3 mm mod venstre
  soil: { x: 0, y: 0 },
  temperature: { x: -3, y: 0 }, // ikon + tekst 3 mm mod venstre
  sun: { x: 0, y: 0 },
}
const SLOT_ICON_OFFSET: Record<Slot, { x: number; y: number }> = {
  rain: { x: 0, y: 2 },         // ikon 2 mm ned
  soil: { x: 1, y: 2 },         // ikon 2 mm ned, 1 mm mod højre
  temperature: { x: 0, y: 2 },  // ikon 2 mm ned
  sun: { x: 0, y: 0 },
}
/** Nudge KUN den primære tekst (mm). */
const SLOT_PRIMARY_OFFSET: Record<Slot, { x: number; y: number }> = {
  rain: { x: 0, y: 0 },
  soil: { x: 6, y: 2 },         // "Jord" 6 mm mod højre, 2 mm ned
  temperature: { x: 0, y: 0 },
  sun: { x: 0, y: 0 },
}
/** Nudge KUN den sekundære tekst (mm). */
const SLOT_SECONDARY_OFFSET: Record<Slot, { x: number; y: number }> = {
  rain: { x: 0, y: 0 },
  soil: { x: -1, y: 0 },        // "12°" 1 mm mod venstre
  temperature: { x: 0, y: 0 },
  sun: { x: 0, y: 0 },
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
  /** Lille vejr-note under pytterne: kort handling (headline) + begrundelse (subline). */
  note?: { headline: string; subline: string }
}

export function WeatherPoolsImage({ data, month, date, className, priority, note }: Props) {
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
    <>
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
        marginTop: 'calc(-28px - 2.5cm + 4mm)', // 2,5 cm op, 4 mm tilbage ned (Anna)
        marginBottom: 'calc(-8px + 4mm)', // skub Dagens fokus 4 mm ned (Anna)
        background: creme,
        // Top-fade (0→20%) blender ind under heroen; bund-fade starter 3 mm
        // højere oppe (83%) for en tidligere, blødere overgang ned mod Dagens fokus.
        maskImage: 'linear-gradient(to bottom, transparent 0%, #000 20%, #000 83%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 20%, #000 83%, transparent 100%)',
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
          const pos = SLOT_POS[slot]
          const bo = SLOT_BLOCK_OFFSET[slot]
          return (
            <div
              key={slot}
              style={{
                position: 'absolute',
                left: pos.left, top: pos.top,
                transform: `translate(calc(-50% + ${bo.x}mm), calc(-50% + ${bo.y}mm))`,
                color: INK, lineHeight: 1.04, pointerEvents: 'none',
              }}
            >
              <PoolContent slot={slot} value={value} label={label} />
            </div>
          )
        })}
      </div>
    </div>

    {note && (
      <div
        style={{
          width: 'calc(100% - 64px + 10mm)', // +5 mm i hver side (Anna)
          maxWidth: 'calc(320px + 10mm)',
          margin: 'calc(22px - 1cm) auto 34px', // 1 cm tættere på pytterne (Anna)
          padding: '18px 22px 20px',
          borderRadius: 28,
          background: 'rgba(238, 232, 211, 0.58)',
          border: '1px solid rgba(95, 103, 72, 0.10)',
          boxShadow: 'none',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-cormorant), var(--font-gabarito), serif',
            fontSize: 24,
            lineHeight: 1.08,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#26351f',
            margin: '0 0 8px',
          }}
        >
          {note.headline}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 16,
            lineHeight: 1.35,
            fontWeight: 500,
            color: 'rgba(38, 53, 31, 0.68)',
            maxWidth: 'none',
            whiteSpace: 'normal',
            textWrap: 'balance',
            margin: '0 auto',
          }}
        >
          {note.subline}
        </p>
      </div>
    )}
    </>
  )
}

const primaryStyle = { fontFamily: serif, fontWeight: 500, fontSize: '6cqw', letterSpacing: '0.01em' }
const secondaryStyle = { fontFamily: serif, fontWeight: 500, fontSize: '5cqw', opacity: 0.78 }

/** Renderer ikon + tekst i pyttens arrangement (SLOT_LAYOUT). */
function PoolContent({ slot, value, label }: { slot: Slot; value: string; label?: string }) {
  const Icon = SLOT_ICON[slot]
  const arrange = SLOT_LAYOUT[slot]
  const px = (6 * SLOT_ICON_SCALE[slot]).toFixed(2) // et par mm større (Anna)
  const io = SLOT_ICON_OFFSET[slot]
  const iconStyle = {
    width: `${px}cqw`, height: `${px}cqw`, opacity: 0.9, flexShrink: 0,
    color: SLOT_ICON_COLOR[slot],
    transform: `translate(${io.x}mm, ${io.y}mm)`, // ikon-nudge relativt i blokken
  }
  const icon = <Icon style={iconStyle} strokeWidth={1.7} aria-hidden />
  const po = SLOT_PRIMARY_OFFSET[slot]
  const primary = <span style={{ ...primaryStyle, transform: `translate(${po.x}mm, ${po.y}mm)` }}>{value}</span>
  const so = SLOT_SECONDARY_OFFSET[slot]
  const secondary = label ? <span style={{ ...secondaryStyle, transform: `translate(${so.x}mm, ${so.y}mm)` }}>{label}</span> : null
  const colStyle = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const }

  if (arrange === 'left-of-primary') {
    // regn: [sky][8 mm] på én linje, "i nat" under "8 mm"
    return (
      <div style={colStyle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1.8cqw' }}>{icon}{primary}</span>
        {secondary && <span style={{ ...secondaryStyle, marginTop: '0.2cqw' }}>{label}</span>}
      </div>
    )
  }
  if (arrange === 'right-of-second') {
    // jord: "Jord" øverst, [12°][spire] på samme linje, ikon til højre
    return (
      <div style={colStyle}>
        {primary}
        <span style={{ display: 'flex', alignItems: 'center', gap: '1.4cqw', marginTop: '0.2cqw' }}>{secondary}{icon}</span>
      </div>
    )
  }
  if (arrange === 'right-centered') {
    // sol: tekst-kolonne (Sol / 05.15) + ikon til højre, centreret mellem linjerne
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2cqw' }}>
        <span style={colStyle}>{primary}{secondary}</span>
        {icon}
      </div>
    )
  }
  // 'top' (temperatur, uændret): ikon over værdien
  return (
    <div style={colStyle}>
      <Icon style={{ ...iconStyle, marginBottom: '1cqw' }} strokeWidth={1.7} aria-hidden />
      {primary}
      {secondary}
    </div>
  )
}
