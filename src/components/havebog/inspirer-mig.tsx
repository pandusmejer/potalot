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
 * ⚠️ ANNA-LÅST (12/7). Layout + alle mål er godkendt og må IKKE ændres
 * uden ny retning fra Anna: kort radius 14 + marginInline -11 (~3mm
 * bredere/side), overskrift Cormorant 600 clamp(26,7.8cqw,33), billedets
 * venstre hjørner 3px, "Vis et nyt forslag"-pille (h31, rgba(49,72,41,.85),
 * luft under), foto-bånd pakket venstre (padding-venstre 9), og "Flere
 * forslag" i firkantet 57×42-boks (rgba(199,209,174,.85), ingen pil).
 *
 * Ét stærkt forslag + få sekundære, som et taktilt anbefalingskort:
 * tekst-venstre / foto-højre split, en lav foto-række med små forslag
 * (to linjer: art/sort bold + sort/kvalitet), og "Flere forslag"-boks
 * yderst til højre i båndet.
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
        {/* Top: tekst-venstre / foto-højre split. Teksten er lodret centreret
            (rotationsknappen er fjernet — motoren har ikke wired rotation). */}
        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 200 }}>
          <div style={{ flex: '0 0 53%', padding: '14px 16px 16px 22px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

        {/* Sekundære små forslag — foto-række pakket til venstre, med
            "Flere forslag →" yderst til højre i samme bånd. */}
        {forslag.forslag && forslag.forslag.length > 0 && (
          <div style={{ padding: '13px 18px 15px 9px', borderTop: '1px solid rgba(143,148,132,0.16)', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 14, minWidth: 0 }}>
              {forslag.forslag.slice(0, 2).map((f) => (
                <Link key={f.top} href={f.href} className="no-underline flex items-center" style={{ gap: 11 }}>
                  <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 10, overflow: 'hidden', background: '#E7E0CB' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: '#24301F', margin: 0, whiteSpace: 'nowrap' }}>
                      {f.top}
                    </p>
                    <p style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 400, color: '#7A8069', margin: 0, whiteSpace: 'nowrap' }}>
                      {f.bund}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Flere forslag — firkantet boks yderst til højre, samme
                42×42-format som forslags-billederne, med let grøn teint. */}
            <Link
              href="/froebank"
              className="no-underline"
              style={{ marginLeft: 'auto', flexShrink: 0, width: 57, height: 42, borderRadius: 10, background: 'rgba(199,209,174,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2px 6px', fontFamily: sans, fontSize: 10, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.01em', color: '#3B4A2F' }}
            >
              Flere forslag
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
