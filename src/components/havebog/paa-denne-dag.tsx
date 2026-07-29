import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import type { OnThisDayEntry } from '@/data/havebog-demo'
import { laantErfaring } from '@/lib/havevisdom'
import { aktuelMaaned } from '@/lib/datetime'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  entries: OnThisDayEntry[]
}

/**
 * Kapitel 2: "På denne dag" — sæsonhukommelsen (V7 + overlay/destination-regel).
 *
 * ⚠️ ANNA-LÅST 12/7 — layout/mål/overlay/destination godkendt; rør ikke uden
 * ny retning.
 *
 * FOTO DOMINERER: ét billede, én historie, aldrig et galleri.
 *
 * LÆSBARHEDS-REGEL: overlay-teksten må ALDRIG afhænge af, at fotoet tilfældigt
 * er mørkt nok. Der ligger altid et fast overlay-system ovenpå (mørk bund- +
 * venstre-gradient + let global scrim), så tekst er læsbar uanset brugerens
 * foto. Er et foto stadig for lyst, kan `overlayStrength="strong"` sættes
 * (ingen pixel-analyse i første omgang).
 *
 * DESTINATIONS-REGEL: "På denne dag" er et tilbageblik MED kilde, ikke et
 * generisk stemningskort. Hele kortet er et link til mindet (plantens timeline
 * i dag; minde-/arkiv-ruter senere). Uden href skjules modulet for rigtige
 * brugere (kuratoren) — demo bruger en mock-href til preview.
 */
export function PaaDenneDag({ entries }: Props) {
  const entry = entries.find(e => e.imageUrl) ?? entries[0] ?? null

  return (
    <section>
      {entry === null ? (
        <FotoMedHistorie
          src="/images/havebog/paa-denne-dag.jpg"
          kicker="Fra fællesskabet"
          historie={laantErfaring(aktuelMaaned()).paaDenneDag}
          sekundaer="Dine egne minder samles her, efterhånden som sæsonen skrider frem."
        />
      ) : entry.imageUrl ? (
        <FotoMedHistorie
          src={entry.imageUrl}
          kicker={entry.yearsAgo === 1 ? 'Sidste år' : `${entry.yearsAgo} år siden`}
          historie={historieTekst(entry)}
          href={entry.href ?? null}
        />
      ) : (
        // Historie uden billede: stor stille tekst — fotoreglen siger
        // at vi IKKE henter et tilfældigt foto bare for at fylde.
        <blockquote style={{ margin: 0, paddingBlock: '8px 4px' }}>
          <p
            className="uppercase"
            style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(36,48,31,0.5)', margin: 0, marginBottom: 6 }}
          >
            På denne dag
          </p>
          <p
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(36,48,31,0.42)',
              margin: 0,
              marginBottom: 12,
            }}
          >
            {entry.yearsAgo === 1 ? 'Sidste år' : `${entry.yearsAgo} år siden`}
          </p>
          <p
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(21px, 4.4cqw, 28px)',
              lineHeight: 1.3,
              color: 'rgba(36,48,31,0.80)',
              margin: 0,
              maxWidth: '26ch',
            }}
          >
            {historieTekst(entry)}
          </p>
        </blockquote>
      )}
    </section>
  )
}

function historieTekst(entry: OnThisDayEntry): string {
  if (entry.text) return entry.text
  return entry.variety ? `${entry.plantName} ${entry.variety}` : entry.plantName
}

/**
 * Fast overlay-system — mørk bund + mørk venstre + let global scrim. Sikrer
 * læsbar tekst uanset brugerens foto. `strong` bruges når et foto er for lyst.
 */
const OVERLAY: Record<'normal' | 'strong', string> = {
  normal:
    'linear-gradient(180deg, rgba(31,45,29,0.10) 0%, rgba(31,45,29,0.18) 35%, rgba(31,45,29,0.72) 100%),' +
    'linear-gradient(90deg, rgba(31,45,29,0.68) 0%, rgba(31,45,29,0.38) 46%, rgba(31,45,29,0.06) 100%),' +
    'linear-gradient(rgba(31,45,29,0.05), rgba(31,45,29,0.05))',
  strong:
    'linear-gradient(180deg, rgba(31,45,29,0.14) 0%, rgba(31,45,29,0.30) 35%, rgba(31,45,29,0.82) 100%),' +
    'linear-gradient(90deg, rgba(31,45,29,0.76) 0%, rgba(31,45,29,0.48) 46%, rgba(31,45,29,0.10) 100%),' +
    'linear-gradient(rgba(31,45,29,0.08), rgba(31,45,29,0.08))',
}

/**
 * Det ene billede med den ene historie. Fuldt foto-kort med fast overlay,
 * label øverst-venstre, historie + "Se minde"-CTA nederst. Hele kortet er
 * klikbart når der findes en destination (href).
 */
function FotoMedHistorie({
  src,
  kicker,
  historie,
  sekundaer,
  href = null,
  overlayStrength = 'normal',
}: {
  src: string
  kicker: string
  historie: string
  sekundaer?: string
  href?: string | null
  overlayStrength?: 'normal' | 'strong'
}) {
  const kortStyle = { marginInline: -11, height: 290, borderRadius: 14 } as const

  const indhold = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img loading="lazy" decoding="async"
        src={src}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.94)' }}
      />
      {/* Fast overlay-system — læsbarhed uanset foto */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: OVERLAY[overlayStrength] }} />

      {/* Label øverst-venstre — PÅ DENNE DAG + kicker, samme vægt/str. */}
      <div className="absolute left-0 top-0 z-10" style={{ padding: '22px 24px 0' }}>
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(244,239,220,0.92)', textShadow: '0 1px 8px rgba(0,0,0,0.22)', margin: 0 }}>
          På denne dag
        </p>
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(244,239,220,0.92)', textShadow: '0 1px 8px rgba(0,0,0,0.22)', margin: 0, marginTop: 4 }}>
          {kicker}
        </p>
      </div>

      {/* Safe text area nederst-venstre — historie (maks ~280px / 4-5 linjer) */}
      <div className="absolute inset-x-0 bottom-0 z-10" style={{ padding: '0 24px 22px' }}>
        <p
          style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(19px, 3.9cqw, 26px)', lineHeight: 1.3, color: 'rgba(244,239,220,0.97)', textShadow: '0 1px 12px rgba(0,0,0,0.28)', margin: 0, maxWidth: 280 }}
        >
          {historie}
        </p>
        {sekundaer && (
          <p
            style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(14px, 2.7cqw, 16px)', lineHeight: 1.45, color: 'rgba(244,239,220,0.74)', textShadow: '0 1px 12px rgba(0,0,0,0.28)', margin: 0, marginTop: 10, maxWidth: 280 }}
          >
            {sekundaer}
          </p>
        )}
        {href && (
          <span
            className="inline-flex items-center"
            style={{ gap: 7, marginTop: 14, height: 34, padding: '0 14px', borderRadius: 999, background: 'rgba(31,45,29,0.5)', border: '1px solid rgba(247,241,223,0.22)', color: 'rgba(247,241,223,0.95)', fontFamily: sans, fontSize: 12.5, fontWeight: 650 }}
          >
            <CalendarDays style={{ width: 15, height: 15 }} strokeWidth={2} aria-hidden />
            Se minde
          </span>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`Se minde fra ${kicker.toLowerCase()}: ${historie}`}
        className="relative block overflow-hidden no-underline"
        style={kortStyle}
      >
        {indhold}
      </Link>
    )
  }
  return (
    <div className="relative overflow-hidden" style={kortStyle}>
      {indhold}
    </div>
  )
}
