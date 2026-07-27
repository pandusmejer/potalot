'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { HaveCardData } from '@/lib/guides/min-have'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * I DIN HAVE — personligt, kurateret udvalg af GUIDE-OBJEKTER (arts- og
 * sortsguides). Genbruger den eksisterende arts-hero-familie: stort botanisk
 * foto + lyst informationspanel der er FORSKUDT og overlapper fotoets nederste
 * kant (ikke tekst-på-foto-plakat). Samme kortform for art og sort — kun chip +
 * kontekst skifter. Horisontal swipe med SUBTIL affordance: ét næsten fuldt kort
 * + ~20px flig af næste. "Se alle" er tekst-nav ved headeren, ikke et kort.
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
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
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
              fontFamily: serif,
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
        {total > cards.length && (
          <Link
            href="/guides/min-have"
            className="group shrink-0 whitespace-nowrap"
            style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: '#3D5A26' }}
          >
            Se alle {total}
            <ArrowRight
              size={14}
              strokeWidth={2}
              className="ml-1 inline-block align-[-1px] transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>

      {/* Swipe-række — bleeder til kanten, snapper. Subtil peek af næste kort. */}
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 scroll-px-5 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {cards.map(c => (
          <HaveGuideCard key={c.guideId} card={c} />
        ))}
      </div>
    </section>
  )
}

function HaveGuideCard({ card }: { card: HaveCardData }) {
  return (
    <Link
      href={`/guides/${card.guideId}`}
      className="group block shrink-0 snap-start no-underline"
      style={{ width: '80%', color: 'inherit' }}
    >
      <article className="relative">
        {/* Foto — bærer kortet (samme radius/overlay som arts-heroes) */}
        <div
          className="relative h-[208px] overflow-hidden rounded-[26px] bg-[#EAE6D8]"
          style={{ border: '1px solid rgba(45,42,36,0.08)' }}
        >
          {card.imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imageSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-24"
            style={{
              background: 'linear-gradient(180deg, rgba(20,14,8,0) 0%, rgba(20,14,8,0.28) 100%)',
            }}
          />
          {/* Type-chip — kun art/sort. Ingen anden tekst på fotoet. */}
          <span
            className="absolute left-3 top-3 inline-flex items-center rounded-full"
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '5px 12px',
              background: 'rgba(250,247,237,0.82)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(86,111,60,0.14)',
              color: '#4E6138',
            }}
          >
            {card.typeLabel}
          </span>
        </div>

        {/* Forskudt lyst infopanel — overlapper fotoets nederste kant */}
        <div
          className="relative z-10 -mt-12 ml-4 mr-4 flex items-start gap-3 rounded-[24px] border px-5 pb-4 pt-[10px]"
          style={{ background: 'rgba(244,240,229,0.96)', borderColor: 'rgba(45,42,36,0.09)' }}
        >
          <div className="min-w-0 flex-1">
            <h3
              style={{
                fontFamily: plex,
                fontWeight: 600,
                fontSize: 26,
                lineHeight: 0.98,
                letterSpacing: '-0.02em',
                color: '#242019',
                margin: 0,
              }}
            >
              {card.title}
            </h3>
            <p
              style={{
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: 600,
                color: '#7F8F6A',
                margin: '4px 0 0',
              }}
            >
              {card.contextLine}
            </p>
            {card.summary && (
              <p
                className="line-clamp-1"
                style={{
                  fontFamily: sans,
                  fontSize: 13.5,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: '#6A665C',
                  margin: '8px 0 0',
                }}
              >
                {card.summary}
              </p>
            )}
          </div>
          <div
            className="shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            style={{ marginTop: 5, color: '#7F8F6A' }}
          >
            <ArrowRight size={18} strokeWidth={1.75} />
          </div>
        </div>
      </article>
    </Link>
  )
}
