import Link from 'next/link'
import {
  Snowflake, Sun, CloudRain, Wind, Sprout, Wheat, Droplets, Leaf,
  CalendarClock, Bug, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeWeekOverview } from '@/lib/denne-uge'
import { saeson } from '@/lib/datetime'
import type { WeekSuggestion, OverviewIcon } from '@/lib/denne-uge'
import type { GardenAlert } from '@/actions/weather'
import type { ComponentType, SVGProps } from 'react'

const ICON_MAP: Record<OverviewIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  frost: Snowflake,
  sun: Sun,
  rain: CloudRain,
  wind: Wind,
  sprout: Sprout,
  harvest: Wheat,
  water: Droplets,
  leaf: Leaf,
  plan: CalendarClock,
  pest: Bug,
}

const sans = 'var(--font-manrope)'

type Season = ReturnType<typeof saeson>

// Tre faste "conditions"-slots: varme, fugt, vækst. Fast blødt
// muted ikon + farve; kun teksten skifter pr. sæson. En rolig
// natur-observation ("havejournal") — ikke et data-dashboard.
const COND_META: { icon: OverviewIcon; color: string }[] = [
  { icon: 'sun', color: '#D8B44A' },
  { icon: 'water', color: '#7FA8A0' },
  { icon: 'sprout', color: '#8DAE5E' },
]

// Sæson-fornemmelse: strip-farve, hero-lys-glød, dags-tekst og
// tre menneskelige conditions (varme / fugt / vækst).
const SEASON_VIBE: Record<Season, {
  strip: string
  glow: string
  conditions: { title: string; desc: string }[]
  dag: string
}> = {
  'Forår': {
    strip: 'linear-gradient(180deg,#7FA653,#E8C24B)',
    glow: 'rgba(255,232,160,0.10)',
    dag: 'God vækstuge',
    conditions: [
      { title: 'Mild varme', desc: 'Jorden bliver hurtigt lun i solen' },
      { title: 'Fugtig jord', desc: 'Majregn hjælper spiringen' },
      { title: 'Hurtig vækst', desc: 'Planterne reagerer på de lyse dage' },
    ],
  },
  'Sommer': {
    strip: 'linear-gradient(180deg,#E8C24B,#D98A3D)',
    glow: 'rgba(255,224,150,0.12)',
    dag: 'Højsæson',
    conditions: [
      { title: 'Stærk varme', desc: 'Solen står højt og længe' },
      { title: 'Tørt på overfladen', desc: 'Jorden tørrer hurtigt ud' },
      { title: 'Frodig vækst', desc: 'Alt vokser i fuld fart' },
    ],
  },
  'Efterår': {
    strip: 'linear-gradient(180deg,#C77D3A,#7A8C6A)',
    glow: 'rgba(240,200,150,0.09)',
    dag: 'Aftagende vækst',
    conditions: [
      { title: 'Mildere dage', desc: 'Solen står lavt og blødt' },
      { title: 'Tung, fugtig jord', desc: 'Dug og regn holder længe' },
      { title: 'Aftagende vækst', desc: 'Planterne sætter tempoet ned' },
    ],
  },
  'Vinter': {
    strip: 'linear-gradient(180deg,#6E89A6,#E7EFF4)',
    glow: 'rgba(200,220,235,0.08)',
    dag: 'Hvileperiode',
    conditions: [
      { title: 'Kold luft', desc: 'Frost ligger i jorden om morgenen' },
      { title: 'Våd, kold jord', desc: 'Lidt fordampning nu' },
      { title: 'Hvilende vækst', desc: 'Livet arbejder under overfladen' },
    ],
  },
}

