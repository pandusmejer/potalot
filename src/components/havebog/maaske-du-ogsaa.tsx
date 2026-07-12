import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { InspirerForslag } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  forslag: NonNullable<InspirerForslag['sekundaer']>
  billede?: string
}

/**
 * RUM · "Måske du også vil prøve" (V19 — Annas 390px kort-spec, sektion 2).
 *
 * Handlingsnært hint, bevidst ANDERLEDES end "Prøv næste år": intet hårdt
 * split-panel, men et foto der bløder ind fra højre under en creme-gradient
 * — roligere, mere editorial. Destination: Forvandlinger/guide ("Se hvordan").
 *
 * PROTOTYPE: demo-only rum (samme forslags-motor som Inspirér mig mangler).
 * Gated false for indloggede. "Se hvordan" er visuel indtil ruten findes.
 */
export function MaaskeDuOgsaa({ forslag, billede }: Props) {
  return (
    <section>
      <div
        style={{
          position: 'relative',
          marginInline: -11,
          borderRadius: 14,
          overflow: 'hidden',
          minHeight: 200,
          background: '#F4EEDC',
          border: '1px solid rgba(143,148,132,0.18)',
          boxShadow: '0 10px 28px rgba(31,45,29,0.06)',
        }}
      >
        {billede && (
          // Fuldt foto — fylder hele boksen. Billedets egen rolige creme-
          // venstreside bærer teksten, så ingen gradient er nødvendig.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={billede}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        )}

        <div style={{ position: 'relative', padding: 22, maxWidth: '62%' }}>
          <p
            className="uppercase"
            style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: 0, marginBottom: 13, whiteSpace: 'nowrap' }}
          >
            {forslag.kicker}
          </p>
          <p
            style={{ fontFamily: serif, fontWeight: 700, fontSize: 'clamp(24px, 7.2cqw, 30px)', lineHeight: 1, letterSpacing: '-0.01em', color: '#1F2D1D', margin: 0, marginBottom: 13 }}
          >
            {forslag.titel}
          </p>
          <p
            style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, lineHeight: 1.5, color: '#45503F', margin: 0, whiteSpace: 'pre-line' }}
          >
            {forslag.tekst}
          </p>
          <Link
            href="/havebog/forvandlinger"
            className="no-underline flex items-center"
            style={{ gap: 4, marginTop: 18, fontFamily: sans, fontSize: 13.5, fontWeight: 650, color: '#314829' }}
          >
            Se hvordan
            <ChevronRight style={{ width: 17, height: 17 }} strokeWidth={2.4} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
