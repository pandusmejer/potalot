/**
 * HavehistorieKort — Havebogens venteværelse-indgang til det redaktionelle lag.
 *
 * "Mens haven passer sig selv": ét stort kort der inviterer til at læse, mens
 * haven gør sit. Ingen flueben, ingen statuschip, ingen "gør dette nu"-CTA —
 * det er en redaktionel invitation, ikke en opgave (jf. havebog.md's lobby-regel
 * og "Byg en havejournal, ikke et dashboard").
 *
 * Ingen foto endnu → roligt farvefelt i det grønne register. Når historien får
 * en hero-asset, kan kortet skifte til foto+overlay som PaaDenneDag.
 *
 * ⚠️ Ikke wired ind i havebog-kuratoren endnu. Vises kun i stilprøven.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SERIE_LABEL, type Havehistorie } from '@/data/havehistorier'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

export function HavehistorieKort({
  historie,
  href,
  /** Vis "Mens haven passer sig selv"-etiketten over kortet (venteværelse-rammen). */
  medRamme = true,
}: {
  historie: Havehistorie
  href: string
  medRamme?: boolean
}) {
  return (
    <section>
      {medRamme && (
        <p
          className="uppercase"
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'rgba(36,48,31,0.44)',
            margin: '0 0 12px',
          }}
        >
          Mens haven passer sig selv
        </p>
      )}

      <Link
        href={href}
        className="relative block overflow-hidden no-underline"
        style={{
          marginInline: -11,
          borderRadius: 16,
          padding: '26px 24px 22px',
          background:
            'radial-gradient(120% 100% at 12% 0%, rgba(122,132,95,0.20) 0%, rgba(122,132,95,0) 60%), ' +
            'linear-gradient(155deg, #3B4A2E 0%, #2C3823 100%)',
          border: '1px solid rgba(247,241,223,0.10)',
        }}
      >
        {/* serie + læsetid */}
        <div className="flex items-center" style={{ gap: 9, marginBottom: 16 }}>
          <span
            className="uppercase"
            style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(233,226,201,0.72)' }}
          >
            {SERIE_LABEL[historie.series]}
          </span>
          <span aria-hidden style={{ color: 'rgba(233,226,201,0.4)' }}>·</span>
          <span
            className="uppercase"
            style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(233,226,201,0.72)' }}
          >
            {historie.readingTimeMinutes} min
          </span>
        </div>

        {/* titel */}
        <h3
          style={{
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 'clamp(28px, 8cqw, 36px)',
            lineHeight: 1.1,
            color: 'rgba(247,242,228,0.98)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {historie.title}
        </h3>

        {/* manchet */}
        <p
          style={{
            fontFamily: serif,
            fontSize: 17,
            lineHeight: 1.5,
            color: 'rgba(233,226,201,0.82)',
            margin: '14px 0 0',
            maxWidth: '34ch',
          }}
        >
          {historie.summary}
        </p>

        {/* diskret læse-affordance, ikke en handlings-CTA */}
        <span
          className="inline-flex items-center"
          style={{ gap: 7, marginTop: 18, fontFamily: sans, fontSize: 13, fontWeight: 650, color: 'rgba(247,242,228,0.9)' }}
        >
          Læs historien
          <ArrowRight style={{ width: 15, height: 15 }} strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </section>
  )
}
