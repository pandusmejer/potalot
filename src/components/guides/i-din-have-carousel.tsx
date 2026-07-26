'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { HaveCardData } from '@/lib/guides/min-have'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * I DIN HAVE — personligt, kurateret udvalg af GUIDE-OBJEKTER (arts- og
 * sortsguides), IKKE et artsindeks med sorter som chips. Horisontal swipe:
 * ~1,15 kort synligt, så næste kort antyder at rækken fortsætter. Ingen dots/
 * pile (Anna 25/7). Billedtypen bærer hierarkiet: artsfoto = art, plantekort =
 * brugerens konkrete sort. "Se alle" er tekst-nav ved rækken, ikke et 5. kort.
 */
export function IDinHaveCarousel({
  cards,
  total,
}: {
  cards: HaveCardData[]
  total: number
}) {
  return (
    <section className="relative -mt-2">
      <div className="mb-3">
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.85)',
            margin: 0,
          }}
        >
          I din have
        </p>
        <p
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontStyle: 'italic',
            fontSize: 15.5,
            lineHeight: 1.3,
            color: 'rgba(36,48,31,0.58)',
            margin: '5px 0 0',
          }}
        >
          Udvalgt til det, du dyrker.
        </p>
      </div>

      {/* Swipe-række — bleeder til kanten, kort snapper. */}
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {cards.map(c => (
          <HaveGuideCard key={c.guideId} card={c} />
        ))}
      </div>

      {total > cards.length && (
        <Link
          href="/guides/min-have"
          className="group mt-3 inline-flex items-center gap-1.5"
          style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: '#3D5A26' }}
        >
          Se alle {total} guides til din have
          <ArrowRight
            size={15}
            strokeWidth={2}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </section>
  )
}

function HaveGuideCard({ card }: { card: HaveCardData }) {
  const isVar = card.kind === 'variety'
  return (
    <Link
      href={`/guides/${card.guideId}`}
      className="group relative shrink-0 snap-start overflow-hidden no-underline"
      style={{
        width: '78%',
        aspectRatio: '3 / 3.4',
        borderRadius: 20,
        border: '1px solid rgba(45,42,36,0.10)',
        background: '#EAE6D8',
        color: 'inherit',
      }}
    >
      {card.imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(24,20,14,0.04) 30%, rgba(24,20,14,0.72) 100%)',
        }}
      />
      {/* Type-badge — art vs sort, så feed'et er læsbart selv med blandede kort */}
      <span
        className="absolute left-3.5 top-3.5"
        style={{
          fontFamily: sans,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isVar ? '#3D5A26' : '#6B5635',
          background: 'rgba(246,243,235,0.92)',
          borderRadius: 999,
          padding: '4px 9px',
        }}
      >
        {isVar ? 'Sortsguide' : 'Artsguide'}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <h3
          style={{
            fontFamily: plex,
            fontWeight: 600,
            fontSize: 'clamp(24px, 8cqw, 30px)',
            lineHeight: 0.98,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 14px rgba(20,14,8,0.5)',
          }}
        >
          {card.title}
        </h3>
        <p
          className="mt-1"
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            margin: 0,
          }}
        >
          {card.subtitle}
        </p>
      </div>
    </Link>
  )
}