function isoUge(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// Lille faint sprig nederst i hjørnet — ikke maskot, bare et
// stille botanisk tegn på liv (≈5% opacity).
const SPRIG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cpath d='M60 116 C 60 80 60 52 60 28' stroke='%232C3425' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Cpath d='M60 70 C 44 64 34 50 32 34 C 50 38 60 52 60 70Z' stroke='%232C3425' stroke-width='3' fill='none' stroke-linejoin='round'/%3E%3Cpath d='M60 58 C 76 52 86 38 88 22 C 70 26 60 40 60 58Z' stroke='%232C3425' stroke-width='3' fill='none' stroke-linejoin='round'/%3E%3Cpath d='M60 92 C 48 88 40 78 38 66 C 52 70 60 80 60 92Z' stroke='%232C3425' stroke-width='3' fill='none' stroke-linejoin='round'/%3E%3C/svg%3E\")"

interface Props {
  suggestions: WeekSuggestion[]
  alerts: GardenAlert[]
  month: number
  monthName: string
}

/**
 * "Denne uge i haven" — svarer tydeligt på "hvad er det vigtigste
 * jeg bør gøre i haven denne uge?". ÉN primær handling i en
 * fremhævet blok, derefter 2–4 mindre observationer. Lagdelt med
 * diskret micro-delight (lys, sæson, tid) — aldrig motion for
 * sin egen skyld; alt slukkes ved prefers-reduced-motion.
 */
export function DenneUge({ suggestions, alerts, month, monthName }: Props) {
  const { primary, secondary } = computeWeekOverview(suggestions, alerts, month)
  const PrimaryIcon = ICON_MAP[primary.icon] ?? Sprout
  const vibe = SEASON_VIBE[saeson(month)]
  const uge = isoUge(new Date())

  return (
    <section
      className="relative z-10 mx-auto w-full max-w-[900px] overflow-hidden rounded-[28px] -mt-[64px]! md:-mt-[76px]!"
      style={{
        // Hero-lyset fortsætter ned i sektionen (varm glød top-right)
        background: `radial-gradient(circle at top right, ${vibe.glow}, transparent 42%), rgba(250,248,242,0.82)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(180,180,160,0.14)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
      }}
    >
      {/* Svagt organisk mønster — ingen grid, ingen dots */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 420'%3E%3Cpath d='M-30 120 C 140 50 260 210 410 135 C 540 70 620 170 690 145' stroke='%234A5A3A' stroke-width='2.5' fill='none'/%3E%3Cpath d='M-30 265 C 150 205 285 330 445 255 C 585 190 655 280 705 245' stroke='%234A5A3A' stroke-width='2.5' fill='none'/%3E%3Cpath d='M-30 55 C 120 25 245 105 420 65 C 560 35 655 85 705 62' stroke='%234A5A3A' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.03,
        }}
      />

      {/* Svage bokeh-prikker (matcher hero-foto), driver ultra-langsomt */}
      <div
        aria-hidden
        className="bokeh-drift pointer-events-none absolute -right-2 top-4 h-20 w-20 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,236,170,0.7), transparent 70%)', filter: 'blur(12px)', opacity: 0.08 }}
      />
      <div
        aria-hidden
        className="bokeh-drift-2 pointer-events-none absolute right-16 top-12 h-12 w-12 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(220,235,180,0.7), transparent 70%)', filter: 'blur(12px)', opacity: 0.08 }}
      />

      {/* Sæson-temperatur-strip i venstre kant */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-5 left-0 top-5 w-1 rounded-full"
        style={{ background: vibe.strip, opacity: 0.2 }}
      />

      {/* Faint sprig nederst i hjørnet — stille tegn på liv */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-3 right-2 h-28 w-28"
        style={{ backgroundImage: SPRIG, backgroundRepeat: 'no-repeat', backgroundSize: 'contain', opacity: 0.05 }}
      />

      <div className="relative p-6 md:p-8">
        {/* HEADER */}
        <h2
          className="text-[28px] md:text-[36px]"
          style={{ fontFamily: sans, fontWeight: 700, lineHeight: 1.1, color: '#25301F' }}
        >
          Denne uge i haven
        </h2>
        <p
          className="mt-1 text-[16px] md:text-[18px]"
          style={{ fontFamily: sans, fontWeight: 500, color: '#6F745C' }}
        >
          Ud fra din frøbank og dine planter i {monthName.toLowerCase()}
        </p>

        {/* Diskret dags-/uge-status — gør sektionen mere realtime */}
        <p
          className="mt-2 uppercase"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#8A8E76' }}
        >
          {monthName} · uge {uge} · {vibe.dag}
        </p>

        {/* Tre rolige natur-conditions (havejournal, ikke dashboard).
            Desktop: én række. Mobil: venstrestillet vertikal stak. */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:gap-4">
          {vibe.conditions.map((c, i) => {
            const m = COND_META[i]
            const Icon = ICON_MAP[m.icon] ?? Sprout
            return (
              <div key={c.title} className="flex items-start gap-[10px] py-1.5 md:flex-1">
                <Icon className="h-8 w-8 shrink-0" strokeWidth={1.75} style={{ color: m.color }} />
                <div className="min-w-0">
                  <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, lineHeight: 1.2, color: '#25301F' }}>
                    {c.title}
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, lineHeight: 1.35, color: '#2C3425', opacity: 0.72 }}>
                    {c.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* PRIMÆR UGE-HANDLING — fremhævet blok m. blød breathing-glow */}
        <div
          className="moment-pulse"
          style={{
            background: 'rgba(188,210,95,0.16)',
            border: '1px solid rgba(104,124,66,0.16)',
            borderRadius: 24,
            padding: '18px 20px',
            marginTop: 24,
            marginBottom: 22,
          }}
        >
          <div className="flex items-center gap-2">
            <PrimaryIcon className="h-[14px] w-[14px]" strokeWidth={1.75} style={{ color: '#6F745C' }} />
            <span
              className="uppercase"
              style={{ fontFamily: sans, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#6F745C' }}
            >
              {primary.label}
            </span>
          </div>
          <h3
            className="mt-2 text-[21px] md:text-[24px]"
            style={{ fontFamily: sans, fontWeight: 800, lineHeight: 1.2, color: '#25301F' }}
          >
            {primary.headline}
          </h3>
          <p
            className="mt-1.5 text-[15px] md:text-[16px]"
            style={{ fontFamily: sans, fontWeight: 500, lineHeight: 1.45, color: '#6F745C' }}
          >
            {primary.body}
          </p>
          <Link
            href={primary.cta.href}
            className="group mt-4 inline-flex h-[42px] items-center gap-2 rounded-full transition-transform hover:-translate-y-0.5"
            style={{
              fontFamily: sans,
              fontSize: 15,
              fontWeight: 700,
              color: '#F7F5EA',
              background: '#4F6F35',
              paddingInline: 18,
            }}
          >
            {primary.cta.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* SEKUNDÆRE STATUSPUNKTER */}
        <div>
          {secondary.map((r, i) => {
            const Icon = ICON_MAP[r.icon] ?? Sprout
            const sidste = i === secondary.length - 1
            return (
              <div
                key={r.primary}
                className={cn(
                  'group flex items-start gap-[14px] rounded-2xl px-2 py-[14px] -mx-2 transition-colors hover:bg-[rgba(40,48,32,0.035)]',
                  !sidste && 'border-b'
                )}
                style={!sidste ? { borderColor: 'rgba(40,48,32,0.06)' } : undefined}
              >
                <span
                  className="flex shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-[2px]"
                  style={{ width: 34, height: 34, background: 'rgba(111,116,92,0.09)' }}
                >
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} style={{ color: '#6B7354' }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[17px]"
                    style={{ fontFamily: sans, fontWeight: 700, lineHeight: 1.25, color: '#25301F' }}
                  >
                    {r.primary}
                  </p>
                  {r.secondary && (
                    <p
                      className="mt-0.5 text-[14.5px]"
                      style={{ fontFamily: sans, fontWeight: 500, lineHeight: 1.4, color: '#72765F' }}
                    >
                      {r.secondary}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
