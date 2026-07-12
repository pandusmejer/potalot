import Link from 'next/link'
import { Hammer, ChevronRight } from 'lucide-react'
import type { ProjektForslag } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  projekt: ProjektForslag
}

/**
 * RUM · "Næste projekt" (V19 — Annas 390px kort-spec, sektion 4).
 *
 * Større ambition som en rolig invitation, ikke en opgave. Kort med
 * tekst-venstre + tonet panel-højre.
 *
 * ⚠️ GATED: vises kun når en ægte projekt-INTENTION findes (idéboard/
 * kalender/gemt forvandling/diktafon→projekt). Ingen generiske projekter
 * til rigtige brugere. Demo-prototype indtil intentions-kilden findes.
 *
 * NB: mangler et roligt insekthotel-FOTO til højre-panelet; indtil da
 * står et tonet panel med et diskret line-ikon (ingen stock-fyld).
 */
export function Projekter({ projekt }: Props) {
  return (
    <section>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch',
          minHeight: 190,
          borderRadius: 20,
          overflow: 'hidden',
          background: '#F1E9D2',
          border: '1px solid rgba(143,148,132,0.18)',
          boxShadow: '0 10px 28px rgba(31,45,29,0.06)',
        }}
      >
        {/* Foto højre m. rund vignet — fader blødt ud i creme-boksen. Uden
            foto: tonet panel + line-ikon (ingen stock-fyld). */}
        {projekt.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={projekt.foto}
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '54%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              WebkitMaskImage: 'radial-gradient(125% 135% at 90% 50%, #000 38%, rgba(0,0,0,0) 80%)',
              maskImage: 'radial-gradient(125% 135% at 90% 50%, #000 38%, rgba(0,0,0,0) 80%)',
            }}
          />
        ) : (
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '34%', background: '#E6DBBE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hammer style={{ width: 40, height: 40, color: '#9A906F', opacity: 0.7 }} strokeWidth={1.4} aria-hidden />
          </div>
        )}

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
            <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: '#45503F', margin: 0, whiteSpace: 'pre-line' }}>
              {projekt.kontekst}
            </p>
          )}
          <Link
            href="/kalender"
            className="no-underline flex items-center"
            style={{ gap: 4, marginTop: 16, fontFamily: sans, fontSize: 13.5, fontWeight: 650, color: '#314829' }}
          >
            Åbn projekt
            <ChevronRight style={{ width: 17, height: 17 }} strokeWidth={2.4} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
