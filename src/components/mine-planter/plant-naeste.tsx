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
 * Svarer på ét spørgsmål: hvad skal jeg gøre ved planten i dag? En
 * forventning (hvad er på vej) + en kort "hold øje med"-liste + et lille
 * foto af det der kommer. Blød salviegrøn flade — ikke en alarm-boks.
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
      className="overflow-hidden rounded-[22px]"
      style={{
        background: 'linear-gradient(158deg, #E8EEDD 0%, #DEE7D0 100%)',
        border: '1px solid rgba(80,104,52,0.16)',
        padding: 20,
      }}
    >
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

      <div className="mt-2 flex gap-4">
        {/* TEKST — forventning + hold-øje-med-liste. */}
        <div className="min-w-0 flex-1">
          <h2
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

        {/* FOTO — hvad der er på vej + Se kalender. */}
        <div className="relative w-[34%] shrink-0 self-stretch overflow-hidden rounded-[16px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={naeste.fotoSrc}
            alt={naeste.fotoAlt}
            className="absolute inset-0 h-full w-full object-cover"
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
      </div>
    </section>
  )
}
