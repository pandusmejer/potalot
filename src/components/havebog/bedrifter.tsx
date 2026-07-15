import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Bedrift } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  bedrifter: Bedrift[]
}

/** Soft glyph pr. milepæl-TYPE (ikke pr. afgrøde) — Potalots egne glyffer. */
const KIND_GLYPH: Record<Bedrift['kind'], string> = {
  saaning: '/images/glyphs/saaning.png',
  spiring: '/images/glyphs/plante.png',
  udplantning: '/images/glyphs/udplantning.png',
  hoest: '/images/glyphs/hoestkurv.png',
  beskaering: '/images/glyphs/beskarersaks.png',
  skadedyr: '/images/glyphs/bille.png',
  afsluttet: '/images/glyphs/havebog.png',
  drivhus: '/images/glyphs/drivhus.png',
  blomst: '/images/glyphs/blomster.png',
}

/**
 * RUM · "Første gange" (V19 — Annas 390px kort-spec, sektion 8).
 *
 * ⚠️ ANNA-LÅST 12/7 — timeline + soft glyphs pr. milepælstype godkendt; rør
 * ikke uden ny retning. (Motor/deriver mangler stadig — se backlog.)
 *
 * Milepæle som mærker i en botanisk bog — ikke badges, ikke achievements,
 * ikke XP. Timeline-PREVIEW: max 4 beviselige førster (titel + årstal +
 * diskret line-ikon), forbundet af en tynd lodret streg. Flere i Profil
 * ("Se alle milepæle →"). Kun log-typer der findes vises (ærligheds-reglen).
 */
export function Bedrifter({ bedrifter }: Props) {
  const vist = bedrifter.slice(0, 4)
  return (
    <section>
      <div
        style={{
          marginInline: -11,
          borderRadius: 14,
          background: '#F5EEDC',
          border: '1px solid rgba(143,148,132,0.18)',
          boxShadow: '0 10px 28px rgba(31,45,29,0.06)',
          padding: 22,
        }}
      >
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: 0, marginBottom: 20 }}
        >
          Første gange
        </p>

        <div style={{ position: 'relative' }}>
          {/* Lodret streg fra første til sidste ikon-center (16px = 32/2). */}
          <div aria-hidden style={{ position: 'absolute', left: 16, top: 16, bottom: 16, width: 1, background: 'rgba(143,148,132,0.28)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {vist.map((b, i) => (
                <div key={i} className="flex items-center" style={{ gap: 14, position: 'relative' }}>
                  <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 999, background: '#F5EEDC', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={KIND_GLYPH[b.kind]} alt="" style={{ width: 27, height: 27, objectFit: 'contain' }} />
                  </div>
                  <p style={{ fontFamily: serif, fontWeight: 500, fontSize: 'clamp(21px, 5.6cqw, 25px)', lineHeight: 1.05, color: '#1F2D1D', margin: 0, flex: 1, minWidth: 0 }}>
                    {b.titel}
                  </p>
                  <span style={{ flexShrink: 0, fontFamily: sans, fontSize: 12, fontWeight: 600, color: '#8F9484' }}>
                    {b.aar}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <Link
          href="/profil"
          className="no-underline flex items-center"
          style={{ gap: 4, marginTop: 22, fontFamily: sans, fontSize: 13.5, fontWeight: 650, color: '#314829' }}
        >
          Se alle milepæle
          <ChevronRight style={{ width: 17, height: 17 }} strokeWidth={2.4} aria-hidden />
        </Link>
      </div>
    </section>
  )
}
