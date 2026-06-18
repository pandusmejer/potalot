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
      <style>{`
        @keyframes vejr-pools-in { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }
        .vejr-pool {
          position: relative;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
          width: var(--pool-w); height: var(--pool-h);
          border-radius: var(--pool-radius);
          transform: rotate(var(--pool-rotate));
          color: var(--pool-ink);
          /* Flad pyt, ikke blank sten: dæmpet diffust lys fra øverste højre. */
          background:
            radial-gradient(150% 120% at 72% 12%, rgba(255,255,255,0.30), rgba(255,255,255,0) 54%),
            var(--pool-bg);
          /* Lav, tæt kontaktskygge (pytten ligger på fladen) + svag vand-dybde
             langs nederste kant. Kun en anelse indre top-glans. */
          box-shadow:
            0 7px 13px -9px rgba(36,48,31,0.20),
            0 2px 4px -3px rgba(36,48,31,0.10),
            inset 0 -5px 11px -8px rgba(36,48,31,0.15),
            inset 2px 3px 8px -7px rgba(255,255,255,0.34);
          backdrop-filter: blur(2.5px); -webkit-backdrop-filter: blur(2.5px);
          overflow: hidden;
        }
        .vejr-pool::before { /* bredt, fladt diffust lys — som lys hen over vand */
          content: ''; position: absolute; top: 7%; right: 9%;
          width: 60%; height: 32%; border-radius: 50%;
          background: radial-gradient(circle at 58% 44%, rgba(255,255,255,0.40), rgba(255,255,255,0) 72%);
          filter: blur(3.5px); pointer-events: none;
        }
        .vejr-pool::after { /* knap synlig sekundær glimt — holder det levende, ikke blankt */
          content: ''; position: absolute; top: 20%; left: 18%;
          width: 13%; height: 9%; border-radius: 50%;
          background: rgba(255,255,255,0.26); filter: blur(2.5px); pointer-events: none;
        }
      `}</style>

      {/* Løst 2-kolonne mønster: højre kolonne ligger lidt lavere, hver pool
          har sin egen form/rotation — organisk, ikke en firkantet 2x2. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          columnGap: 8,
          rowGap: 2,
          justifyItems: 'center',
          maxWidth: 360,
          marginInline: 'auto',
        }}
      >
        {pills.map((p, i) => (
          <div key={p.type + i} style={{ marginTop: POOL_VARIANT[i % POOL_VARIANT.length].offsetY }}>
            <PoolItem pill={p} variant={POOL_VARIANT[i % POOL_VARIANT.length]} />
          </div>
        ))}
      </div>
    </div>
  )
}

interface PoolVariant {
  radius: string
  rotate: string
  w: number
  h: number
  offsetY: number
}

function PoolItem({ pill, variant }: { pill: Pill; variant: PoolVariant }) {
  const Icon = pill.icon
  const tone = POOL_TONE[pill.type]
  const lines = poolLines(pill.text)

  return (
    <div
      className="vejr-pool"
      style={{
        // CSS-variabler pr. pool → let at justere farve/form/størrelse.
        ['--pool-bg' as string]: tone.bg,
        ['--pool-ink' as string]: tone.ink,
        ['--pool-radius' as string]: variant.radius,
        ['--pool-rotate' as string]: variant.rotate,
        ['--pool-w' as string]: `${variant.w}px`,
        ['--pool-h' as string]: `${variant.h}px`,
      }}
    >
      {/* Indhold roteres tilbage, så teksten står lige selvom poolen hælder. */}
      <div
        style={{
          transform: `rotate(calc(-1 * ${variant.rotate}))`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 1, paddingInline: 10,
        }}
      >
        <Icon width={19} height={19} strokeWidth={1.7} style={{ color: tone.ink, opacity: 0.78, marginBottom: 2, flexShrink: 0 }} />
        {lines.map((l, i) => (
          <span
            key={i}
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: l.big ? 24 : 15,
              lineHeight: l.big ? 1.0 : 1.05,
              letterSpacing: l.big ? '0.005em' : '0.01em',
              opacity: l.big ? 1 : 0.78,
              maxWidth: variant.w - 26,
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

/** Visuel variation pr. pool — organiske former, så ingen to er ens.
 *  Lige indeks (venstre kolonne) ligger højere; ulige (højre) lidt lavere. */
const POOL_VARIANT: PoolVariant[] = [
  { radius: '54% 46% 40% 60% / 64% 54% 46% 36%', rotate: '-2.5deg', w: 156, h: 88, offsetY: 0 },
  { radius: '44% 56% 54% 46% / 52% 40% 60% 48%', rotate: '2deg', w: 162, h: 84, offsetY: 16 },
  { radius: '52% 48% 43% 57% / 66% 48% 52% 34%', rotate: '-1.5deg', w: 150, h: 86, offsetY: 6 },
  { radius: '57% 43% 51% 49% / 42% 62% 38% 58%', rotate: '2.5deg', w: 158, h: 82, offsetY: 14 },
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
