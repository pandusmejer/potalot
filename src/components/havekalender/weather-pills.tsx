'use client'

import { Thermometer, CloudRain, Sun, Snowflake, Sprout, Wind } from 'lucide-react'
import type { GardenAlert } from '@/actions/weather'
import type { ComponentType, SVGProps } from 'react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), serif'

type PillType = 'temp' | 'jordtemp' | 'rain' | 'sun' | 'frost' | 'wind'
type PillSize = 'small' | 'medium' | 'large'

interface Pill {
  type: PillType
  icon: ComponentType<SVGProps<SVGSVGElement>>
  iconColor: string
  text: string
  size: PillSize
}

interface Props {
  alerts: GardenAlert[]
}

/**
 * Vejr-pools — atmosfærisk "sanselag" mellem heroen og det operationelle
 * indhold. IKKE et vejr-widget og IKKE status-badges: små overfladiske,
 * geléagtige pools der føles som dug/regnvand/jordvarme på en lys flade —
 * rolige observationer fra haven, ikke UI-felter.
 *
 * Visuel retning (Annas reference, 18/6): organiske blob-former (aldrig
 * perfekte), transparent materiale med blødt lys fra øverste HØJRE, tæt
 * kontaktskygge under, dæmpede naturtoner pr. vejrtype. Må ALDRIG konkurrere
 * med Dagens fokus eller blive tunge kort.
 *
 * Kun visuelt: data/logik (derivePills) er uændret — samme information,
 * samme kilde. Tekst-opdeling i to linjer er ren præsentation.
 */
