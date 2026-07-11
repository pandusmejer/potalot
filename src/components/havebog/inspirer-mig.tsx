import Link from 'next/link'
import type { InspirerForslag } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  forslag: InspirerForslag
}

/**
 * RUM · "Prøv næste år" (V19 — Annas 390px kort-spec).
 *
 * Ét stærkt forslag + få sekundære, som et taktilt anbefalingskort:
 * tekst-venstre / foto-højre split, en diskret "Vis et nyt forslag"-pille,
 * "Flere forslag →", og en lav thumbnail-række med små forslag. Ikke et
 * feed — ét nedslag ad gangen, kurateret ud fra frøbank/planter/sæson.
 *
 * PROTOTYPE: "Vis et nyt forslag" er visuel (rotation ikke wired endnu).
 * "Flere forslag" fører til frøbanken (ægte rute). Demo-only rum; gated
 * false for indloggede indtil forslags-motoren lander. Ingen døde links.
 *
 * "Måske du også vil prøve" (forslag.sekundaer) bliver sin EGEN sektion i
 * næste slice og rendres bevidst ikke her.
 */
export function InspirerMig({ forslag }: Props) {
  return (
    <section>
      <div
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          background: '#F5EEDC',
          border: '1px solid rgba(143,148,132,0.18)',
          boxShadow: '0 10px 28px rgba(31,45,29,0.06)',
        }}
      >
        {/* Top: tekst-venstre / foto-højre split */}
        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 210 }}>
          <div style={{ flex: '0 0 53%', padding: '22px 16px 18px 22px', minWidth: 0 }}>
            <p
              className="uppercase"
              style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: 0, marginBottom: 16 }}
            >
              {forslag.kicker}
            </p>
            <p
              style={{ fontFamily: serif, fontWeight: 500, fontSize: 'clamp(30px, 9cqw, 38px)', lineHeight: 0.98, letterSpacing: '-0.01em', color: '#1F2D1D', margin: 0, marginBottom: 16 }}
            >
              {forslag.navn}
            </p>
            <p
              style={{ fontFamily: sans, fontSize: 14, fontWeight: 400, lineHeight: 1.55, color: '#45503F', margin: 0 }}
            >
              {forslag.begrundelse}
            </p>
          </div>

          {forslag.billede && (
            <div style={{ flex: '0 0 47%', position: 'relative', background: '#C86A4A' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={forslag.billede}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%' }}
              />
            </div>
          )}
        </div>

        {/* CTA-række */}
        <div style={{ padding: '4px 22px 0' }}>
          <button
            type="button"
            className="inline-flex items-center"
            style={{ gap: 8, height: 40, padding: '0 18px', borderRadius: 999, border: 'none', background: '#314829', color: '#F7F1DF', fontFamily: sans, fontSize: 13.5, fontWeight: 650, cursor: 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" stroke="#F7F1DF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Vis et nyt forslag
          </button>
          <Link
            href="/froebank"
            className="no-underline flex items-center"
            style={{ gap: 6, marginTop: 14, fontFamily: sans, fontSize: 13.5, fontWeight: 650, color: '#314829' }}
          >
            Flere forslag
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Sekundære små forslag — lav thumbnail-række */}
        {forslag.forslag && forslag.forslag.length > 0 && (
          <div
            style={{ marginTop: 18, padding: '14px 22px 18px', borderTop: '1px solid rgba(143,148,132,0.16)', display: 'flex', gap: 12 }}
          >
            {forslag.forslag.slice(0, 2).map((f) => (
              <div key={f.navn} className="flex items-center" style={{ gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, background: '#E7E0CB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {f.glyph && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.glyph} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 650, color: '#2C3826', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.navn}
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 400, color: '#7A8069', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
