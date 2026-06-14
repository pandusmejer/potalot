import Link from 'next/link'
import type { DetailNaeste } from '@/data/plant-detail'
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronRight } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const GREEN = '#5A7038'
const BLAEK = '#24301F'
/** Fælles kort-baggrund — samme varme creme som "Plantens historie".
 *  Anna (14. juni 2026): alle kort på plantesiden skal dele bagrundsfarve. */
const CREME = '#FBF8EC'
const RAMME = '1px solid rgba(36,48,31,0.08)'
const STREG = 'rgba(36,48,31,0.08)'

/**
 * LIGE NU + DENNE UGE — to kort, ikke ét.
 *
 *   Kort 1 (LIGE NU)   — redaktionelt: hvad sker der nu? Stor serif + foto.
 *   Kort 2 (DENNE UGE) — værktøj: ugens pleje som gitter + Se kalender.
 *
 * Begge kort deler den varme creme #FBF8EC; planten leverer det grønne.
 * Begge CTA'er er outline-piller (Se guide / Se kalender) — samme familie.
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
      {/* marginBottom 10 = halvt af sidens space-y-5 (20px). I dette Tailwind-
          setup lægger space-y margin-BOTTOM på ikke-sidste kort, så det er HER
          afstanden til DENNE UGE styres. Anna: blokkene hører tæt sammen. */}
      <section
        className="relative overflow-hidden rounded-[22px]"
        style={{ background: CREME, border: RAMME, minHeight: 250, marginBottom: 10 }}
      >
        {/* FOTO — ~58% højre minus 8 mm (Anna: giv cremefeltet 8 mm i alt). */}
        <div className="absolute right-0 top-0 bottom-0" style={{ width: 'calc(58% - 8mm)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={naeste.fotoSrc}
            alt={naeste.fotoAlt}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: 'url(#ligenu-organisk-ramme)' }}
          />
        </div>

        {/* TEKST — venstre, magasin-opslag (+8 mm fra fotoet). */}
        <div className="relative z-10 flex min-h-[250px] flex-col" style={{ width: 'calc(46% + 8mm)', padding: '22px 0 20px 22px' }}>
          <p
            className="uppercase"
            style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(36,48,31,0.5)', margin: 0 }}
          >
            Lige nu
          </p>
          <h2
            className="mt-2.5"
            style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(30px, 8.5vw, 40px)', lineHeight: 0.98, letterSpacing: '-0.005em', color: BLAEK, margin: '10px 0 0' }}
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
              background: 'transparent',
              color: BLAEK,
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
        style={{ background: CREME, border: RAMME, padding: 22 }}
      >
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(36,48,31,0.5)', margin: 0 }}
        >
          Denne uge
        </p>

        {/* 2×2-gitter med tynde kryds-skillelinjer (cell-borders). */}
        <ul className="mt-4 grid grid-cols-2">
          {naeste.denneUge.map((item, i) => {
            const venstre = i % 2 === 0
            const oeverste = i < 2
            return (
              <li
                key={item}
                className="flex min-w-0 items-center gap-2"
                style={{
                  paddingTop: oeverste ? 0 : 15,
                  paddingBottom: oeverste ? 15 : 0,
                  paddingRight: venstre ? 10 : 0,
                  paddingLeft: venstre ? 0 : 10,
                  borderRight: venstre ? `1px solid ${STREG}` : 'none',
                  borderBottom: oeverste ? `1px solid ${STREG}` : 'none',
                  fontFamily: sans,
                  fontSize: 13.5,
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: '#2E3B24',
                }}
              >
                <span
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: 24, height: 24, borderRadius: 999, background: '#E7ECDD' }}
                >
                  <Check className="h-[13px] w-[13px]" strokeWidth={2.5} style={{ color: GREEN }} aria-hidden />
                </span>
                <span>{item}</span>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 flex justify-end">
          <Link
            href={kalenderHref}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full transition-transform active:scale-95"
            style={{
              border: '1px solid rgba(36,48,31,0.18)',
              background: 'transparent',
              color: BLAEK,
              fontFamily: sans,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '9px 16px',
            }}
          >
            <CalendarDays className="h-4 w-4" strokeWidth={2} style={{ color: GREEN }} aria-hidden />
            Se kalender
            <ChevronRight className="h-4 w-4" strokeWidth={2} style={{ color: 'rgba(36,48,31,0.45)' }} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  )
}