export function WeatherPills({ alerts }: Props) {
  const pills = derivePills(alerts)

  return (
    <div style={{ paddingInline: 20, marginTop: 16, marginBottom: 20, animation: 'vejr-pools-in 600ms ease-out both' }}>
      {/* Ujævne pyt-silhuetter via SVG clip-paths (normaliseret 0..1 → skalerer
          til enhver poolstørrelse). Hver har indhak/bule, så de IKKE er ovaler. */}
      <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
        <defs>
          {POOL_BLOBS.map((d, i) => (
            <clipPath key={i} id={`vejr-blob-${i}`} clipPathUnits="objectBoundingBox">
              <path d={d} />
            </clipPath>
          ))}
        </defs>
      </svg>

      <style>{`
        @keyframes vejr-pools-in { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }
        .vejr-pool {
          position: relative;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
          width: var(--pool-w); height: var(--pool-h);
          transform: rotate(var(--pool-rotate));
          color: var(--pool-ink);
          /* Tynd væske på flade: svag vandkant-rim (lys ring nær kanten),
             diffust lys fra øverste højre, svag mørk bund-venstre. */
          background:
            radial-gradient(closest-side at 50% 48%, rgba(255,255,255,0) 56%, rgba(255,255,255,0.22) 90%, rgba(255,255,255,0) 100%),
            radial-gradient(115% 130% at 77% 12%, rgba(255,255,255,0.24), rgba(255,255,255,0) 46%),
            linear-gradient(210deg, rgba(255,255,255,0) 56%, rgba(36,48,31,0.10) 100%),
            var(--pool-bg);
          /* drop-shadow FØLGER clip-path-silhuetten (box-shadow gør ikke).
             Lav, tæt kontaktskygge — pytten ligger på fladen. */
          filter:
            drop-shadow(0 5px 6px rgba(36,48,31,0.16))
            drop-shadow(0 1px 2px rgba(36,48,31,0.12));
          backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
        }
        .vejr-pool::before { /* ujævnt, blødt kant-highlight øverst/højre */
          content: ''; position: absolute; top: 5%; right: 7%;
          width: 44%; height: 28%; border-radius: 50%;
          background: radial-gradient(circle at 56% 48%, rgba(255,255,255,0.5), rgba(255,255,255,0) 72%);
          filter: blur(3px); pointer-events: none;
          clip-path: var(--pool-clip); -webkit-clip-path: var(--pool-clip);
        }
        .vejr-pool::after { /* subtil våd tekstur — ikke en glat gradient */
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.045) 0.5px, transparent 0.7px);
          background-size: 4px 4px; opacity: 0.7; mix-blend-mode: screen;
          clip-path: var(--pool-clip); -webkit-clip-path: var(--pool-clip);
          pointer-events: none;
        }
      `}</style>

      {/* Løst 2-kolonne mønster: højre kolonne ligger lidt lavere, hver pool
          har sin egen silhuet/rotation — organisk, ikke en firkantet 2x2. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          columnGap: 6,
          rowGap: 0,
          justifyItems: 'center',
          maxWidth: 352,
          marginInline: 'auto',
        }}
      >
        {pills.map((p, i) => (
          <div key={p.type + i} style={{ marginTop: POOL_VARIANT[i % POOL_VARIANT.length].offsetY }}>
            <PoolItem pill={p} variant={POOL_VARIANT[i % POOL_VARIANT.length]} index={i % POOL_BLOBS.length} />
          </div>
        ))}
      </div>
    </div>
  )
}

interface PoolVariant {
  rotate: string
  w: number
  h: number
  offsetY: number
}

function PoolItem({ pill, variant, index }: { pill: Pill; variant: PoolVariant; index: number }) {
  const Icon = pill.icon
  const tone = POOL_TONE[pill.type]
  const lines = poolLines(pill.text)
  const clip = `url(#vejr-blob-${index})`

  return (
    <div
      className="vejr-pool"
      style={{
        ['--pool-bg' as string]: tone.bg,
        ['--pool-ink' as string]: tone.ink,
        ['--pool-rotate' as string]: variant.rotate,
        ['--pool-w' as string]: `${variant.w}px`,
        ['--pool-h' as string]: `${variant.h}px`,
        ['--pool-clip' as string]: clip,
        // Selve elementet klippes til blob-silhuetten (drop-shadow følger med).
        clipPath: clip,
        WebkitClipPath: clip,
      }}
    >
      {/* Indhold roteres tilbage, så teksten står lige selvom poolen hælder. */}
      <div
        style={{
          transform: `rotate(calc(-1 * ${variant.rotate}))`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 0, paddingInline: 10,
        }}
      >
        <Icon width={16} height={16} strokeWidth={1.7} style={{ color: tone.ink, opacity: 0.76, marginBottom: 1, flexShrink: 0 }} />
        {lines.map((l, i) => (
          <span
            key={i}
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: l.big ? 22 : 13,
              lineHeight: l.big ? 1.0 : 1.05,
              letterSpacing: l.big ? '0.005em' : '0.01em',
              opacity: l.big ? 1 : 0.76,
              maxWidth: variant.w - 28,
            }}
          >
            {l.line}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Præsentation: del pille-teksten i (maks) to linjer som i referencen.
 * Linjen med tal er den fremhævede (big) — "8 mm" / "12°" / "05.15" / "14°".
 * Falder tilbage til én linje for fx vejrvarsel-sætninger.
 *   "8 mm i nat" → 8 mm (big) / i nat        "Jord 12°"  → Jord / 12° (big)
 *   "Sol 05.15"  → Sol / 05.15 (big)         "14°"       → 14° (big)
 */
function poolLines(text: string): { line: string; big: boolean }[] {
  const t = text.trim()
  let parts = [t]
  const numFirst = t.match(/^(\d[\d.,]*\s*(?:mm|cm|°|%)?)\s+(\D.+)$/i) // tal-først: "8 mm i nat"
  const labelFirst = t.match(/^(\D+?)\s+(\d.*)$/)                       // label-først: "Jord 12°"
  if (numFirst) parts = [numFirst[1], numFirst[2]]
  else if (labelFirst) parts = [labelFirst[1], labelFirst[2]]
  return parts.map(p => ({ line: p.trim(), big: /\d/.test(p) }))
}

/**
 * Pool-toner pr. vejrtype — dæmpede, naturlige materialer (ikke
 * "weather channel"-farver). bg = transparent gelé, ink = dyb udgave
 * af samme tone til ikon + tekst.
 */
const POOL_TONE: Record<PillType, { bg: string; ink: string }> = {
  rain:     { bg: 'rgba(170,190,192,0.42)', ink: '#46544E' }, // støvet blågrå → dyb grågrøn
  jordtemp: { bg: 'rgba(196,170,128,0.36)', ink: '#6A5A33' }, // varm sand → olivenbrun
  temp:     { bg: 'rgba(220,162,128,0.36)', ink: '#9B5636' }, // støvet fersken → terracotta
  sun:      { bg: 'rgba(226,188,104,0.40)', ink: '#8A6420' }, // blød honning → okkerbrun
  frost:    { bg: 'rgba(160,178,192,0.44)', ink: '#46545F' }, // kold tåge → blågrå
  wind:     { bg: 'rgba(178,186,168,0.38)', ink: '#54604B' }, // dæmpet urtegrå
}

/** Ujævne pyt-silhuetter (normaliseret 0..1, objectBoundingBox). Hver er
 *  lopsided med egen vægt — flad bund, bule i én side, asymmetrisk top — så
 *  ingen to læser som samme oval. */
const POOL_BLOBS: string[] = [
  'M0.48,0.08 C0.69,0.04 0.86,0.13 0.94,0.32 C1.00,0.47 0.97,0.63 0.86,0.76 C0.77,0.88 0.63,0.94 0.48,0.93 C0.33,0.92 0.15,0.88 0.07,0.71 C0.01,0.58 0.04,0.40 0.12,0.27 C0.20,0.13 0.31,0.11 0.48,0.08 Z',
  'M0.44,0.09 C0.62,0.05 0.81,0.06 0.92,0.21 C1.01,0.34 1.00,0.55 0.91,0.68 C0.82,0.82 0.65,0.92 0.49,0.91 C0.35,0.90 0.19,0.86 0.11,0.72 C0.04,0.60 0.06,0.43 0.14,0.30 C0.22,0.15 0.30,0.13 0.44,0.09 Z',
  'M0.53,0.07 C0.73,0.07 0.88,0.16 0.92,0.34 C0.97,0.51 0.93,0.66 0.82,0.78 C0.73,0.88 0.59,0.93 0.44,0.92 C0.30,0.91 0.14,0.85 0.08,0.69 C0.03,0.55 0.06,0.39 0.15,0.26 C0.24,0.12 0.37,0.08 0.53,0.07 Z',
  'M0.50,0.08 C0.67,0.06 0.84,0.11 0.92,0.27 C0.99,0.42 0.98,0.58 0.89,0.72 C0.80,0.87 0.62,0.95 0.46,0.94 C0.31,0.93 0.17,0.87 0.10,0.71 C0.03,0.57 0.05,0.41 0.13,0.27 C0.21,0.13 0.34,0.10 0.50,0.08 Z',
]

/** Visuel variation pr. pool — flade, brede pytter (lav højde), egen rotation.
 *  Lige indeks (venstre kolonne) ligger højere; ulige (højre) lidt lavere. */
const POOL_VARIANT: PoolVariant[] = [
  { rotate: '-2.5deg', w: 166, h: 76, offsetY: 0 },
  { rotate: '2deg',    w: 168, h: 72, offsetY: 14 },
  { rotate: '-1.5deg', w: 160, h: 76, offsetY: 6 },
  { rotate: '2.5deg',  w: 164, h: 70, offsetY: 12 },
]

/* ──────────────────────────────────────────────────────────────────────────
 * DATA/LOGIK — uændret. derivePills afleder pillerne fra alerts (vejr-API i
 * produktion; opfundne kontekst-tal i demo). Rør ikke denne del i den visuelle
 * runde: WeatherPills viser samme information som før, kun materialet er nyt.
 * ────────────────────────────────────────────────────────────────────────── */

const ICON_COLORS: Record<PillType, string> = {
  temp:     '#C97A5B',
  jordtemp: '#6E8163',
  rain:     '#73837A',
  sun:      '#C9A14A',
  frost:    '#8D99A5',
  wind:     '#8A9385',
}

const ICONS: Record<PillType, ComponentType<SVGProps<SVGSVGElement>>> = {
  temp: Thermometer,
  jordtemp: Sprout,
  rain: CloudRain,
  sun: Sun,
  frost: Snowflake,
  wind: Wind,
}

/**
 * Prioriteringslogik per spec:
 *   1. Frost-fare  2. Kraftig regn  3. Jordtemperatur  4. Stærk varme/sol
 *   5. Vind  6. Lufttemperatur  7. Solopgang
 *
 * Vi viser 4 piller. Vejrvarsler får første prioritet, resten fyldes med
 * rolige kontekst-tal. Default-settet er regn + jordtemp + temp + sol.
 */
function derivePills(alerts: GardenAlert[]): Pill[] {
  const out: Pill[] = []
  const used = new Set<PillType>()
  const MAX = 4

  // 1) Aktive vejrvarsler — frost/storm/skybrud/tørke
  for (const a of alerts) {
    if (out.length >= MAX) break
    if (a.kind === 'frost' && !used.has('frost')) {
      out.push(makePill('frost', 'Risiko for nattefrost', 'medium'))
      used.add('frost')
    } else if ((a.kind === 'skybrud' || a.icon === 'CloudRain') && !used.has('rain')) {
      out.push(makePill('rain', a.title, 'medium'))
      used.add('rain')
    }
  }

  // 2) Standard kontekst-piller — fyld op til 4.
  if (out.length < MAX && !used.has('rain')) {
    out.push(makePill('rain', '8 mm i nat', 'small'))
    used.add('rain')
  }
  if (out.length < MAX && !used.has('jordtemp')) {
    out.push(makePill('jordtemp', 'Jord 12°', 'small'))
    used.add('jordtemp')
  }
  if (out.length < MAX && !used.has('temp')) {
    out.push(makePill('temp', '14°', 'small'))
    used.add('temp')
  }
  if (out.length < MAX && !used.has('sun')) {
    out.push(makePill('sun', 'Sol 05.15', 'small'))
    used.add('sun')
  }

  // Reorder: prioritetslogik bestemmer rækkefølgen (venstre → højre).
  const order: PillType[] = ['frost', 'rain', 'jordtemp', 'temp', 'sun', 'wind']
  out.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))

  return out.slice(0, MAX)
}

function makePill(type: PillType, text: string, size: PillSize): Pill {
  return {
    type,
    icon: ICONS[type],
    iconColor: ICON_COLORS[type],
    text,
    size,
  }
}
