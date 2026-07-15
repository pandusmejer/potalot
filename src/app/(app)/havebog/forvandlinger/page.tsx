import Link from 'next/link'
import {
  FORVANDLINGER,
  KATEGORI_LABEL,
  KATEGORI_FARVE,
  type ForvandlingKategori,
} from '@/lib/havebog-forvandlinger'
import { ForvandlingTilbageLink } from '@/components/havebog/forvandling-tilbage-link'

export const dynamic = 'force-static'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const KAT_ORDEN: ForvandlingKategori[] = ['spis', 'gem', 'toer', 'bryg', 'duft', 'plej', 'pynt', 'saa-igen', 'natur']

/**
 * "Det kan haven blive til" — oversigt over forvandlinger grupperet efter
 * kategori. Havens output-univers: mad, konservering, tørring, bryg, duft,
 * pleje, pynt og frøavl.
 */
export default function ForvandlingerPage() {
  return (
    <div className="w-full" style={{ paddingBottom: 40 }}>
      {/* Kom brugeren via "Se alle forvandlinger" fra Havebog-mosaikken
          (?from=havebog), fører tilbage til mosaik-ankeret; ellers til Havebog. */}
      <ForvandlingTilbageLink fallbackHref="/" fallbackLabel="Havebog" />

      <p className="uppercase" style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.24em', color: '#8F9484', margin: 0, marginBottom: 8 }}>
        Forvandlinger
      </p>
      <h1 style={{ fontFamily: serif, fontWeight: 500, fontSize: 'clamp(34px, 9vw, 44px)', lineHeight: 1.03, letterSpacing: '-0.02em', color: '#1F2D1D', margin: '0 0 12px' }}>
        Det kan haven blive til
      </h1>
      {/* Redaktionel status: Forvandlinger er inspiration, ikke et færdigt
          høst-/lagersystem — så vi lover ikke mere, end der er. */}
      <p style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(16px, 4vw, 18px)', lineHeight: 1.4, color: '#5F6658', margin: '0 0 28px', maxWidth: '32ch' }}>
        Inspiration til det, haven kan blive til.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        {KAT_ORDEN.map(kat => {
          const idéer = FORVANDLINGER.filter(f => f.category === kat)
          if (idéer.length === 0) return null
          return (
            <section key={kat}>
              <div className="flex items-center" style={{ gap: 9, marginBottom: 12 }}>
                <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: KATEGORI_FARVE[kat] }} />
                <span className="uppercase" style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(36,48,31,0.6)' }}>
                  {KATEGORI_LABEL[kat]}
                </span>
              </div>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {idéer.map(f => (
                  <Link
                    key={f.id}
                    href={`/havebog/forvandlinger/${f.id}`}
                    className="no-underline"
                    style={{ fontFamily: serif, fontWeight: 400, fontSize: 19, color: '#24301F', background: 'rgba(59,74,47,0.055)', borderRadius: 12, padding: '9px 15px' }}
                  >
                    {f.title}
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
