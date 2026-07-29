import Link from 'next/link'
import { ChevronRight, Sprout, Bug, Leaf, ShoppingBasket, Home, CalendarDays } from 'lucide-react'
import type { ProjektForslag, ProjektKilde, ProjektKategori } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  projekt: ProjektForslag
}

/** Kategori → diskret line-ikon til soft-illustration-mode. */
const KATEGORI_IKON: Record<ProjektKategori, typeof Sprout> = {
  biodiversitet: Bug,
  toerring: Leaf,
  froe: Sprout,
  mad: ShoppingBasket,
  byggeri: Home,
  kalender: CalendarDays,
}

/** CTA-verbum pr. kilde — normaliseret til roligt "Åbn projekt" undtagen
 *  hvor et andet verbum er tydeligt mere præcist (opgave/optagelse). */
function ctaLabel(kilde?: ProjektKilde): string {
  switch (kilde) {
    case 'calendarTask': return 'Åbn opgave'
    case 'voiceNote': return 'Se optagelse'
    default: return 'Åbn projekt'
  }
}

/**
 * RUM · "Næste projekt" (V20 — systemisk, ikke foto-afhængigt).
 *
 * ⚠️ ANNA-LÅST 12/7 — 3 visual states + kilde-copy/CTA godkendt; rør ikke
 * uden ny retning.
 *
 * Havebog er den pæne side og må ALDRIG afhænge af et perfekt brugerfoto.
 * Kortet har derfor tre ligeværdige visual states — teksten bærer altid:
 *   A. photo             — kun hvis fotoet er EGNET (kurateret/vurderet).
 *   B. soft-illustration — DEFAULT når intet/uegnet foto: kategori-line-ikon.
 *   C. color-field       — fallback uden foto/kategori: blød dekorativ form.
 * Ingen "manglende billede"-placeholder, intet gråt felt, intet kamera-ikon.
 *
 * ⚠️ GATED: vises kun ved ægte, bruger-initieret projekt-INTENTION (idéboard/
 * kalender/gemt forvandling/diktafon→projekt/manuelt). Findes ingen kilde →
 * modulet skjules helt. Kilde bestemmer kontekst-copy + CTA-verbum.
 */
export function Projekter({ projekt }: Props) {
  const mode: 'photo' | 'soft-illustration' | 'color-field' =
    projekt.foto ? 'photo' : projekt.kategori ? 'soft-illustration' : 'color-field'

  const background =
    mode === 'soft-illustration'
      ? 'linear-gradient(135deg, #F5EEDC 0%, #EFE6D2 100%)'
      : mode === 'color-field'
        ? '#F2EAD8'
        : '#F1E9D2'

  const Ikon = projekt.kategori ? KATEGORI_IKON[projekt.kategori] : Sprout

  return (
    <section>
      <div
        style={{
          position: 'relative',
          minHeight: 190,
          marginInline: -11,
          borderRadius: 14,
          overflow: 'hidden',
          background,
          border: '1px solid rgba(143,148,132,0.18)',
          boxShadow: '0 10px 28px rgba(31,45,29,0.06)',
        }}
      >
        {/* A · photo — foto bag hele kortet + bred creme-dissolve (ingen split) */}
        {mode === 'photo' && projekt.foto && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async"
              src={projekt.foto}
              alt=""
              aria-hidden
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%' }}
            />
            <div
              aria-hidden
              style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #F1E9D2 0%, #F1E9D2 30%, rgba(241,233,210,0.72) 50%, rgba(241,233,210,0.28) 66%, rgba(241,233,210,0) 82%)' }}
            />
          </>
        )}

        {/* B · soft-illustration — diskret kategori-line-ikon som baggrunds-
            atmosfære, trukket mod højre/ned så teksten får ro. */}
        {mode === 'soft-illustration' && (
          <Ikon
            aria-hidden
            style={{ position: 'absolute', right: -8, bottom: 2, width: 130, height: 130, color: '#8F9484', opacity: 0.12 }}
            strokeWidth={1.1}
          />
        )}

        {/* C · color-field — bevidst grafisk fallback: blødt tonalt felt +
            en rolig Sprout (ikke tom, ikke "manglende billede"). */}
        {mode === 'color-field' && (
          <>
            <div
              aria-hidden
              style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 82% 58%, rgba(143,148,132,0.18) 0%, rgba(143,148,132,0.10) 32%, rgba(143,148,132,0.04) 58%, rgba(143,148,132,0) 76%)' }}
            />
            <Sprout aria-hidden style={{ position: 'absolute', right: 42, bottom: 34, width: 48, height: 48, color: '#8F9484', opacity: 0.20 }} strokeWidth={1.7} />
          </>
        )}

        {/* Tekst bærer altid kortet — samme struktur i alle tre states */}
        <div style={{ position: 'relative', zIndex: 1, padding: 22, maxWidth: '62%' }}>
          <p
            className="uppercase"
            style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: 0, marginBottom: 16 }}
          >
            {projekt.kicker}
          </p>
          <p
            style={{ fontFamily: serif, fontWeight: 500, fontSize: 'clamp(30px, 9cqw, 40px)', lineHeight: 0.98, letterSpacing: '-0.01em', color: '#1F2D1D', margin: 0, marginBottom: 14, maxWidth: '10ch' }}
          >
            {projekt.titel}
          </p>
          {projekt.kontekst && (
            <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, lineHeight: 1.48, color: '#45503F', margin: 0, whiteSpace: 'pre-line' }}>
              {projekt.kontekst}
            </p>
          )}
          <Link
            href="/kalender"
            className="no-underline flex items-center"
            style={{ gap: 4, marginTop: 16, fontFamily: sans, fontSize: 13.5, fontWeight: 650, color: '#314829' }}
          >
            {ctaLabel(projekt.kilde)}
            <ChevronRight style={{ width: 17, height: 17 }} strokeWidth={2.4} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
