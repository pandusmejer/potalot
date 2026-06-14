import Link from 'next/link'
import type { DetailNaeste } from '@/data/plant-detail'
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2 } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const GREEN = '#5A7038'

/**
 * LIGE NU + DENNE UGE — to kort, ikke ét.
 *
 * Anna (14. juni 2026): det gamle kort var både magasin OG tjekliste mast
 * sammen. Splittet giver begge pondus. Og baggrunden var en kold "sage
 * green" fremmedlegeme — nu varm creme (#F2F0E7), så PLANTEN leverer det
 * grønne (option A). Fotoet fylder ~60%.
 *
 *   Kort 1 (LIGE NU)   — redaktionelt: hvad sker der nu? Stor serif + foto.
 *   Kort 2 (DENNE UGE) — værktøj: ugens pleje-tjekliste + Se kalender.
 */
export function PlantNaeste({
  naeste,
  kalenderHref = '/kalender',
}: {
  naeste: DetailNaeste
  kalenderHref?: string
}) {
  return (
    <>
      {/* ── KORT 1: LIGE NU — magasin ────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-[22px]"
        style={{ background: '#F2F0E7', border: '1px solid rgba(36,48,31,0.08)', minHeight: 250 }}
      >
        {/* FOTO — ~60% højre, organisk venstre-kant; planten leverer grønt. */}
        <div className="absolute right-0 top-0 bottom-0" style={{ width: '58%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={naeste.fotoSrc}
            alt={naeste.fotoAlt}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: 'url(#ligenu-organisk-ramme)' }}
          />
        </div>

        {/* TEKST — venstre, magasin-opslag. */}
        <div className="relative z-10 flex min-h-[250px] flex-col" style={{ width: '46%', padding: '22px 0 20px 22px' }}>
          <p
            className="uppercase"
            style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(36,48,31,0.5)', margin: 0 }}
          >
            Lige nu
          </p>
          <h2
            className="mt-2.5"
            style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(30px, 8.5vw, 40px)', lineHeight: 0.98, letterSpacing: '-0.005em', color: '#24301F', margin: '10px 0 0' }}
          >
            {naeste.overskrift}
          </h2>
          <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: GREEN, margin: '8px 0 0' }}>
            {naeste.timing}
          </p>

          <div style={{ height: 1, background: 'rgba(36,48,31,0.12)', margin: '16px 0 0', maxWidth: 180 }} />

          <p
            className="max-w-[26ch]"
            style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, lineHeight: 1.45, color: 'rgba(36,48,31,0.72)', margin: '16px 0 0' }}
          >
            {naeste.beskrivelse}
          </p>

          <Link
            href={naeste.guideHref}
            className="mt-auto inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full transition-transform active:scale-95"
            style={{
              border: '1px solid rgba(36,48,31,0.18)',
              background: 'rgba(255,255,255,0.5)',
              color: '#24301F',
              fontFamily: sans,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '9px 16px',
              marginTop: 20,
            }}
          >
            <BookOpen className="h-4 w-4" strokeWidth={2} style={{ color: GREEN }} aria-hidden />
            Se guide
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        </div>

        {/* Organisk clip (objectBoundingBox): bølget venstre kant. */}
        <svg width="0" height="0" aria-hidden className="absolute">
          <defs>
            <clipPath id="ligenu-organisk-ramme" clipPathUnits="objectBoundingBox">
              <path d="M 0.18 0
                L 1 0
                L 1 1
                L 0.07 1
                C 0.26 0.72, 0.0 0.53, 0.12 0.32
                C 0.19 0.18, 0.25 0.10, 0.18 0 Z" />
            </clipPath>
          </defs>
        </svg>
      </section>

      {/* ── KORT 2: DENNE UGE — værktøj ──────────────────────── */}
      <section
        className="rounded-[22px]"
        style={{ background: '#F6F4EC', border: '1px solid rgba(36,48,31,0.08)', padding: 20 }}
      >
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(36,48,31,0.5)', margin: 0 }}
        >
          Denne uge
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {naeste.denneUge.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2"
              style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 500, lineHeight: 1.3, color: '#2E3B24' }}
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} style={{ color: GREEN }} aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-end">
          <Link
            href={kalenderHref}
            className="inline-flex items-center gap-1.5 rounded-full text-white transition-transform active:scale-95"
            style={{ background: '#24301F', fontFamily: sans, fontSize: 13, fontWeight: 600, padding: '9px 16px' }}
          >
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Se kalender
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  )
}
