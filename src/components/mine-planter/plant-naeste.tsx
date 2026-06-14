import Link from 'next/link'
import type { DetailNaeste } from '@/data/plant-detail'
import { CalendarDays, CheckCircle2, Flower2 } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * "LIGE NU — Det næste, der sker" — sidens vigtigste sektion.
 *
 * Anna (spec): "Hvis jeg skulle vælge én ting at bygge først, ville det
 * være den store redaktionelle Lige nu-sektion. Den giver siden et
 * centrum — en hovedperson. Og i en have er hovedpersonen planten."
 *
 * Foto: bløder ud til kortets kant i top, bund og højre; venstre kant er
 * ÉT stort organisk sving — samme karakter som Havebog-heroens bølge
 * (preserveAspectRatio-strakt sving der skærer ind i fotoet). Teksten er
 * bredde-begrænset så den aldrig løber under fotoet.
 */
export function PlantNaeste({
  naeste,
  kalenderHref = '/kalender',
}: {
  naeste: DetailNaeste
  kalenderHref?: string
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[22px]"
      style={{
        background: 'linear-gradient(158deg, #E8EEDD 0%, #DEE7D0 100%)',
        border: '1px solid rgba(80,104,52,0.16)',
      }}
    >
      {/* TEKST — padded, bredde-begrænset så den ikke møder fotoet. */}
      <div className="relative z-10" style={{ width: '57%', padding: '20px 0 20px 20px' }}>
        <p
          className="uppercase"
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: 'rgba(58,74,44,0.62)',
            margin: 0,
          }}
        >
          Lige nu
        </p>

        <h2
          className="mt-2"
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 'clamp(24px, 6.6vw, 29px)',
            lineHeight: 1.04,
            letterSpacing: '0.002em',
            color: '#24301F',
            margin: 0,
          }}
        >
          Det næste, der sker
        </h2>

        <p
          className="mt-2.5 flex items-start gap-2"
          style={{
            fontFamily: sans,
            fontSize: 14.5,
            fontWeight: 500,
            lineHeight: 1.4,
            color: '#36482A',
          }}
        >
          <Flower2
            className="mt-0.5 h-4 w-4 shrink-0"
            strokeWidth={2}
            style={{ color: '#5A7038' }}
            aria-hidden
          />
          {naeste.forventning}
        </p>

        <p
          className="mt-4 uppercase"
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'rgba(58,74,44,0.60)',
          }}
        >
          Hold øje med
        </p>
        <ul className="mt-2 space-y-1.5">
          {naeste.holdOjeMed.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2"
              style={{
                fontFamily: sans,
                fontSize: 13.5,
                fontWeight: 500,
                lineHeight: 1.35,
                color: '#2E3B24',
              }}
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0"
                strokeWidth={2}
                style={{ color: '#5A7038' }}
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* FOTO — bløder ud til top/bund/højre kant; organisk venstre-sving. */}
      <div className="absolute right-0 top-0 bottom-0" style={{ width: '44%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={naeste.fotoSrc}
          alt={naeste.fotoAlt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: 'url(#ligenu-organisk-ramme)' }}
        />
        <Link
          href={kalenderHref}
          className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full py-2 text-white backdrop-blur-sm transition-transform active:scale-95"
          style={{
            background: 'rgba(36,48,31,0.82)',
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Se kalender
        </Link>
      </div>

      {/* Organisk clip (objectBoundingBox 0–1): top/højre/bund flush til
          kanten, venstre kant ÉT stort elegant sving (Havebog-karakter). */}
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id="ligenu-organisk-ramme" clipPathUnits="objectBoundingBox">
            <path d="M 0.24 0
              L 1 0
              L 1 1
              L 0.09 1
              C 0.30 0.72, 0.02 0.53, 0.15 0.32
              C 0.23 0.18, 0.30 0.10, 0.24 0 Z" />
          </clipPath>
        </defs>
      </svg>
    </section>
  )
}
