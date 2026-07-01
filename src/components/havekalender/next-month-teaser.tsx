/**
 * Handoff component: compact "Kig mod næste måned" calendar ending.
 *
 * Status: built for review, not wired into the live calendar.
 *
 * Product role:
 * - A calm next-chapter teaser.
 * - Not a task list, no status, no admin actions.
 * - Later replacement candidate for the larger `NaesteMaaned` block.
 */

import Link from 'next/link'
import {
  ArrowRight,
  Droplets,
  ShoppingBasket,
  Sprout,
  Wheat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface NextMonthChip {
  label: string
  Icon: LucideIcon
}

interface NextMonthTeaserProps {
  label?: string
  monthName?: string
  subtitle?: string
  body?: string
  href?: string
  chips?: NextMonthChip[]
}

const DEFAULT_CHIPS: NextMonthChip[] = [
  { label: 'Høst ofte', Icon: ShoppingBasket },
  { label: 'Vand dybt', Icon: Droplets },
  { label: 'Så igen', Icon: Sprout },
]

export function NextMonthTeaser({
  label = 'Kig mod juli',
  monthName = 'Juli',
  subtitle = 'Høst, varme og vildskab',
  // Nød-fallback (måned-agnostisk). Den rigtige body sendes ind fra
  // kalender-client, afledt af NÆSTE måned — aldrig en statisk juli-tekst.
  body = 'Et nyt kapitel i haven venter forude.',
  href = '/kalender',
  chips = DEFAULT_CHIPS,
}: NextMonthTeaserProps) {
  return (
    <section
      aria-labelledby="next-month-teaser-title"
      style={{
        background: 'linear-gradient(135deg, #F3ECDD, #E9E2D0)',
        borderRadius: 24,
        boxShadow: '0 10px 30px rgba(36,48,31,0.08)',
        color: '#24301F',
        overflow: 'hidden',
        padding: '20px 22px 20px',
        position: 'relative',
      }}
    >
      <BotanicalGrass />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <p
          style={{
            color: 'rgba(36,48,31,0.62)',
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 850,
            letterSpacing: '0.22em',
            lineHeight: 1.2,
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </p>

        <h2
          id="next-month-teaser-title"
          style={{
            color: '#314328',
            fontFamily: serif,
            fontSize: 'clamp(46px, 13vw, 64px)',
            fontWeight: 600,
            letterSpacing: '0',
            lineHeight: 0.88,
            margin: '10px 0 8px',
          }}
        >
          {monthName}
        </h2>

        <p
          style={{
            color: 'rgba(36,48,31,0.72)',
            fontFamily: serif,
            fontSize: 20,
            fontStyle: 'italic',
            fontWeight: 500,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {subtitle}
        </p>

        <p
          style={{
            color: 'rgba(36,48,31,0.74)',
            fontFamily: sans,
            fontSize: 14.5,
            fontWeight: 500,
            lineHeight: 1.45,
            margin: '12px 0 0',
            maxWidth: 460,
          }}
        >
          {body}
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
            marginTop: 13,
          }}
        >
          {chips.map(chip => (
            <TeaserChip key={chip.label} chip={chip} />
          ))}
        </div>

        <Link
          href={href}
          style={{
            alignItems: 'center',
            color: '#3C552F',
            display: 'inline-flex',
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 800,
            gap: 9,
            marginTop: 15,
            textDecoration: 'none',
          }}
        >
          Se {monthName.toLowerCase()}
          <ArrowRight width={17} height={17} strokeWidth={1.9} aria-hidden />
        </Link>
      </div>
    </section>
  )
}

function TeaserChip({ chip }: { chip: NextMonthChip }) {
  const Icon = chip.Icon

  return (
    <span
      style={{
        alignItems: 'center',
        background: 'rgba(36,48,31,0.08)',
        borderRadius: 999,
        color: '#405B33',
        display: 'inline-flex',
        fontFamily: sans,
        fontSize: 13.5,
        fontWeight: 750,
        gap: 7,
        minHeight: 36,
        padding: '0 13px',
      }}
    >
      <Icon width={15} height={15} strokeWidth={1.9} aria-hidden />
      {chip.label}
    </span>
  )
}

function BotanicalGrass() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 210 220"
      style={{
        bottom: -10,
        color: 'rgba(91,88,52,0.20)',
        height: 152,
        pointerEvents: 'none',
        position: 'absolute',
        right: -18,
        width: 146,
      }}
    >
      <path
        d="M104 212c-2-48 1-96 10-147M137 212c-13-42-18-82-14-120M75 212c10-52 11-92 2-145"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <path
        d="M112 72c16-16 28-33 36-52M119 93c22-7 40-18 55-33M83 93C63 78 50 61 44 42M76 119c-19-4-36-13-51-28M131 126c18-4 34-12 48-25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M151 28c12 10 18 21 17 34-13-3-22-14-17-34ZM44 42c15 3 25 12 31 26-15 1-26-8-31-26ZM174 61c-1 15-8 26-21 32-3-14 5-25 21-32Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M120 60c5-10 13-16 24-19M122 82c10-5 21-8 34-7M82 82c-10-8-18-17-23-28M78 110c-13-2-24-7-34-15"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <WheatHead x={92} y={30} />
      <WheatHead x={140} y={72} />
      <WheatHead x={55} y={124} />
    </svg>
  )
}

function WheatHead({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M0 46c5-17 6-32 2-46"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      {[-2, 8, 18, 28].map((offset, i) => (
        <path
          key={offset}
          d={i % 2 === 0 ? `M2 ${offset + 10}c-8-5-13-11-15-19` : `M2 ${offset + 10}c8-5 13-11 15-19`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      ))}
    </g>
  )
}

export const NEXT_MONTH_TEASER_DEMO_CHIPS = DEFAULT_CHIPS

