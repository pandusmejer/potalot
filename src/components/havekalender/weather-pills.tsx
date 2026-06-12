'use client'

import { Thermometer, CloudRain, Sun, Snowflake, Sprout, Wind } from 'lucide-react'
import type { GardenAlert } from '@/actions/weather'
import type { ComponentType, SVGProps } from 'react'

const sans = 'var(--font-manrope)'

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
 * Vejrpiller — atmosfærisk lag mellem heroen og det operationelle
 * uge-laget. Bevidst IKKE et vejr-widget: små "luftpocher" der
 * fortæller hvad der betyder noget for haven LIGE NU.
 *
 * Spec-detaljer der definerer feeling:
 *   • Organisk floating — left lower, middle higher, right lower
 *     (subtile y-offsets, aldrig kaotiske)
 *   • Varierende pille-størrelser (small/medium/large) afhængigt
 *     af signalets vægt — frost+regn får mest plads
 *   • Soft paper-glass-hybrid materiale, max 3 piller synlige
 *   • Diskret fade-in: opacity 0→1 + translateY 4px→0
 */
export function WeatherPills({ alerts }: Props) {
  const pills = derivePills(alerts)

  return (
    <div
      style={{
        paddingInline: 24,
        marginTop: 18,
        marginBottom: 18,
        // Animation: subtil fade-in når komponenten første gang
        // tegnes. Ingen bounce, ingen loops.
        animation: 'vejr-piller-in 500ms ease-out both',
      }}
    >
      <style>{`
        @keyframes vejr-piller-in {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* 12-col grid over 2 rækker — hver pille har sin egen y-offset
          så de IKKE står på samme baseline indenfor en række.
          Resultatet er et "tilfældigt skye"-mønster, ikke en
          ordnet kasse. Pillerne spænder hele bredden via
          venstre-/højre-justering. */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(12, 1fr)',
          rowGap: 4,
        }}
      >
        {pills.map((p, i) => {
          const placement = SCATTER_PLACEMENT[i] ?? SCATTER_PLACEMENT[0]
          return (
            <div
              key={p.type + i}
              style={{
                gridColumn: placement.col,
                gridRow: placement.row,
                justifySelf: placement.justify,
                marginTop: placement.offsetY,
                marginLeft: placement.marginLeft,
                marginRight: placement.marginRight,
              }}
            >
              <PillItem pill={p} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PillItem({ pill }: { pill: Pill; index?: number; total?: number }) {
  const Icon = pill.icon
  const sz = SIZE_TOKENS[pill.size]

  // Y-offset håndteres nu af det ydre scatter-grid (SCATTER_PLACEMENT)
  // så pillerne kan placeres individuelt i et asymmetrisk mønster.

  return (
    <div
      className="inline-flex items-center"
      style={{
        height: sz.height,
        paddingInline: sz.paddingX,
        gap: sz.gap,
        borderRadius: sz.radius,
        // Soft paper-glass-hybrid — papir-tone med let blur,
        // hvid kant og næsten usynlig skygge.
        background: 'rgba(248,246,238,0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 6px 18px rgba(36,48,31,0.05)',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon
        width={sz.iconSize}
        height={sz.iconSize}
        strokeWidth={1.8}
        style={{ color: pill.iconColor, flexShrink: 0 }}
      />
      <span
        style={{
          fontFamily: sans,
          fontSize: sz.textSize,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          color: '#3F4638',
        }}
      >
        {pill.text}
      </span>
    </div>
  )
}

/**
 * Scatter-placering pr. pille-index. 12-col grid over 2 rækker
 * med varierende y-offsets så pillerne ikke står på samme baseline
 * indenfor en række — det giver et "tilfældigt skye"-feeling frem
 * for en ordnet 2x2.
 *
 *   index 0  rain      cols 1-5,   row 1, start, offsetY 0
 *   index 1  jordtemp  cols 8-13,  row 1, end,   offsetY 10 (lavere)
 *   index 2  temp      cols 3-8,   row 2, start, offsetY 0
 *   index 3  sun       cols 8-13,  row 2, end,   offsetY 8  (lavere)
 *
 * Visuelt (asymmetrisk, ikke firkant):
 *   [rain]                  [jordtemp↓]
 *      [temp]                [sun↓]
 */
const SCATTER_PLACEMENT: Array<{
  col: string
  row: number
  justify: 'start' | 'end'
  offsetY: number
  marginLeft?: number
  marginRight?: number
}> = [
  { col: '1 / 6',  row: 1, justify: 'start', offsetY: 0 },
  // Jord-pillen sidder 103px fra højre kant.
  { col: '8 / 13', row: 1, justify: 'end',   offsetY: 10, marginRight: 103 },
  // Temp-pillen er rykket 15px mod højre via marginLeft og 7px ned
  // (offsetY) så row 2 får en lille forskudt rytme.
  { col: '3 / 8',  row: 2, justify: 'start', offsetY: 7, marginLeft: 15 },
  { col: '8 / 13', row: 2, justify: 'end',   offsetY: 8 },
]

/**
 * Størrelses-tokens for de tre pille-varianter. Temperatur er
 * lille (kort tal), jordtemp mellem, regn/frost/vejr-events
 * største plads så de visuelt får vægt.
 */
const SIZE_TOKENS: Record<PillSize, {
  height: number
  paddingX: number
  gap: number
  radius: number
  iconSize: number
  textSize: number
}> = {
  small:  { height: 32, paddingX: 13, gap: 6, radius: 16, iconSize: 16, textSize: 15 },
  medium: { height: 36, paddingX: 15, gap: 7, radius: 18, iconSize: 17, textSize: 15 },
  large:  { height: 40, paddingX: 17, gap: 8, radius: 20, iconSize: 18, textSize: 16 },
}

/**
 * Farve-system pr. pille-type. Spec definerer dæmpede natur-toner —
 * aldrig "weather channel"-farver eller stærk blå/rød.
 */
const ICON_COLORS: Record<PillType, string> = {
  temp:     '#C97A5B', // soft terracotta
  jordtemp: '#6E8163', // dusty sage
  rain:     '#73837A', // rain sage/slate
  sun:      '#C9A14A', // ochre sunlight
  frost:    '#8D99A5', // cold fog blue-grey
  wind:     '#8A9385', // muted herb grey
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
 *   1. Frost-fare
 *   2. Kraftig regn
 *   3. Jordtemperatur
 *   4. Stærk varme/sol
 *   5. Vind
 *   6. Lufttemperatur
 *   7. Solopgang
 *
 * Vi viser 4 piller. Vejrvarsler får første prioritet, resten
 * fyldes med rolige kontekst-tal. Default-settet er:
 * regn + jordtemp + temp + sol — alle fire have-relevante.
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
  // Ved 4 piller bruger vi kun small/medium så de fitter på én række
  // (med justify-content: space-between).
  // I demo: opfundne værdier; produktion bruger vejr-API.
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
    // Kort form "Sol 05.15" så pillen fitter på én række sammen
    // med de tre andre (vi sparer ~25px på "op " mod den
    // operationelle læseflow forbliver tydelig).
    out.push(makePill('sun', 'Sol 05.15', 'small'))
    used.add('sun')
  }

  // Reorder: prioritetslogik bestemmer rækkefølgen så det mest
  // presserende kommer først (visuelt læses venstre → højre).
  // Frost/regn → jordtemp/temp → sol/vind.
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
