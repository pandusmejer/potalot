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
 * tekst-venstre / foto-højre split med "Vis et nyt forslag"-pillen bund-
 * justeret med fotoets underkant, en lav foto-række med små forslag, og
 * "Flere forslag →" placeret UDEN for boksen nedenunder.
 *
 * PROTOTYPE: "Vis et nyt forslag" er visuel (rotation ikke wired endnu).
 * "Flere forslag" fører til frøbanken (ægte rute). Demo-only rum; gated
 * false for indloggede indtil forslags-motoren lander. Ingen døde links.
 */
export function InspirerMig({ forslag }: Props) {
  return (
    <section>
      <div
        style={{
          marginInline: -11,
          borderRadius: 14,
          overflow: 'hidden',
          background: '#F5EEDC',
          border: '1px solid rgba(143,148,132,0.18)',
          boxShadow: '0 10px 28px rgba(31,45,29,0.06)',
        }}
      >
        {/* Top: tekst-venstre / foto-højre split. Pillen er bund-justeret,
            så dens underkant flugter med fotoets underkant. */}
        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 210 }}>
          <div style={{ flex: '0 0 53%', padding: '14px 16px 16px 22px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div>
              <p
                className="uppercase"
                style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: 0, marginBottom: 14 }}
              >
                {forslag.kicker}
              </p>
              <p
                style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(26px, 7.8cqw, 33px)', lineHeight: 0.98, letterSpacing: '-0.01em', color: '#1F2D1D', margin: 0, marginBottom: 8 }}
              >
                {forslag.navn}
              </p>
              <p
                style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, lineHeight: 1.5, color: '#45503F', margin: 0 }}
              >
                {forslag.begrundelse}
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center self-start"
              style={{ gap: 7, marginTop: 'auto', marginBottom: 0, height: 31, padding: '0 14px', borderRadius: 999, border: 'none', background: '#314829', color: '#F7F1DF', fontFamily: sans, fontSize: 12.5, fontWeight: 650, cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" stroke="#F7F1DF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Vis et nyt forslag
            </button>
          </div>

          {forslag.billede && (
            <div style={{ flex: '0 0 47%', position: 'relative', background: '#C86A4A', borderTopLeftRadius: 3, borderBottomLeftRadius: 3, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={forslag.billede}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%' }}
              />
            </div>
          )}
        </div>

        {/* Sekundære små forslag — foto-række, to linjer, ingen ikoner.
            Rykket op: ligger direkte under splittet. */}
        {forslag.forslag && forslag.forslag.length > 0 && (
          <div style={{ padding: '13px 22px 15px', borderTop: '1px solid rgba(143,148,132,0.16)', display: 'flex', gap: 12 }}>
            {forslag.forslag.slice(0, 2).map((f) => (
              <div key={f.top} className="flex items-center" style={{ gap: 11, flex: 1, minWidth: 0 }}>
                <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 10, overflow: 'hidden', background: '#E7E0CB' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: '#24301F', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.top}
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 400, color: '#7A8069', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.bund}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flere forslag — uden for boksen, justeret med kortets tekst-venstre */}
      <Link
        href="/froebank"
        className="no-underline flex items-center"
        style={{ gap: 6, marginTop: 14, marginLeft: 11, fontFamily: sans, fontSize: 13.5, fontWeight: 650, color: '#314829' }}
      >
        Flere forslag
        <span aria-hidden>→</span>
      </Link>
    </section>
  )
}
