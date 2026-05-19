import Link from 'next/link'
import {
  Snowflake, Sun, CloudRain, Wind, Sprout, Wheat, Droplets, Leaf,
  CalendarClock, Bug, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeWeekOverview } from '@/lib/denne-uge'
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

// Stort, blødt organisk kurve-mønster (ingen grid/dots) — lægges
// bag indholdet ved 3% opacity som en mæt, rolig tekstur.
const ORGANISK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 420'%3E%3Cpath d='M-30 120 C 140 50 260 210 410 135 C 540 70 620 170 690 145' stroke='%234A5A3A' stroke-width='2.5' fill='none'/%3E%3Cpath d='M-30 265 C 150 205 285 330 445 255 C 585 190 655 280 705 245' stroke='%234A5A3A' stroke-width='2.5' fill='none'/%3E%3Cpath d='M-30 55 C 120 25 245 105 420 65 C 560 35 655 85 705 62' stroke='%234A5A3A' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")"

interface Props {
  suggestions: WeekSuggestion[]
  alerts: GardenAlert[]
  month: number
  monthName: string
}

/**
 * "Denne uge i haven" — svarer tydeligt på "hvad er det vigtigste
 * jeg bør gøre i haven denne uge?". ÉN primær handling i en
 * fremhævet blok, derefter 2–4 mindre observationer. Aldrig en
 * neutral, ligestillet statusliste.
 */
export function DenneUge({ suggestions, alerts, month, monthName }: Props) {
  const { primary, secondary } = computeWeekOverview(suggestions, alerts, month)
  const PrimaryIcon = ICON_MAP[primary.icon] ?? Sprout

  return (
    <section
      className="relative z-10 mx-auto w-full max-w-[900px] overflow-hidden rounded-[28px] -mt-[64px]! md:-mt-[76px]!"
      style={{
        background: 'rgba(250,248,242,0.82)',
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
          backgroundImage: ORGANISK,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.03,
        }}
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

        {/* PRIMÆR UGE-HANDLING — fremhævet blok */}
        <div
          style={{
            background: 'rgba(188,210,95,0.16)',
            border: '1px solid rgba(104,124,66,0.16)',
            borderRadius: 24,
            padding: '18px 20px',
            marginTop: 28,
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
            className="group mt-4 inline-flex h-[42px] items-center gap-2 rounded-full"
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
                className={cn('flex items-start gap-[14px] py-[14px]', !sidste && 'border-b')}
                style={!sidste ? { borderColor: 'rgba(40,48,32,0.06)' } : undefined}
              >
                <span
                  className="flex shrink-0 items-center justify-center rounded-full"
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

        {/* CTA */}
        <div className="mt-5">
          <Link
            href="#aarshjul"
            className="group inline-flex h-[46px] items-center gap-2 rounded-full transition-colors"
            style={{
              fontFamily: sans,
              fontSize: 16,
              fontWeight: 700,
              color: '#25301F',
              paddingInline: 20,
              background: 'rgba(255,255,255,0.54)',
              border: '1px solid rgba(80,90,70,0.16)',
            }}
          >
            Se alle gøremål
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" style={{ color: '#6B7354' }} />
          </Link>
        </div>
      </div>
    </section>
  )
}
