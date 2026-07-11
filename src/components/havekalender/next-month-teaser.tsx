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
import { ArrowRight } from 'lucide-react'
import { MONTHS_DA } from '@/lib/constants'
import { MAANEDS_STEMNING } from '@/lib/maaneds-stemning'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface NextMonthTeaserProps {
  /** Kalenderens AKTUELLE måned (1-12). Teaseren viser ALTID currentMonth+1
   *  — aldrig samme måned som topheroen. */
  currentMonth?: number
  href?: string
  /** Valgfri override; ellers afledt af NÆSTE måneds hero-foto. */
  heroImage?: string
}

export function NextMonthTeaser({
  currentMonth = 7,
  href = '/kalender',
  heroImage,
}: NextMonthTeaserProps) {
  // Produktregel: "Kig mod [måned]" er ALTID næste måned relativt til
  // kalenderens aktuelle måned — aldrig samme som topheroen. Alt (label,
  // titel, subtitle, body, hero, CTA) afledes derfor af nextMonth.
  const nextMonth = currentMonth >= 12 ? 1 : currentMonth + 1
  const monthName = MONTHS_DA[nextMonth - 1]?.full ?? 'Juli'
  // Eyebrow uden måneden — den store titel nedenunder bærer måneden (ingen dublet).
  const label = 'Kig mod'
  const subtitle = MAANEDS_STEMNING[nextMonth]?.tagline ?? ''
  // Kun FØRSTE sætning som teaser — hele månedens tekst ligger bag "Se [måned]".
  // Holder kortet kompakt uanset hvor lang måneds-beskrivelsen er.
  const fullBody = MAANEDS_STEMNING[nextMonth]?.description ?? ''
  const body = fullBody.match(/^[^.]*\./)?.[0] ?? fullBody
  const heroSrc =
    heroImage ?? `/images/heroes-maaneder/hero-${monthName.toLowerCase()}-foto.png`
  return (
    <section
      aria-labelledby="next-month-teaser-title"
      style={{
        background: 'linear-gradient(135deg, #F3ECDD, #E9E2D0)',
        borderRadius: 24,
        boxShadow: '0 10px 30px rgba(36,48,31,0.08)',
        color: '#24301F',
        overflow: 'hidden',
        padding: '24px 22px 26px',
        position: 'relative',
      }}
    >
      {/* Diskret hero-preview af næste måned i højre side — fader blødt mod
          venstre, så teksten dominerer og fotoet kun ANES som stemning. */}
      <HeroPreview src={heroSrc} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '66%' }}>
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
            fontSize: 'clamp(56px, 16vw, 80px)',
            fontWeight: 600,
            letterSpacing: '0',
            lineHeight: 0.86,
            margin: '12px 0 10px',
          }}
        >
          {monthName}
        </h2>

        <p
          style={{
            color: 'rgba(36,48,31,0.72)',
            fontFamily: serif,
            fontSize: 22,
            fontStyle: 'italic',
            fontWeight: 500,
            lineHeight: 1.15,
            margin: '2mm 0 0',
            whiteSpace: 'nowrap',
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
            margin: '14px 0 0',
            maxWidth: 460,
          }}
        >
          {body}
        </p>
      </div>

      {/* CTA højrestillet ift. HELE boksen (ikke tekstkolonnen), så den
          bevidst overlapper hero-billedet i højre side. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 20,
          position: 'relative',
          zIndex: 1,
        }}
      >
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

/**
 * Diskret hero-preview af næste måned i højre side af kortet. Fotoet fader
 * blødt mod venstre (mask), så det kun ANES som stemning bag den lyse
 * cremeflade, og teksten til venstre dominerer. Bleeder til kortkanten via
 * negative offsets (modvirker section-padding) og klippes af kortets runding
 * (overflow:hidden på section'en).
 */
function HeroPreview({ src }: { src: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: -24,
        right: -22,
        bottom: -26,
        left: -22,
        zIndex: 0,
        pointerEvents: 'none',
        // Diagonal/organisk fade: to creme-overlays (radial + skrå linear)
        // oven på fotoet — ikke en lodret gardin-kant. Fotoet anes kun i højre
        // ~25-30%; venstre er ren creme bag teksten. Fade skråner blødt ned
        // mod højre (begynder ~60% øverst, ~66-68% nederst).
        background:
          'radial-gradient(120% 105% at 10% 58%, rgba(246,241,230,0.98) 0%, rgba(246,241,230,0.9) 44%, rgba(246,241,230,0.5) 64%, rgba(246,241,230,0.14) 78%, rgba(246,241,230,0) 90%),' +
          'linear-gradient(100deg, rgba(246,241,230,1) 0%, rgba(246,241,230,1) 50%, rgba(246,241,230,0.72) 65%, rgba(246,241,230,0.24) 79%, rgba(246,241,230,0) 90%),' +
          `url('${src}') center / cover no-repeat`,
      }}
    />
  )
}

